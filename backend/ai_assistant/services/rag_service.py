# ai_assistant/services/rag_service.py
"""
RAG (Retrieval-Augmented Generation) pipeline for Finexa AI.

Pipeline:
  1. Chunk  — split document text into overlapping chunks
  2. Embed  — convert chunks to vector embeddings
  3. Store  — persist chunks + embeddings in DocumentChunk (SQL)
  4. Retrieve — cosine similarity search for a user query
  5. Generate — pass top-k chunks to LLM for a grounded answer

Embedding strategy (in priority order):
  a) OpenAI text-embedding-3-small  (if OPENAI_DIRECT_API_KEY is set)
  b) Local sentence-transformers    (all-MiniLM-L6-v2, 384-dim, CPU, free)
"""

from __future__ import annotations

import json
import logging
import math
from typing import List, Optional

from django.conf import settings

logger = logging.getLogger(__name__)


# ── Chunking ────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = None, chunk_overlap: int = None) -> List[str]:
    """
    Split text into overlapping chunks using LangChain's RecursiveCharacterTextSplitter.
    Falls back to a simple sliding-window split if LangChain is unavailable.
    """
    chunk_size = chunk_size or getattr(settings, "RAG_CHUNK_SIZE", 800)
    chunk_overlap = chunk_overlap or getattr(settings, "RAG_CHUNK_OVERLAP", 150)

    if not text or not text.strip():
        return []

    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        chunks = splitter.split_text(text)
        return [c.strip() for c in chunks if c.strip()]
    except Exception as e:
        logger.warning("LangChain splitter unavailable (%s), using simple split", e)
        # Simple sliding-window fallback
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end].strip())
            start += chunk_size - chunk_overlap
        return [c for c in chunks if c]


# ── Embeddings ──────────────────────────────────────────────────

_local_model = None  # lazy-loaded sentence-transformers model


def _embed_with_openai(texts: List[str]) -> List[List[float]]:
    """Use OpenAI text-embedding-3-small via direct API."""
    from openai import OpenAI
    client = OpenAI(
        api_key=settings.OPENAI_DIRECT_API_KEY,
        base_url=settings.OPENAI_DIRECT_BASE_URL,
    )
    model = getattr(settings, "EMBEDDING_MODEL", "text-embedding-3-small")
    response = client.embeddings.create(input=texts, model=model)
    return [item.embedding for item in response.data]


def _embed_with_local(texts: List[str]) -> List[List[float]]:
    """Use sentence-transformers (all-MiniLM-L6-v2) — no API key needed."""
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading local sentence-transformers model (first use)…")
        _local_model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = _local_model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.tolist()


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed a list of strings.
    Tries OpenAI first; falls back to local sentence-transformers.
    """
    if not texts:
        return []

    if getattr(settings, "OPENAI_DIRECT_API_KEY", None):
        try:
            return _embed_with_openai(texts)
        except Exception as e:
            logger.warning("OpenAI embedding failed (%s), falling back to local model", e)

    return _embed_with_local(texts)


def embed_query(query: str) -> List[float]:
    """Embed a single query string."""
    return embed_texts([query])[0]


# ── Cosine similarity ───────────────────────────────────────────

def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


# ── Indexing (chunk + embed + store) ───────────────────────────

def index_document(document) -> int:
    """
    Chunk, embed, and store a Document object.
    Deletes existing chunks for the document before re-indexing.
    Returns the number of chunks created.
    """
    from ai_assistant.models import DocumentChunk

    text = document.content or ""
    if not text.strip():
        logger.warning("Document %s has no content to index", document.id)
        return 0

    # Remove stale chunks
    DocumentChunk.objects.filter(document=document).delete()

    chunks = chunk_text(text)
    if not chunks:
        return 0

    # Embed in batches of 50 to stay within API limits
    batch_size = 50
    all_embeddings: List[List[float]] = []
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i: i + batch_size]
        all_embeddings.extend(embed_texts(batch))

    # Bulk-create DocumentChunk rows
    chunk_objs = [
        DocumentChunk(
            document=document,
            chunk_index=idx,
            text=chunk,
            embedding=json.dumps(embedding),
        )
        for idx, (chunk, embedding) in enumerate(zip(chunks, all_embeddings))
    ]
    DocumentChunk.objects.bulk_create(chunk_objs)
    logger.info("Indexed %d chunks for document %s", len(chunk_objs), document.id)
    return len(chunk_objs)


# ── Retrieval ───────────────────────────────────────────────────

def retrieve_chunks(
    query: str,
    user_id: int,
    document_id: Optional[int] = None,
    top_k: int = None,
) -> List[dict]:
    """
    Retrieve the top-k most relevant chunks for a query.

    Args:
        query: User's question
        user_id: Filter chunks by document owner
        document_id: Optionally restrict to a specific document
        top_k: Number of chunks to return (default: RAG_TOP_K setting)

    Returns:
        List of dicts with keys: text, chunk_index, document_id, score
    """
    from ai_assistant.models import DocumentChunk, Document

    top_k = top_k or getattr(settings, "RAG_TOP_K", 5)

    # Filter chunks by user and optionally document
    doc_qs = Document.objects.filter(user_id=user_id)
    if document_id:
        doc_qs = doc_qs.filter(id=document_id)
    doc_ids = list(doc_qs.values_list("id", flat=True))

    if not doc_ids:
        return []

    chunks_qs = DocumentChunk.objects.filter(document_id__in=doc_ids)
    if not chunks_qs.exists():
        return []

    # Embed the query
    query_vec = embed_query(query)

    # Score all chunks (fast enough for personal-scale data)
    scored = []
    for chunk in chunks_qs.select_related("document"):
        try:
            emb = json.loads(chunk.embedding)
        except Exception:
            continue
        score = _cosine_similarity(query_vec, emb)
        scored.append({
            "text": chunk.text,
            "chunk_index": chunk.chunk_index,
            "document_id": chunk.document_id,
            "document_name": chunk.document.file_name,
            "score": score,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]


# ── Generation ──────────────────────────────────────────────────

def retrieve_and_generate(
    question: str,
    user_id: int,
    document_id: Optional[int] = None,
    chat_history: Optional[List[dict]] = None,
) -> dict:
    """
    Full RAG pipeline: retrieve relevant chunks → build prompt → call LLM.

    Args:
        question: User's question
        user_id: User ID (for chunk filtering)
        document_id: Optionally restrict retrieval to one document
        chat_history: List of {"role": "user"|"assistant", "content": "..."} for context

    Returns:
        dict with keys: answer, sources (list of chunk previews)
    """
    from .llm_client import generate_text

    chunks = retrieve_chunks(question, user_id, document_id)

    if not chunks:
        return {
            "answer": (
                "I couldn't find any relevant information in your documents. "
                "Please upload a bank statement or receipt first."
            ),
            "sources": [],
        }

    # Build context from retrieved chunks
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        context_parts.append(
            f"[Source {i} — {chunk['document_name']}]\n{chunk['text']}"
        )
    context_str = "\n\n---\n\n".join(context_parts)

    # Build history string
    history_str = ""
    if chat_history:
        lines = []
        for msg in chat_history[-6:]:  # last 3 exchanges
            role = "User" if msg.get("role") == "user" else "Assistant"
            lines.append(f"{role}: {msg.get('content', '')}")
        history_str = "\n".join(lines)

    system_prompt = """You are Finexa AI, a smart personal finance assistant.

You have access to the user's financial documents (bank statements, receipts, invoices).
Answer ONLY based on the provided document excerpts. Be concise, specific, and use numbers
from the documents. If the answer is not in the documents, say so clearly.

Format rules:
- Keep answers under 4 sentences unless a list is needed
- Use ₹ for Indian Rupee amounts
- For spending decisions: start with YES or NO in bold
- Always cite which document you found the data in
"""

    user_content = ""
    if history_str:
        user_content += f"Conversation so far:\n{history_str}\n\n"

    user_content += (
        f"User question: {question}\n\n"
        f"Relevant excerpts from documents:\n{context_str}\n\n"
        "Answer:"
    )

    answer = generate_text(
        user_prompt=user_content,
        system_prompt=system_prompt,
        temperature=0.3,
        max_output_tokens=600,
    )

    sources = [
        {
            "document_name": c["document_name"],
            "document_id": c["document_id"],
            "preview": c["text"][:200] + "…" if len(c["text"]) > 200 else c["text"],
            "relevance_score": round(c["score"], 3),
        }
        for c in chunks
    ]

    return {"answer": answer, "sources": sources}

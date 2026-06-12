# ai_assistant/services/unified_rag_chat.py
"""
Unified RAG-powered document chat service.

Replaces document_chat.py  (SQL-backed chunks)
     and expense_chat.py   (MongoDB raw_text + in-RAM embedding cache).

Security model
──────────────
  • PDF chunks + embeddings → SQL DocumentChunk
      - chunk text   : EncryptedTextField  (AES-256 at rest)
      - embedding    : plain JSON floats   (vectors carry no PII)
  • Structured expense metadata → MongoDB extracted_data (encrypt_json)
  • raw_text is NOT stored in MongoDB; only SQL DocumentChunk holds it.
  • LLM receives ONLY the top-K retrieved chunk texts — never the full
    document or a raw JSON dump of all expenses.

Flow
────
  1. Caller provides user_id + question + optional document_id / mongo_id
  2. Resolve document_id:
       • If document_id given   → use directly
       • If mongo_id given       → look up SQL Document by mongo_doc_id
       • If neither              → search across all user documents
  3. Ensure document is indexed (lazy index on first chat)
  4. retrieve_chunks() → top-K SQL chunks via cosine similarity
  5. Build prompt with ONLY retrieved chunks + last-N chat history
  6. Call LLM → return answer + source metadata
"""

from __future__ import annotations

import logging
from typing import Optional, List

from .rag_service import retrieve_and_generate, index_document, retrieve_chunks

logger = logging.getLogger(__name__)


# ── Lazy indexing helpers ────────────────────────────────────────────────────

def _ensure_indexed(document) -> bool:
    """
    Index a document if no chunks exist yet.

    Returns True if the document has (or now has) chunks, False if it
    cannot be indexed (no content).
    """
    from ai_assistant.models import DocumentChunk

    if DocumentChunk.objects.filter(document=document).exists():
        return True

    logger.info("Lazy-indexing document %s for the first time", document.id)
    count = index_document(document)
    return count > 0


def _resolve_document_id(
    user_id: int,
    document_id: Optional[int],
    mongo_id: Optional[str],
) -> Optional[int]:
    """
    Resolve which SQL document_id to use.

    Priority:
      1. Explicit document_id (already an int)
      2. mongo_id → look up Document.mongo_doc_id in SQL
      3. None → search across all user documents (retrieve_and_generate handles this)

    Raises ValueError if mongo_id is given but no matching SQL Document exists
    (Option B: clean break — caller should prompt user to re-upload).
    """
    if document_id:
        return int(document_id)

    if mongo_id:
        from ai_assistant.models import Document
        doc = Document.objects.filter(
            user_id=user_id, mongo_doc_id=mongo_id
        ).first()
        if doc is None:
            raise ValueError(
                "no_sql_document"  # sentinel — caller converts to user message
            )
        return doc.id

    return None  # broad search across all user docs


# ── Public API ───────────────────────────────────────────────────────────────

def chat_with_documents(
    question: str,
    user_id: int,
    document_id: Optional[int] = None,
    mongo_id: Optional[str] = None,
    chat_history: Optional[List[dict]] = None,
) -> dict:
    """
    Answer a user's question using RAG over their uploaded documents.

    All retrieval is performed against the SQL DocumentChunk vector store.
    MongoDB is never queried for retrieval; it holds only encrypted metadata
    used by summary/suggestion views.

    Args:
        question:     The user's natural-language question.
        user_id:      Owner of the documents to search.
        document_id:  Restrict retrieval to one specific SQL document (optional).
        mongo_id:     MongoDB expense document id — resolved to its SQL
                      counterpart via Document.mongo_doc_id (optional).
        chat_history: Previous messages [{"role": "user"|"assistant",
                      "content": "..."}].

    Returns:
        {
            "answer":  str,
            "sources": [{"document_name", "document_id", "preview",
                         "relevance_score"}, ...]
        }

    Raises:
        ValueError("no_sql_document") if mongo_id is given but the document
        was uploaded before chunked indexing was introduced. The caller should
        surface a "Please re-upload this document" message to the user.
    """
    # 1. Resolve which document(s) to search
    resolved_doc_id = _resolve_document_id(user_id, document_id, mongo_id)

    # 2. Lazy-index the targeted document(s)
    if resolved_doc_id is not None:
        from ai_assistant.models import Document
        try:
            doc = Document.objects.get(id=resolved_doc_id, user_id=user_id)
        except Document.DoesNotExist:
            return {
                "answer": "Document not found. Please check the document ID.",
                "sources": [],
            }
        has_chunks = _ensure_indexed(doc)
        if not has_chunks:
            return {
                "answer": (
                    "This document has no extractable text. "
                    "Please try re-uploading a text-based PDF."
                ),
                "sources": [],
            }
    else:
        # Lazy-index ALL user documents that are not yet indexed
        from ai_assistant.models import Document
        for doc in Document.objects.filter(user_id=user_id):
            _ensure_indexed(doc)  # silently skip if no content

    # 3. Retrieve top-K chunks + generate answer (chunks-only prompt)
    result = retrieve_and_generate(
        question=question,
        user_id=user_id,
        document_id=resolved_doc_id,
        chat_history=chat_history or [],
    )

    if not result.get("sources"):
        # No relevant chunks found — give a graceful "not found" answer
        # rather than returning the LLM's hallucinated response
        return {
            "answer": result.get(
                "answer",
                "I could not find relevant information in your documents. "
                "Please try rephrasing your question or upload the relevant document.",
            ),
            "sources": [],
        }

    return result

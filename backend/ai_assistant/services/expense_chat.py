# ai_assistant/services/expense_chat.py
"""
RAG-powered chat over Mongo expense documents.

Replaces the previous naive keyword-overlap context builder with real
cosine-similarity retrieval using vector embeddings.
"""
import json
from typing import List, Dict, Optional

from .llm_client import generate_text
from .rag_service import embed_query, embed_texts, _cosine_similarity, chunk_text


# ── In-process embedding cache for Mongo docs ───────────────────
# Key: mongo_doc_id  →  Value: list of {text, embedding}
_DOC_EMBED_CACHE: Dict[str, List[dict]] = {}


def _get_or_build_doc_embeddings(mongo_doc: dict) -> List[dict]:
    """
    Chunk and embed the raw_text from a Mongo expense document.
    Results are cached in memory for the lifetime of the process.
    """
    doc_id = str(mongo_doc.get("_id", ""))
    if doc_id and doc_id in _DOC_EMBED_CACHE:
        return _DOC_EMBED_CACHE[doc_id]

    raw_text = mongo_doc.get("raw_text") or ""
    chunks = chunk_text(raw_text)
    if not chunks:
        return []

    embeddings = embed_texts(chunks)
    entries = [
        {"text": chunk, "embedding": emb}
        for chunk, emb in zip(chunks, embeddings)
    ]

    if doc_id:
        _DOC_EMBED_CACHE[doc_id] = entries
    return entries


def _retrieve_from_mongo_doc(question: str, mongo_doc: dict, top_k: int = 5) -> str:
    """
    Retrieve the most relevant raw_text chunks from a Mongo expense document
    using cosine similarity between question and chunk embeddings.
    """
    entries = _get_or_build_doc_embeddings(mongo_doc)
    if not entries:
        return ""

    query_vec = embed_query(question)
    scored = sorted(
        entries,
        key=lambda e: _cosine_similarity(query_vec, e["embedding"]),
        reverse=True,
    )
    top = scored[:top_k]
    return "\n\n".join(e["text"] for e in top)


def chat_with_expense_data(
    question: str,
    expense_doc: dict,
    chat_history: Optional[List[dict]] = None,
) -> str:
    """
    Answer a question using RAG over a Mongo expense document.

    Context layers (richest to most compact):
      1. Retrieved raw_text chunks (semantic similarity)
      2. Structured extracted_data (summary + top 80 expenses)

    Args:
        question:     User's question
        expense_doc:  Mongo document dict (decrypted)
        chat_history: Previous conversation messages

    Returns:
        LLM-generated answer grounded in the expense data.
    """
    extracted = expense_doc.get("extracted_data") or {}
    if isinstance(extracted, str):
        try:
            extracted = json.loads(extracted)
        except json.JSONDecodeError:
            extracted = {}

    expenses: List[Dict] = (extracted.get("expenses") or [])[:80]
    summary: Dict = extracted.get("summary") or {}

    # Semantic retrieval from raw text
    rag_context = _retrieve_from_mongo_doc(question, expense_doc)

    context_json = {
        "summary": summary,
        "sample_expenses": expenses,
    }

    # Build history string
    history_str = ""
    if chat_history:
        lines = []
        for msg in (chat_history or [])[-6:]:
            role = "User" if msg.get("role") == "user" else "Assistant"
            lines.append(f"{role}: {msg.get('content', '')}")
        history_str = "\n".join(lines)

    system_prompt = """You are Finexa AI, an agentic financial decision assistant.

You have access to the user's financial data extracted from their uploaded statements:
  - A structured JSON summary of expenses
  - A sample list of individual expense records
  - Relevant raw text excerpts retrieved semantically

YOUR RULES:
- Answer ONLY from the provided data
- Be specific with amounts, dates, and categories
- Keep answers concise (2-4 lines unless a list is needed)
- Use ₹ for Indian Rupee amounts
- For spend/buy decisions: start with **YES** or **NO** then one line of reasoning
- Show confidence: (High / Medium / Low confidence)
- If data is insufficient, say clearly what is missing
"""

    user_content = ""
    if history_str:
        user_content += f"Previous conversation:\n{history_str}\n\n"

    user_content += (
        f"User question: {question}\n\n"
        "Structured expense data (JSON):\n"
        f"{json.dumps(context_json, ensure_ascii=False)}\n\n"
        "Relevant text from the uploaded document (semantic search):\n"
        f"{rag_context}\n\n"
        "Answer:"
    )

    response_text = generate_text(
        user_prompt=user_content,
        system_prompt=system_prompt,
        temperature=0.3,
        max_output_tokens=700,
    )

    return response_text

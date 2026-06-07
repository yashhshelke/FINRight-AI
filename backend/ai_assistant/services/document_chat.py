# ai_assistant/services/document_chat.py
"""
Real RAG-powered document chat.

Replaces the previous mock implementation that returned hardcoded strings.
All answers are now grounded in the user's actual uploaded documents
via the RAG pipeline in rag_service.py.
"""
from typing import Optional, List

from .rag_service import retrieve_and_generate, index_document


def ensure_document_indexed(document) -> None:
    """
    Index a document if it has no chunks yet.
    Call this lazily before the first chat query on a document.
    """
    from ai_assistant.models import DocumentChunk
    if not DocumentChunk.objects.filter(document=document).exists():
        index_document(document)


def chat_with_document(
    question: str,
    user_id: int,
    document_id: Optional[int] = None,
    chat_history: Optional[List[dict]] = None,
) -> str:
    """
    Answer a user's question using RAG over their uploaded documents.

    Args:
        question:     The user's question
        user_id:      Owner of the documents to search
        document_id:  Optionally restrict retrieval to one specific document
        chat_history: Previous messages [{"role": "user"|"assistant", "content": "..."}]

    Returns:
        Answer string from the LLM, grounded in retrieved document chunks.
    """
    from ai_assistant.models import Document

    # Ensure targeted document is indexed (lazy indexing)
    if document_id:
        try:
            doc = Document.objects.get(id=document_id, user_id=user_id)
            ensure_document_indexed(doc)
        except Document.DoesNotExist:
            return "Document not found. Please check the document ID."
    else:
        # Lazy-index any unindexed documents for this user
        docs = Document.objects.filter(user_id=user_id)
        for doc in docs:
            ensure_document_indexed(doc)

    result = retrieve_and_generate(
        question=question,
        user_id=user_id,
        document_id=document_id,
        chat_history=chat_history or [],
    )
    return result.get("answer", "I was unable to find an answer in your documents.")

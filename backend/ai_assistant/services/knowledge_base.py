"""Verified financial knowledge base with optional Qdrant support.

The backend always exposes a deterministic internal knowledge source. If Qdrant
is configured, documents are indexed and searched there. If not, the same
content is searched locally so the feature works in development and during
offline validation.

Embedding strategy
──────────────────
All vectorisation now delegates to rag_service.embed_texts / embed_query —
the single canonical embedding engine for Finexa AI.  This replaces the
previous bag-of-words hash-vector approach that was duplicated here, ensuring:
  • Consistent embedding quality across user-PDF retrieval and KB search
  • A single model load (sentence-transformers or OpenAI) shared across modules
  • Real semantic similarity instead of token overlap
"""

from __future__ import annotations

import logging
import os
from typing import Dict, Iterable, List, Optional

# ── Canonical embedding + similarity primitives from rag_service ─────────────
# knowledge_base deliberately does NOT re-implement embeddings or cosine math.
# Import from the single source of truth.
from .rag_service import cosine_similarity, embed_query, embed_texts

logger = logging.getLogger(__name__)

DEFAULT_KNOWLEDGE_ARTICLES = [
    {
        "id": "kb_budgeting_001",
        "title": "Budgeting Basics",
        "topic": "budgeting",
        "source": "Finexa Internal Knowledge Base - Budgeting Concepts",
        "summary": "A budget assigns every rupee a purpose and helps prevent overspending.",
        "content": "A budget helps users plan spending, protect savings, and align money with goals.",
        "keywords": ["budget", "budgeting", "spending plan", "overspend", "expense plan"],
    },
    {
        "id": "kb_emergency_001",
        "title": "Emergency Fund Basics",
        "topic": "emergency_fund",
        "source": "Finexa Internal Knowledge Base - Emergency Funds",
        "summary": "An emergency fund is a liquid reserve that covers essential expenses during income disruption.",
        "content": "Emergency funds are usually held in cash-like, accessible accounts and should cover several months of essentials.",
        "keywords": ["emergency fund", "rainy day", "liquid reserve", "safety net"],
    },
    {
        "id": "kb_sip_001",
        "title": "SIP Education",
        "topic": "sip",
        "source": "Finexa Internal Knowledge Base - SIP Education",
        "summary": "A SIP is a disciplined way to invest a fixed amount regularly in a mutual fund.",
        "content": "A SIP spreads investing over time and helps build consistency for long-term goals.",
        "keywords": ["sip", "systematic investment plan", "mutual fund", "index fund"],
    },
    {
        "id": "kb_tax_001",
        "title": "Tax Concepts",
        "topic": "tax",
        "source": "Finexa Internal Knowledge Base - Tax Concepts",
        "summary": "Tax planning should use verified records and eligible deductions, not guesses.",
        "content": "Tax concepts in Finexa are educational and should always be validated against actual income and official rules.",
        "keywords": ["tax", "deduction", "tax saving", "income tax", "itr"],
    },
]


def _article_text(article: Dict[str, str]) -> str:
    """Flatten all searchable fields of an article into one string for embedding."""
    parts = [
        article.get("title", ""),
        article.get("summary", ""),
        article.get("content", ""),
        " ".join(article.get("keywords", [])),
    ]
    return " ".join(p for p in parts if p)


class VerifiedKnowledgeBase:
    """
    Searchable store of curated financial knowledge articles.

    Two search backends (tried in order):
      1. Qdrant cloud vector DB  (if QDRANT_URL is set)
      2. In-process cosine similarity using real ML embeddings
         (via rag_service.embed_query / cosine_similarity)

    The in-process path builds embeddings lazily on first search and caches
    them for the lifetime of the process.
    """

    def __init__(self) -> None:
        self._qdrant_client = None
        self._qdrant_models = None
        self._collection_name = os.getenv("QDRANT_COLLECTION_NAME", "finexa_knowledge")
        self._articles: List[Dict[str, str]] = list(DEFAULT_KNOWLEDGE_ARTICLES)
        # Lazy cache: article index → embedding vector (populated on first search)
        self._embeddings: Optional[List[List[float]]] = None
        self._init_qdrant()

    # ── Qdrant initialisation ────────────────────────────────────────────────

    def _init_qdrant(self) -> None:
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        if not qdrant_url:
            return

        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http import models as qdrant_models
        except Exception as exc:
            logger.warning("Qdrant client not installed (%s); using local search", exc)
            return

        try:
            self._qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
            self._qdrant_models = qdrant_models
            self._ensure_qdrant_collection()
            self._seed_qdrant_collection()
            logger.info("Qdrant knowledge base ready (%s)", self._collection_name)
        except Exception as exc:
            logger.warning("Qdrant init failed (%s); falling back to local search", exc)
            self._qdrant_client = None

    def _vector_size(self) -> int:
        """
        Determine the embedding dimension by running a test embed.
        This ensures the Qdrant collection is always created with the correct
        size regardless of whether OpenAI or sentence-transformers is in use.
        """
        try:
            sample = embed_texts(["dimension probe"])
            return len(sample[0])
        except Exception:
            return 384  # safe default for all-MiniLM-L6-v2

    def _ensure_qdrant_collection(self) -> None:
        if not self._qdrant_client:
            return
        existing = [c.name for c in self._qdrant_client.get_collections().collections]
        if self._collection_name not in existing:
            size = self._vector_size()
            self._qdrant_client.create_collection(
                collection_name=self._collection_name,
                vectors_config=self._qdrant_models.VectorParams(
                    size=size,
                    distance=self._qdrant_models.Distance.COSINE,
                ),
            )
            logger.info(
                "Created Qdrant collection '%s' with dim=%d",
                self._collection_name, size,
            )

    def _seed_qdrant_collection(self) -> None:
        """Upsert all articles into Qdrant using real ML embeddings."""
        if not self._qdrant_client:
            return
        texts = [_article_text(a) for a in self._articles]
        vectors = embed_texts(texts)
        points = [
            self._qdrant_models.PointStruct(
                id=idx + 1,
                vector=vector,
                payload=article,
            )
            for idx, (article, vector) in enumerate(zip(self._articles, vectors))
        ]
        if points:
            self._qdrant_client.upsert(collection_name=self._collection_name, points=points)

    # ── Local (in-process) search ────────────────────────────────────────────

    def _ensure_article_embeddings(self) -> List[List[float]]:
        """
        Build and cache real ML embeddings for all articles.
        Called lazily on the first local search so module import stays fast.
        """
        if self._embeddings is not None and len(self._embeddings) == len(self._articles):
            return self._embeddings

        texts = [_article_text(a) for a in self._articles]
        try:
            self._embeddings = embed_texts(texts)
        except Exception as exc:
            logger.warning("Could not embed KB articles (%s); search will return empty", exc)
            self._embeddings = []
        return self._embeddings

    # ── Public search ────────────────────────────────────────────────────────

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, str]]:
        """
        Return the top_k most relevant articles for a query.

        Tries Qdrant first; falls back to in-process cosine similarity using
        the same ML embeddings as the user-PDF RAG pipeline.
        """
        if not query.strip():
            return []

        # 1. Qdrant path
        if self._qdrant_client:
            try:
                query_vec = embed_query(query)
                results = self._qdrant_client.search(
                    collection_name=self._collection_name,
                    query_vector=query_vec,
                    limit=top_k,
                )
                return [r.payload for r in results if r.payload]
            except Exception as exc:
                logger.warning("Qdrant search failed (%s); falling back to local", exc)

        # 2. Local cosine similarity path (uses real ML embeddings)
        article_embeddings = self._ensure_article_embeddings()
        if not article_embeddings:
            return []

        query_vec = embed_query(query)
        scored = sorted(
            (
                (cosine_similarity(query_vec, emb), article)
                for article, emb in zip(self._articles, article_embeddings)
            ),
            key=lambda item: item[0],
            reverse=True,
        )
        return [article for score, article in scored if score > 0.0][:top_k]

    # ── Write API ────────────────────────────────────────────────────────────

    def upsert_articles(self, articles: Iterable[Dict[str, str]]) -> int:
        """
        Add new articles to the knowledge base (both Qdrant and local store).
        Returns the count of articles added.
        """
        article_list = list(articles)
        if not article_list:
            return 0

        if self._qdrant_client:
            try:
                texts = [_article_text(a) for a in article_list]
                vectors = embed_texts(texts)
                start_id = len(self._articles) + 1
                points = [
                    self._qdrant_models.PointStruct(
                        id=start_id + offset,
                        vector=vector,
                        payload=article,
                    )
                    for offset, (article, vector) in enumerate(zip(article_list, vectors))
                ]
                self._qdrant_client.upsert(
                    collection_name=self._collection_name, points=points
                )
            except Exception as exc:
                logger.warning("Qdrant upsert failed (%s); articles added to local only", exc)

        self._articles.extend(article_list)
        # Invalidate embedding cache so next search re-embeds the full list
        self._embeddings = None
        return len(article_list)

    @property
    def articles(self) -> List[Dict[str, str]]:
        return list(self._articles)


# Module-level singleton — initialised once at import time
knowledge_base = VerifiedKnowledgeBase()


# ── Public API (identical to previous version — all callers unaffected) ──────

def search_verified_knowledge(query: str, top_k: int = 3) -> List[Dict[str, str]]:
    """Search the curated financial knowledge base for the most relevant articles."""
    return knowledge_base.search(query, top_k=top_k)


def get_verified_articles() -> List[Dict[str, str]]:
    """Return all articles currently in the knowledge base."""
    return knowledge_base.articles


def seed_verified_articles(articles: Iterable[Dict[str, str]]) -> int:
    """Add articles to the knowledge base. Returns count added."""
    return knowledge_base.upsert_articles(articles)

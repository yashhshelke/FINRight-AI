"""Verified financial knowledge base with optional Qdrant support.

The backend always exposes a deterministic internal knowledge source. If Qdrant
is configured, documents are indexed and searched there. If not, the same
content is searched locally so the feature works in development and during
offline validation.
"""

from __future__ import annotations

import math
import os
import re
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional

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


def _tokenize(text: str) -> List[str]:
    return [token for token in re.split(r"[^a-z0-9]+", text.lower()) if token]


def _local_score(query: str, article: Dict[str, str]) -> float:
    query_tokens = set(_tokenize(query))
    haystack = " ".join([article.get("title", ""), article.get("summary", ""), article.get("content", ""), " ".join(article.get("keywords", []))])
    article_tokens = set(_tokenize(haystack))
    overlap = len(query_tokens & article_tokens)
    if not overlap:
        return 0.0
    return overlap / max(1, len(query_tokens))


class VerifiedKnowledgeBase:
    def __init__(self):
        self._client = None
        self._collection_name = os.getenv("QDRANT_COLLECTION_NAME", "finexa_knowledge")
        self._vector_size = int(os.getenv("QDRANT_VECTOR_SIZE", "384"))
        self._articles = DEFAULT_KNOWLEDGE_ARTICLES
        self._init_qdrant()

    def _init_qdrant(self) -> None:
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        if not qdrant_url:
            return

        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http import models as qdrant_models
        except Exception:
            return

        self._client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        self._qdrant_models = qdrant_models
        self._ensure_collection()
        self._seed_collection()

    def _ensure_collection(self) -> None:
        if not self._client:
            return
        existing = [item.name for item in self._client.get_collections().collections]
        if self._collection_name in existing:
            return
        self._client.create_collection(
            collection_name=self._collection_name,
            vectors_config=self._qdrant_models.VectorParams(size=self._vector_size, distance=self._qdrant_models.Distance.COSINE),
        )

    def _seed_collection(self) -> None:
        if not self._client:
            return
        points = []
        for index, article in enumerate(self._articles, start=1):
            vector = self._article_vector(article)
            points.append(
                self._qdrant_models.PointStruct(
                    id=index,
                    vector=vector,
                    payload=article,
                )
            )
        if points:
            self._client.upsert(collection_name=self._collection_name, points=points)

    def _article_vector(self, article: Dict[str, str]) -> List[float]:
        text = " ".join([article.get("title", ""), article.get("summary", ""), article.get("content", "")])
        tokens = _tokenize(text)
        if not tokens:
            return [0.0] * self._vector_size
        counts = {}
        for token in tokens:
            counts[token] = counts.get(token, 0) + 1
        vector = [0.0] * self._vector_size
        for token, count in counts.items():
            slot = abs(hash(token)) % self._vector_size
            vector[slot] += float(count)
        magnitude = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / magnitude for value in vector]

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, str]]:
        if not query.strip():
            return []

        if self._client:
            try:
                query_vector = self._article_vector({"title": query, "summary": query, "content": query})
                results = self._client.search(collection_name=self._collection_name, query_vector=query_vector, limit=top_k)
                return [result.payload for result in results if result.payload]
            except Exception:
                pass

        scored = sorted(
            ((self._local_article_score(query, article), article) for article in self._articles),
            key=lambda item: item[0],
            reverse=True,
        )
        return [article for score, article in scored if score > 0][:top_k]

    def _local_article_score(self, query: str, article: Dict[str, str]) -> float:
        return _local_score(query, article)

    def upsert_articles(self, articles: Iterable[Dict[str, str]]) -> int:
        article_list = list(articles)
        if not article_list:
            return 0

        if self._client:
            points = []
            start_id = len(self._articles) + 1
            for offset, article in enumerate(article_list, start=0):
                points.append(
                    self._qdrant_models.PointStruct(
                        id=start_id + offset,
                        vector=self._article_vector(article),
                        payload=article,
                    )
                )
            self._client.upsert(collection_name=self._collection_name, points=points)

        self._articles.extend(article_list)
        return len(article_list)

    @property
    def articles(self) -> List[Dict[str, str]]:
        return list(self._articles)


knowledge_base = VerifiedKnowledgeBase()


def search_verified_knowledge(query: str, top_k: int = 3) -> List[Dict[str, str]]:
    return knowledge_base.search(query, top_k=top_k)


def get_verified_articles() -> List[Dict[str, str]]:
    return knowledge_base.articles


def seed_verified_articles(articles: Iterable[Dict[str, str]]) -> int:
    return knowledge_base.upsert_articles(articles)

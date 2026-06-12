# core/pagination.py
"""
Shared pagination classes for Finexa AI — MVP 1000-user configuration.

Usage in a view:
    from core.pagination import StandardResultsSetPagination
    class MyListView(generics.ListAPIView):
        pagination_class = StandardResultsSetPagination
"""
from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """
    Default paginator for all list endpoints.
    - 20 items per page (MVP standard)
    - Client can request up to 100 via ?page_size=N
    - Returns total count, next/previous URLs
    """
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            "count":    self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "current_page": self.page.number,
            "next":     self.get_next_link(),
            "previous": self.get_previous_link(),
            "results":  data,
        })

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "required": ["count", "results"],
            "properties": {
                "count":        {"type": "integer", "example": 123},
                "total_pages":  {"type": "integer", "example": 7},
                "current_page": {"type": "integer", "example": 1},
                "next":         {"type": "string",  "nullable": True, "format": "uri"},
                "previous":     {"type": "string",  "nullable": True, "format": "uri"},
                "results":      schema,
            },
        }


class ChatMessageCursorPagination(CursorPagination):
    """
    Stable cursor-based pagination for chat message history.
    Prevents the "page drift" problem when new messages arrive.
    - 50 messages per page
    - Ordered newest-first (for infinite scroll)
    """
    page_size = 50
    ordering = "-created_at"
    cursor_query_param = "cursor"

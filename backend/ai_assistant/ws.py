"""
ai_assistant/ws.py

WebSocket chat consumer stub.
The main chat flow uses the REST endpoint POST /api/ai/chat/.

This file is retained for any real-time WebSocket features but no longer
references the removed Conversation/Message models.
"""
# WebSocket chat is handled by the Django Channels consumer in sockets/consumers.py.
# See sockets/routing.py for URL routing.

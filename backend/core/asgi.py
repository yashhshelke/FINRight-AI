"""
ASGI config for Finexa AI — supports HTTP + WebSocket via Django Channels.
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from sockets.auth import TokenAuthMiddlewareStack

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

django_asgi_app = get_asgi_application()

from sockets.routing import websocket_urlpatterns

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": TokenAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        ),
    }
)

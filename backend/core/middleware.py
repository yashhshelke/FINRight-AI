import logging
import json
import time
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve

# Create a logger dedicated to security/audit logs
audit_logger = logging.getLogger('security_audit')

class AuditLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all sensitive API requests for security compliance (SOC2/PCI-DSS).
    Logs the user ID, method, path, IP, and execution time.
    """
    SENSITIVE_PREFIXES = ('/api/transactions', '/api/ai', '/auth')

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')

    def process_request(self, request):
        request.start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
        else:
            duration = 0.0

        path = request.path
        if not path.startswith(self.SENSITIVE_PREFIXES):
            return response

        # Only log authenticated access or authentication attempts
        user_id = "anonymous"
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_id = str(request.user.id)

        log_data = {
            "user_id": user_id,
            "method": request.method,
            "path": path,
            "ip": self.get_client_ip(request),
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
        }

        # Use INFO level for standard access, WARNING for 4xx, ERROR for 5xx
        log_message = json.dumps(log_data)
        if response.status_code >= 500:
            audit_logger.error(log_message)
        elif response.status_code >= 400:
            audit_logger.warning(log_message)
        else:
            audit_logger.info(log_message)

        return response

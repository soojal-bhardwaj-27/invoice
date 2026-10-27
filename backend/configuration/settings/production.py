from django.core.exceptions import ImproperlyConfigured
from .base import *

for name in ("SECRET_KEY", "ALLOWED_HOSTS", "DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST", "REDIS_URL", "FRONTEND_URL", "CSRF_TRUSTED_ORIGINS"):
    if not os.getenv(name):
        raise ImproperlyConfigured(f"{name} is required in production")
if len(SECRET_KEY) < 50 or SECRET_KEY.startswith("invoice-desk"):
    raise ImproperlyConfigured("Use a randomly generated SECRET_KEY of at least 50 characters")
if os.getenv("DB_ENGINE") != "postgresql":
    raise ImproperlyConfigured("Set DB_ENGINE=postgresql in production")
DEBUG = False
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
# Enable only behind a trusted proxy that overwrites this header.
if os.getenv("TRUST_PROXY", "false").lower() == "true":
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

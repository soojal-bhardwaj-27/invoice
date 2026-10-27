"""Exercise the live Next.js -> Django path using disposable local test data."""
import os
import secrets
from uuid import uuid4
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "configuration.settings")
import django
django.setup()
import requests
from django.conf import settings
from django.db import transaction
from myapp.models import User
from invoices.models import Invoice, InvoiceActivity

if not settings.DEBUG:
    raise RuntimeError("This smoke check is restricted to local development.")
base = "http://127.0.0.1:3000"
client = requests.Session()
client.headers["Origin"] = base
email = f"smoke-{uuid4().hex}@example.com"
password = secrets.token_urlsafe(24)
try:
    response = client.get(base + "/api/auth/csrf/", timeout=20)
    response.raise_for_status()
    client.headers["X-CSRFToken"] = response.json()["csrfToken"]
    response = client.post(base + "/api/auth/register/", json={"email": email, "password": password, "full_name": "Temporary integration test"}, timeout=20)
    assert response.status_code == 201, (response.status_code, response.text[:300])
    client.headers["X-CSRFToken"] = response.json()["csrfToken"]
    response = client.post(base + "/api/invoices/", json={"client": "Temporary test client", "number": "SMOKE-001", "amount": "100.50", "due_date": "2026-10-01"}, timeout=20)
    assert response.status_code == 201, (response.status_code, response.text[:300])
    invoice_id = response.json()["id"]
    assert client.get(base + "/api/invoices/?search=SMOKE", timeout=20).json()["count"] == 1
    assert client.get(base + "/api/invoices/summary/", timeout=20).json()["total"] == 1
    assert client.patch(base + f"/api/invoices/{invoice_id}/", json={"paid": True}, timeout=20).json()["status"] == "paid"
    assert b"SMOKE-001" in client.get(base + "/api/invoices/export/", timeout=20).content
    assert client.delete(base + f"/api/invoices/{invoice_id}/", timeout=20).status_code == 204
    assert client.post(base + "/api/auth/logout/", json={}, timeout=20).status_code == 200
    assert client.get(base + "/api/invoices/", timeout=20).status_code in (401, 403)
    print("Live integration passed: CSRF, registration, cookies, invoice CRUD, search, summary, export, logout.")
finally:
    with transaction.atomic():
        users = User.objects.filter(email=email)
        InvoiceActivity.objects.filter(owner__in=users).delete()
        Invoice.objects.filter(owner__in=users).delete()
        users.delete()
    print("Disposable integration test data removed.")

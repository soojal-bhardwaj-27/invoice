from datetime import timedelta
from decimal import Decimal
from django.core import mail
from django.core.cache import cache
from django.contrib.auth.tokens import default_token_generator
from django.test import TestCase
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient
from myapp.models import User
from invoices.models import Invoice, InvoiceActivity

PASSWORD = "Example-Willow-947!long"

class BackendTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="one@example.com", password=PASSWORD, full_name="First User")
        self.other = User.objects.create_user(email="two@example.com", password=PASSWORD, full_name="Second User")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.payload = {"client": "Studio North", "number": "INV-001", "amount": "1234.50",
            "due_date": str(timezone.localdate() - timedelta(days=1))}
        self.invoice = Invoice.objects.create(owner=self.user, **self.payload)

    def test_anonymous_access_denied(self):
        client = APIClient()
        for url in ["/api/invoices/", "/api/invoices/summary/", "/api/invoices/export/", "/api/activity/", "/api/auth/me/", "/api/subscriptions/"]:
            self.assertIn(client.get(url).status_code, [401, 403], url)
        self.assertIn(client.post("/api/invoices/", self.payload, format="json").status_code, [401, 403])

    def test_ownership_enforced_for_every_operation(self):
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/invoices/").data["count"], 0)
        for method in ["get", "patch", "delete"]:
            response = getattr(self.client, method)(f"/api/invoices/{self.invoice.pk}/", {"paid": True}, format="json")
            self.assertEqual(response.status_code, 404)
        self.assertEqual(self.client.get(f"/api/invoices/{self.invoice.pk}/reminder/").status_code, 404)
        self.assertEqual(self.client.get("/api/invoices/summary/").data["total"], 0)
        self.assertNotIn(b"Studio North", self.client.get("/api/invoices/export/").content)

    def test_creation_cannot_assign_another_owner(self):
        response = self.client.post("/api/invoices/", {**self.payload, "number": "INV-002", "owner": self.other.pk}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Invoice.objects.get(pk=response.data["id"]).owner, self.user)
        self.assertEqual(response.data["amount"], "1234.50")
        self.assertEqual(InvoiceActivity.objects.get(invoice_id=response.data["id"]).action, "created")

    def test_duplicate_number_scoped_to_account(self):
        self.assertEqual(self.client.post("/api/invoices/", self.payload, format="json").status_code, 400)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.post("/api/invoices/", self.payload, format="json").status_code, 201)

    def test_invalid_payloads_are_validation_errors(self):
        for payload in [[], None, "text", {}, {**self.payload, "amount": "NaN"},
            {**self.payload, "amount": "0"}, {**self.payload, "amount": "-1"},
            {**self.payload, "amount": "1.234"}, {**self.payload, "amount": "10000000000"},
            {**self.payload, "due_date": "no"}, {**self.payload, "client": "  "}]:
            response = self.client.generic("POST", "/api/invoices/", __import__("json").dumps(payload), content_type="application/json")
            self.assertEqual(response.status_code, 400, (payload, response.data))

    def test_edit_payment_and_delete_audit(self):
        url = f"/api/invoices/{self.invoice.pk}/"
        response = self.client.patch(url, {"client": "Updated", "paid": True}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "paid")
        self.assertIsNotNone(response.data["paid_at"])
        response = self.client.patch(url, {"paid": False}, format="json")
        self.assertIsNone(response.data["paid_at"])
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertEqual(list(InvoiceActivity.objects.order_by("id").values_list("action", flat=True)),
            ["marked_paid", "marked_unpaid", "deleted"])
        self.assertTrue(all(row.invoice_id is None for row in InvoiceActivity.objects.all()))

    def test_summary_filters_search_and_pagination(self):
        Invoice.objects.create(owner=self.user, client="Today", number="INV-002", amount="0.10", due_date=timezone.localdate())
        Invoice.objects.create(owner=self.other, client="Hidden", number="OTHER", amount="999", due_date=timezone.localdate())
        summary = self.client.get("/api/invoices/summary/").data
        self.assertEqual(Decimal(summary["outstanding"]), Decimal("1234.60"))
        self.assertEqual(summary["overdue_count"], 1)
        self.assertEqual(self.client.get("/api/invoices/?status=pending").data["count"], 1)
        self.assertEqual(self.client.get("/api/invoices/?search=North").data["count"], 1)
        self.assertEqual(self.client.get("/api/invoices/?status=bad").status_code, 400)
        for i in range(51):
            Invoice.objects.create(owner=self.user, client="Extra", number=f"EX-{i}", amount="1", due_date=timezone.localdate())
        first = self.client.get("/api/invoices/").data
        self.assertEqual(len(first["results"]), 50)
        self.assertIsNotNone(first["next"])
        self.assertEqual(len(self.client.get("/api/invoices/?page=2").data["results"]), 3)

    def test_reminder_and_csv(self):
        self.assertIn("was due", self.client.get(f"/api/invoices/{self.invoice.pk}/reminder/").data["text"])
        self.invoice.due_date = timezone.localdate()
        self.invoice.client = "=SUM(1,2)"
        self.invoice.save()
        self.assertIn("is due", self.client.get(f"/api/invoices/{self.invoice.pk}/reminder/").data["text"])
        self.assertIn(b"'=SUM", self.client.get("/api/invoices/export/").content)
        self.invoice.paid = True
        self.invoice.save()
        self.assertEqual(self.client.get(f"/api/invoices/{self.invoice.pk}/reminder/").status_code, 400)

    def test_session_login_csrf_logout(self):
        client = APIClient(enforce_csrf_checks=True)
        creds = {"email": self.user.email, "password": PASSWORD}
        self.assertEqual(client.post("/api/auth/login/", creds, format="json").status_code, 403)
        csrf = client.get("/api/auth/csrf/").data["csrfToken"]
        result = client.post("/api/auth/login/", creds, format="json", HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(result.status_code, 200, getattr(result, "data", result.content))
        csrf = result.data["csrfToken"]
        self.assertEqual(client.get("/api/auth/me/").status_code, 200)
        self.assertEqual(client.post("/api/invoices/", {**self.payload, "number": "SESSION"}, format="json").status_code, 403)
        self.assertEqual(client.post("/api/invoices/", {**self.payload, "number": "SESSION"}, format="json", HTTP_X_CSRFTOKEN=csrf).status_code, 201)
        self.assertEqual(client.post("/api/auth/logout/", {}, format="json", HTTP_X_CSRFTOKEN=csrf).status_code, 200)
        self.assertIn(client.get("/api/invoices/").status_code, [401, 403])

    def test_registration_cannot_escalate_or_leak_secrets(self):
        client = APIClient(enforce_csrf_checks=True)
        payload = {"email": "NEW@EXAMPLE.COM", "full_name": "New Person", "password": PASSWORD, "role": "Admin", "is_staff": True}
        self.assertEqual(client.post("/api/auth/register/", payload, format="json").status_code, 403)
        csrf = client.get("/api/auth/csrf/").data["csrfToken"]
        result = client.post("/api/auth/register/", payload, format="json", HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(result.status_code, 201, getattr(result, "data", result.content))
        new = User.objects.get(email="new@example.com")
        self.assertEqual(new.role, "User")
        self.assertFalse(new.is_staff)
        self.assertTrue(new.check_password(PASSWORD))
        self.assertNotIn("password", result.data["user"])
        result = client.patch("/api/auth/me/", {"role": "Admin", "full_name": "New Name"}, format="json", HTTP_X_CSRFTOKEN=result.data["csrfToken"])
        self.assertEqual(result.data["role"], "User")

    def test_jwt_rotation_blacklist_and_password_revocation(self):
        client = APIClient()
        pair = client.post("/api/auth/token/", {"email": self.user.email, "password": PASSWORD}, format="json")
        self.assertEqual(pair.status_code, 200, pair.data)
        client.credentials(HTTP_AUTHORIZATION="Bearer " + pair.data["access"])
        self.assertEqual(client.get("/api/invoices/").status_code, 200)
        rotated = client.post("/api/auth/token/refresh/", {"refresh": pair.data["refresh"]}, format="json")
        self.assertEqual(rotated.status_code, 200, rotated.data)
        self.assertEqual(client.post("/api/auth/token/refresh/", {"refresh": pair.data["refresh"]}, format="json").status_code, 401)
        self.user.set_password("Different-Willow-958!long")
        self.user.save()
        self.assertIn(client.get("/api/invoices/").status_code, [401, 403])
        self.assertEqual(client.post("/api/auth/token/refresh/", {"refresh": rotated.data["refresh"]}, format="json").status_code, 401)

    def test_deleted_account_cannot_authenticate_or_refresh(self):
        client = APIClient()
        pair = client.post("/api/auth/token/", {"email": self.user.email, "password": PASSWORD}, format="json").data
        self.user.is_deleted = 1
        self.user.save()
        self.assertEqual(client.post("/api/auth/token/", {"email": self.user.email, "password": PASSWORD}, format="json").status_code, 400)
        self.assertEqual(client.post("/api/auth/token/refresh/", {"refresh": pair["refresh"]}, format="json").status_code, 401)
        client.credentials(HTTP_AUTHORIZATION="Bearer " + pair["access"])
        self.assertIn(client.get("/api/invoices/").status_code, [401, 403])

    def test_password_reset_link_single_use(self):
        client = APIClient()
        response = client.post("/api/auth/request-password-reset/", {"email": self.user.email}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        data = {"uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
            "token": default_token_generator.make_token(self.user), "new_password": "Another-Willow-926!long"}
        self.assertEqual(client.post("/api/auth/reset-password/", data, format="json").status_code, 200)
        self.assertEqual(client.post("/api/auth/reset-password/", data, format="json").status_code, 400)

    def test_health_schema_admin_and_unmounted_upstream_routes(self):
        client = APIClient()
        self.assertEqual(client.get("/api/health/").json(), {"status": "ok"})
        self.assertEqual(client.get("/api/health/")["X-Robots-Tag"], "noindex, nofollow")
        self.assertIn("no-store", client.get("/api/auth/me/")["Cache-Control"])
        self.assertEqual(client.get("/swagger.json").status_code, 200)
        self.assertEqual(client.get("/admin/login/").status_code, 200)
        self.assertEqual(client.post("/api/auth/register-user/", {}, format="json").status_code, 404)
        self.assertEqual(client.post("/api/payment/create-intent/", {}, format="json").status_code, 404)

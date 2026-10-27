from django.conf import settings
from django.db import models
from django.db.models import Q
from django.core.validators import MinValueValidator
from decimal import Decimal
class Invoice(models.Model):
    client = models.CharField(max_length=150)
    number = models.CharField(max_length=80)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    due_date = models.DateField()
    paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="invoices", null=True, editable=False)
    client_email = models.EmailField(blank=True)
    notes = models.TextField(blank=True, max_length=5000)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(fields=["owner", "number"], name="unique_owner_invoice_number"),
            models.CheckConstraint(condition=Q(amount__gt=0), name="invoice_positive_amount"),
        ]
        indexes = [models.Index(fields=["owner", "paid", "due_date"], name="invoice_owner_status_idx")]

    def __str__(self):
        return f"{self.number} — {self.client}"


class InvoiceActivity(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True)
    invoice_number = models.CharField(max_length=80)
    action = models.CharField(max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class SiteSetting(models.Model):
    site_name = models.CharField(max_length=100, default="Invoice Desk")
    tagline = models.CharField(max_length=255, default="Track client invoices, review overdue balances and prepare payment reminders.")
    logo_text = models.CharField(max_length=100, default="invoice desk")
    logo_icon = models.CharField(max_length=50, default="▧")
    logo_url = models.TextField(blank=True, default="")
    support_phone = models.CharField(max_length=30, blank=True, default="+91 98765 43210")
    whatsapp_number = models.CharField(max_length=30, blank=True, default="+91 98765 43210")
    whatsapp_message = models.CharField(max_length=255, default="Hello! I need assistance with Invoice Desk.")
    support_email = models.EmailField(blank=True, default="support@invoicedesk.com")
    currency_symbol = models.CharField(max_length=10, default="₹")
    announcement_banner = models.CharField(max_length=255, blank=True, default="")
    announcement_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

    def clean_whatsapp(self):
        """Returns clean numeric digits for wa.me URL"""
        return "".join(c for c in self.whatsapp_number if c.isdigit())

    def __str__(self):
        return f"Site Settings: {self.site_name}"

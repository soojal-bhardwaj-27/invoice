from django.utils import timezone
from rest_framework import serializers
from .models import Invoice, InvoiceActivity, SiteSetting

class InvoiceSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    class Meta:
        model = Invoice
        fields = ["id", "client", "client_email", "number", "amount", "due_date", "paid", "paid_at", "notes", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "paid_at", "created_at", "updated_at"]
        validators = []

    def get_status(self, invoice):
        return "paid" if invoice.paid else "overdue" if invoice.due_date < timezone.localdate() else "pending"

    def validate_number(self, value):
        existing = Invoice.objects.filter(owner=self.context["request"].user, number=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("This invoice number is already used.")
        return value

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceActivity
        fields = ["id", "invoice", "invoice_number", "action", "created_at"]

class SiteSettingSerializer(serializers.ModelSerializer):
    clean_whatsapp = serializers.CharField(read_only=True)
    class Meta:
        model = SiteSetting
        fields = [
            "id", "site_name", "tagline", "logo_text", "logo_icon", "logo_url",
            "support_phone", "whatsapp_number", "whatsapp_message", "support_email",
            "currency_symbol", "announcement_banner", "announcement_enabled",
            "clean_whatsapp", "updated_at"
        ]
        read_only_fields = ["id", "updated_at", "clean_whatsapp"]

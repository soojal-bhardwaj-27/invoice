from django.contrib import admin
from .models import Invoice, InvoiceActivity, SiteSetting

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["number", "client", "amount", "due_date", "paid", "owner"]
    list_filter = ["paid", "due_date"]
    search_fields = ["number", "client", "owner__email"]
    readonly_fields = ["owner", "created_at", "updated_at", "paid_at"]
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

@admin.register(InvoiceActivity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["invoice_number", "action", "owner", "created_at"]
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ["site_name", "support_phone", "whatsapp_number", "support_email", "currency_symbol", "updated_at"]
    fieldsets = (
        ("Branding & Logo", {"fields": ("site_name", "tagline", "logo_text", "logo_icon", "logo_url")}),
        ("WhatsApp & Contact Support", {"fields": ("whatsapp_number", "whatsapp_message", "support_phone", "support_email")}),
        ("Regional & Announcements", {"fields": ("currency_symbol", "announcement_banner", "announcement_enabled")}),
    )
    def has_add_permission(self, request):
        return not SiteSetting.objects.exists()
    def has_delete_permission(self, request, obj=None):
        return False

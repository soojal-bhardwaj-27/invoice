import csv
from decimal import Decimal
from django.db import transaction, IntegrityError
from django.db.models import Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, serializers
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Invoice, InvoiceActivity, SiteSetting
from .serializers import InvoiceSerializer, ActivitySerializer, SiteSettingSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return Invoice.objects.none()
        queryset = Invoice.objects.filter(owner=self.request.user)
        status = self.request.query_params.get("status")
        today = timezone.localdate()
        if status == "paid":
            queryset = queryset.filter(paid=True)
        elif status == "overdue":
            queryset = queryset.filter(paid=False, due_date__lt=today)
        elif status == "pending":
            queryset = queryset.filter(paid=False, due_date__gte=today)
        elif status not in (None, "", "all"):
            raise serializers.ValidationError({"status": "Use all, pending, overdue, or paid."})
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(Q(client__icontains=search) | Q(number__icontains=search))
        return queryset

    def record(self, invoice, action):
        InvoiceActivity.objects.create(owner=self.request.user, invoice=invoice, invoice_number=invoice.number, action=action)

    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                invoice = serializer.save(owner=self.request.user,
                    paid_at=timezone.now() if serializer.validated_data.get("paid") else None)
                self.record(invoice, "created")
        except IntegrityError:
            raise serializers.ValidationError({"number": "This invoice number is already used."})

    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                invoice = serializer.instance
                was_paid = invoice.paid
                paid = serializer.validated_data.get("paid", was_paid)
                invoice = serializer.save(paid_at=(invoice.paid_at or timezone.now()) if paid else None)
                self.record(invoice, ("marked_paid" if paid else "marked_unpaid") if paid != was_paid else "updated")
        except IntegrityError:
            raise serializers.ValidationError({"number": "This invoice number is already used."})

    def perform_destroy(self, instance):
        with transaction.atomic():
            self.record(instance, "deleted")
            instance.delete()

    @action(detail=False, methods=["get"])
    def summary(self, request):
        invoices = Invoice.objects.filter(owner=request.user)
        unpaid = invoices.filter(paid=False)
        overdue = unpaid.filter(due_date__lt=timezone.localdate())
        return Response({"total": invoices.count(), "paid_count": invoices.filter(paid=True).count(),
            "unpaid_count": unpaid.count(), "overdue_count": overdue.count(),
            "outstanding": str(unpaid.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")),
            "overdue": str(overdue.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")), "currency": "INR"})

    @action(detail=True, methods=["get"])
    def reminder(self, request, pk=None):
        invoice = self.get_object()
        if invoice.paid:
            raise serializers.ValidationError("Paid invoices do not need a reminder.")
        timing = "was due" if invoice.due_date < timezone.localdate() else "is due"
        return Response({"text": f"Hello {invoice.client}, a friendly reminder that invoice {invoice.number} for INR {invoice.amount:,.2f} {timing} on {invoice.due_date}. Please let us know when payment is expected. Thank you."})

    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="invoices.csv"'
        writer = csv.writer(response)
        writer.writerow(["Client", "Invoice", "Amount (INR)", "Due date", "Paid", "Client email", "Notes"])
        def safe(value):
            value = str(value)
            return "'" + value if value.lstrip().startswith(("=", "+", "-", "@")) or value.startswith(("\t", "\r", "\n")) else value
        for invoice in self.get_queryset().iterator():
            writer.writerow([safe(invoice.client), safe(invoice.number), invoice.amount, invoice.due_date,
                invoice.paid, safe(invoice.client_email), safe(invoice.notes)])
        return response

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivitySerializer
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return InvoiceActivity.objects.none()
        return InvoiceActivity.objects.filter(owner=self.request.user)


class SiteSettingView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        setting = SiteSetting.load()
        return Response(SiteSettingSerializer(setting).data)

    def patch(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Administrator access required to modify site settings."}, status=403)
        setting = SiteSetting.load()
        serializer = SiteSettingSerializer(setting, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        return self.patch(request)

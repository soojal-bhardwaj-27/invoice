from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path, re_path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework.permissions import AllowAny
from rest_framework.routers import DefaultRouter
from accounts.views import PlansView, SubscriptionsView
from invoices.views import InvoiceViewSet, ActivityViewSet, SiteSettingView

def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"status": "ok"})
    except Exception:
        return JsonResponse({"status": "unavailable"}, status=503)

router = DefaultRouter()
router.register("invoices", InvoiceViewSet, basename="invoice")
router.register("activity", ActivityViewSet, basename="activity")
api_patterns = [
    path("api/auth/", include("accounts.urls")),
    path("api/", include(router.urls)),
    path("api/plans/", PlansView.as_view()),
    path("api/subscriptions/", SubscriptionsView.as_view()),
    path("api/site-settings/", SiteSettingView.as_view(), name="site-settings"),
]
schema = get_schema_view(openapi.Info(title="Invoice Desk API", default_version="v1",
    description="Authenticated invoice management built on django-saas-backend-template."),
    public=True, permission_classes=[AllowAny], patterns=api_patterns)
urlpatterns = [*api_patterns, path("api/health/", health), path("admin/", admin.site.urls),
    path("swagger/", schema.with_ui("swagger", cache_timeout=0)),
    path("redoc/", schema.with_ui("redoc", cache_timeout=0)),
    re_path(r"^swagger(?P<format>\.json|\.yaml)$", schema.without_ui(cache_timeout=0))]

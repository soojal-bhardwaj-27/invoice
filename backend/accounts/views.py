from django.conf import settings
from django.contrib.auth import login, logout, update_session_auth_hash, password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.views.decorators.csrf import csrf_protect
from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from myapp.models import User, SubscriptionPlan, Subscription
from .serializers import (ProfileSerializer, RegisterSerializer, LoginSerializer,
    PasswordChangeSerializer, DeskTokenSerializer, DeskRefreshSerializer, PlanSerializer, SubscriptionSerializer)


class AuthThrottle(AnonRateThrottle):
    scope = "auth"


class CsrfView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        response = Response({"csrfToken": get_token(request)})
        response["Cache-Control"] = "no-store"
        return response


@method_decorator(csrf_protect, name="dispatch")
class RegisterView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthThrottle]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return Response({"user": ProfileSerializer(user).data, "csrfToken": get_token(request)}, status=201)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthThrottle]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        return Response({"user": ProfileSerializer(user).data, "csrfToken": get_token(request)})


class LogoutView(APIView):
    def post(self, request):
        if not isinstance(request.data, dict):
            raise serializers.ValidationError("Expected an object.")
        refresh = request.data.get("refresh")
        if refresh:
            try:
                token = RefreshToken(refresh)
                if str(token["user_id"]) != str(request.user.pk):
                    raise TokenError("Wrong user")
                token.blacklist()
            except (TokenError, TypeError):
                raise serializers.ValidationError({"refresh": "Invalid refresh token."})
        logout(request)
        return Response({"detail": "Signed out."})


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    http_method_names = ["get", "patch", "head", "options"]
    def get_object(self):
        return self.request.user


class PasswordChangeView(generics.GenericAPIView):
    serializer_class = PasswordChangeSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        update_session_auth_hash(request, user)
        return Response({"detail": "Password changed.", "csrfToken": get_token(request)})


class ResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(max_length=128, trim_whitespace=False, write_only=True)


@method_decorator(csrf_protect, name="dispatch")
class ResetRequestView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthThrottle]
    serializer_class = ResetRequestSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"], is_active=1, is_deleted=0).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f"{settings.FRONTEND_URL}/app?reset_uid={uid}&reset_token={token}"
            send_mail("Reset your Invoice Desk password", f"Reset your password using this link (valid for one hour):\n{link}", settings.DEFAULT_FROM_EMAIL, [user.email])
        return Response({"detail": "If an account exists, a password reset link has been sent."})


@method_decorator(csrf_protect, name="dispatch")
class ResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthThrottle]
    serializer_class = ResetConfirmSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(data["uid"])), is_active=1, is_deleted=0)
        except (ValueError, TypeError, UnicodeDecodeError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid or expired reset link.")
        if not default_token_generator.check_token(user, data["token"]):
            raise serializers.ValidationError("Invalid or expired reset link.")
        try:
            password_validation.validate_password(data["new_password"], user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"new_password": error.messages})
        user.set_password(data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset. You can now sign in."})


class TokenView(TokenObtainPairView):
    serializer_class = DeskTokenSerializer
    throttle_classes = [AuthThrottle]

class RefreshView(TokenRefreshView):
    serializer_class = DeskRefreshSerializer
    throttle_classes = [AuthThrottle]

class PlansView(generics.ListAPIView):
    serializer_class = PlanSerializer
    queryset = SubscriptionPlan.objects.filter(is_active=1, is_deleted=0)

class SubscriptionsView(generics.ListAPIView):
    serializer_class = SubscriptionSerializer
    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user, is_deleted=0).select_related("subscription_plan")

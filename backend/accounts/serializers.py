from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken
from myapp.models import User, Role, SubscriptionPlan, Subscription


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_id", "email", "full_name", "organization", "phone", "preferred_language", "role", "is_staff", "is_superuser"]
        read_only_fields = ["user_id", "email", "role", "is_staff", "is_superuser"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    full_name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, max_length=128, trim_whitespace=False)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        try:
            password_validation.validate_password(attrs["password"], User(email=attrs["email"], full_name=attrs["full_name"]))
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": error.messages}) from error
        return attrs

    def create(self, validated_data):
        try:
            return User.objects.create_user(**validated_data, role=Role.USER)
        except IntegrityError as error:
            raise serializers.ValidationError({"email": "An account with this email already exists."}) from error


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(request=self.context.get("request"), email=attrs["email"].strip().lower(), password=attrs["password"])
        if not user or user.is_deleted or not user.is_active:
            raise serializers.ValidationError("Invalid email or password.")
        return {"user": user}


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, max_length=128, trim_whitespace=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Incorrect password."})
        try:
            password_validation.validate_password(attrs["new_password"], user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"new_password": error.messages}) from error
        return attrs


class DeskTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        credentials = LoginSerializer(data=attrs, context=self.context)
        credentials.is_valid(raise_exception=True)
        self.user = credentials.validated_data["user"]
        refresh = self.get_token(self.user)
        return {"access": str(refresh.access_token), "refresh": str(refresh), "user": ProfileSerializer(self.user).data}


class DeskRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        token = RefreshToken(attrs["refresh"])
        user = User.objects.filter(pk=token["user_id"], is_active=1, is_deleted=0).first()
        if not user:
            raise InvalidToken("This account is inactive.")
        from rest_framework_simplejwt.utils import get_md5_hash_password
        if token.get("hash_password") != get_md5_hash_password(user.password):
            raise InvalidToken("Password changed. Sign in again.")
        return super().validate(attrs)


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ["subscription_plan_id", "name", "description", "monthly_price", "yearly_price", "feature_details", "max_api_calls_per_hour"]


class SubscriptionSerializer(serializers.ModelSerializer):
    subscription_plan = PlanSerializer(read_only=True)
    class Meta:
        model = Subscription
        fields = ["subscription_id", "subscription_plan", "billing_frequency", "start_date", "end_date", "status", "auto_renew"]

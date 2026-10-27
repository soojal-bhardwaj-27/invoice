from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

class ActiveJWTAuthentication(JWTAuthentication):
    def get_user(self, token):
        user = super().get_user(token)
        if user.is_deleted or not user.is_active:
            raise AuthenticationFailed("This account is inactive.")
        return user

class ActiveSessionAuthentication(SessionAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result and result[0].is_deleted:
            raise AuthenticationFailed("This account is inactive.")
        return result

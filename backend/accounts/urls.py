from django.urls import path
from . import views
urlpatterns = [
    path("csrf/", views.CsrfView.as_view()),
    path("register/", views.RegisterView.as_view()),
    path("login/", views.LoginView.as_view()),
    path("logout/", views.LogoutView.as_view()),
    path("me/", views.MeView.as_view()),
    path("change-password/", views.PasswordChangeView.as_view()),
    path("request-password-reset/", views.ResetRequestView.as_view()),
    path("reset-password/", views.ResetConfirmView.as_view()),
    path("token/", views.TokenView.as_view()),
    path("token/refresh/", views.RefreshView.as_view()),
]

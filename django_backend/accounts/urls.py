from django.urls import path
from .views import RegisterView,MeView,LogoutView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),#login/ → Username/password correct-na, JWT access token + refresh token generate pannum.
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),#token/refresh/ → Access token expire aana, refresh token use panni new access token generate pannum.
    path("me/", MeView.as_view(), name="me"),
    path("logout/", LogoutView.as_view(), name="logout"),
]

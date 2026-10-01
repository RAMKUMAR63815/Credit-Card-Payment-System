from django.urls import path
from .views import CardCreateView, MyCardsView, CardDeleteView

urlpatterns = [
    path("", CardCreateView.as_view(), name="card-create"),
    path("my-cards/", MyCardsView.as_view(), name="my-cards"),
    path("<int:card_id>/", CardDeleteView.as_view(), name="card-delete"),
]
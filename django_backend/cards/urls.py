from django.urls import path
from .views import CardCreateView, MyCardsView, CardDeleteView,  AdminCardListView,AdminBlockCardView,AdminUnblockCardView,AdminUpdateCreditLimitView

urlpatterns = [
    path("", CardCreateView.as_view(), name="card-create"),
    path("my-cards/", MyCardsView.as_view(), name="my-cards"),
    path("<int:card_id>/", CardDeleteView.as_view(), name="card-delete"),
    path("admin/cards/",AdminCardListView.as_view()),

    path("admin/cards/<int:card_id>/block/",AdminBlockCardView.as_view()),

    path("admin/cards/<int:card_id>/unblock/",AdminUnblockCardView.as_view()),

    path("admin/cards/<int:card_id>/credit-limit/",AdminUpdateCreditLimitView.as_view()),
]
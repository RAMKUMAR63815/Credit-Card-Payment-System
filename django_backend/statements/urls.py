from django.urls import path

from .views import MonthlyStatementView

urlpatterns = [
    path(
        "monthly/",
        MonthlyStatementView.as_view(),
        name="monthly-statement",
    ),
]
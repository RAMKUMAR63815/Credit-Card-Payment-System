from django.urls import path

from .views import (
    PaymentView,
    TransactionHistoryView,
    TransactionCSVExportView,
    AdminPaymentSummaryAPIView,
    daily_payment_summary,
    AdminTransactionListView,
    AnalyticsCSVExportView,
    AnalyticsPDFExportView,
    FraudAlertsAPIView,
)
urlpatterns = [
    path("payments/", PaymentView.as_view(), name="payment"),
    path("history/",TransactionHistoryView.as_view(),name="transaction-history"),
    path("transactions/admin/export/",TransactionCSVExportView.as_view(),name="transaction-csv-export"),#is most likely a class-based view.A class itself cannot directly handle the Django request.converts the class into a callable view function that Django can use.
    path("admin/summary/",daily_payment_summary,name="daily-payment-summary"),#is already a function-based view.A function can directly receive the request:
    path("analytics/summary/",AdminPaymentSummaryAPIView.as_view(),name="admin-payment-analytics"),
    path("admin/transactions/",AdminTransactionListView.as_view(),name="admin-transaction-list" ),
    path("analytics/export/csv/",AnalyticsCSVExportView.as_view(),name="analytics-export-csv",),
    path("analytics/export/pdf/",AnalyticsPDFExportView.as_view(),name="analytics-export-pdf",),
    path("fraud/alerts/",FraudAlertsAPIView.as_view(),name="fraud-alerts",),
]
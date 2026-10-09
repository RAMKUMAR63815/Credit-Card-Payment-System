from django.contrib import admin

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "user",
        "card",
        "amount",
        "status",
        "payment_id",
        "created_at",
    ]

    search_fields = [
        "user__username",
        "user__email",
        "payment_id",
    ]

    list_filter = [
        "status",
        "fraud_status",
        "created_at",
    ]

    ordering = [
        "-created_at"
    ]
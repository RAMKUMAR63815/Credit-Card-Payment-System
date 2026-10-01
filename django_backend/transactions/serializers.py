from rest_framework import serializers

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Transaction
        fields = [
            "id",
            "card",
            "amount",
            "status",
            "payment_id",
            "created_at",
        ]
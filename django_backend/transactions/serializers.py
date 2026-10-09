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

class TransactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )
    card_last_four = serializers.CharField(
        source="card.last_four",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "username",
            "card",
            "card_last_four",
            "amount",
            "status",
            "payment_id",
            "created_at",
        ]

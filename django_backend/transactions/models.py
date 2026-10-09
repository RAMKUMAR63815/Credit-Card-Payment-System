from django.conf import settings
from django.db import models


class Transaction(models.Model):

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions" #This lets you access a user's transactions:user.transactions.all()
    )

    card = models.ForeignKey(
        "cards.Card",
        on_delete=models.SET_NULL,#Card deleted Transaction remains card will be null
        null=True,
        related_name="transactions"
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    payment_id = models.IntegerField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )
    
    FRAUD_STATUS_CHOICES = [
        ("CLEAR", "Clear"),
        ("FLAGGED", "Flagged"),
        ("REVIEWED", "Reviewed"),
    ]

    fraud_status = models.CharField(
        max_length=20,
        choices=FRAUD_STATUS_CHOICES,
        default="CLEAR",
        db_index=True,
    )

    fraud_reason = models.TextField(
        blank=True,
        default="",
    )

    fraud_detected_at = models.DateTimeField(
        null=True,
        blank=True,
    )


    def __str__(self):
        return f"Transaction {self.id} - {self.status}"
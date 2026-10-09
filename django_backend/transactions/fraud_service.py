
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from .models import Transaction


HIGH_VALUE_THRESHOLD = Decimal("5000.00")
FRAUD_TIME_WINDOW_MINUTES = 10


def evaluate_transaction(transaction):
    """
    Flag a transaction when it is high-value and the same
    user has made another high-value transaction in the
    preceding 10 minutes.

    This is a review rule, not proof of fraud.
    """

    if transaction.amount < HIGH_VALUE_THRESHOLD:
        return []

    cutoff = timezone.now() - timedelta(
        minutes=FRAUD_TIME_WINDOW_MINUTES
    )

    previous_high_value_count = (
        Transaction.objects.filter(
            user_id=transaction.user_id,
            amount__gte=HIGH_VALUE_THRESHOLD,
            created_at__gte=cutoff,
        )
        .exclude(pk=transaction.pk)
        .count()
    )

    reasons = []

    if previous_high_value_count >= 1:
        reasons.append(
            "Multiple high-value transactions within 10 minutes."
        )

    if reasons:
        transaction.fraud_status = "FLAGGED"
        transaction.fraud_reason = " ".join(reasons)
        transaction.fraud_detected_at = timezone.now()

        transaction.save(
            update_fields=[
                "fraud_status",
                "fraud_reason",
                "fraud_detected_at",
            ]
        )

    return reasons

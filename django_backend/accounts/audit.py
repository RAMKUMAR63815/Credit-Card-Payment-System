from .models import AuditLog
# Namma models.py file-la irukkura AuditLog model-ah import panrom.
# Database-la audit records save panna idhu use aagum.


def record_audit(
    *,
    actor,
    action,
    target_type,
    target_id,
    details=None,
):
    # Important activity nadakkumbodhu indha function-ah call pannalam.
    # * use pannirukkom; so arguments-ah keyword format-la pass pannanum.

    return AuditLog.objects.create(
        # Pudhu audit record-ah database-la create panni save pannum.

        actor=actor,
        # Endha user action perform pannanga nu save pannum.

        action=action,
        # Enna action nadandhuchu nu save pannum.
        # Example: PAYMENT, LOGIN, CARD_CREATED.

        target_type=target_type,
        # Endha type of object affect aachu nu save pannum.
        # Example: Card, Transaction, User.

        target_id=target_id,
        # Andha affected object-oda database ID-ah save pannum.

        details=details or {},
        # Extra information irundha save pannum.
        # Details kudukkala na empty dictionary {} save pannum.
    )
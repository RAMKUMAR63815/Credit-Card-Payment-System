
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

## Provides Django's built-in user fields and authentication features for a custom user model.

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin" # Stores ADMIN in the database and displays Admin as its readable label
        SUPPORT = "SUPPORT", "Support"
        READ_ONLY = "READ_ONLY", "Read-Only"

    email = models.EmailField(unique=True)

    # Application-level role; separate from Django's is_staff flag.
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.READ_ONLY,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CARD_BLOCKED = "CARD_BLOCKED", "Card blocked"
        CARD_UNBLOCKED = "CARD_UNBLOCKED", "Card unblocked"
        CREDIT_LIMIT_UPDATED = (
            "CREDIT_LIMIT_UPDATED",
            "Credit limit updated",
        )

    # Keep the log if the actor's account is deleted.
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    action = models.CharField(
        max_length=40,
        choices=Action.choices,
    )

    # Example: "Card"
    target_type = models.CharField(max_length=50)

    # Store the ID of the affected card.
    target_id = models.PositiveBigIntegerField() #Stores large, non-negative numeric values,

    # Store safe details such as old/new credit limit.
    details = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:  # Defines additional settings for a Django model.
        ordering = ["-created_at"]
        indexes = [ # Defines database indexes to speed up frequently used queries Database-la neraya audit logs irundha, records-a seekiram search panna indexes use pannuvom. Idhu book-oda index madhiri; information-a fast-ah find panna help pannum.
            models.Index(fields=["action", "-created_at"]),#action field-la enna activity nadandhuchu nu search pannavum, created_at base panni latest activity-a first edukka help pannum.
            models.Index(fields=["target_type", "target_id"]),
        ]

    def __str__(self):
        return f"{self.action} - {self.target_type} {self.target_id}"

from django.db import models

# Create your models here.
from django.conf import settings



class Card(models.Model):#Django's built-in base class

    user = models.ForeignKey(#Many-to-One relationship. one user can have many cards, but each card belongs to one user.
        settings.AUTH_USER_MODEL, #This tells Django which User model to connect with.
        on_delete=models.CASCADE,#This tells Django what to do when the user is deleted.CASCADE = related cards-um delete aagum.
        related_name="cards"#This gives you an easy way to access a user's cards.
    )

    card_holder_name = models.CharField(max_length=100)

    masked_card_number = models.CharField(max_length=19)

    last_four = models.CharField(max_length=4)

    expiry_month = models.PositiveSmallIntegerField()

    expiry_year = models.PositiveSmallIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):#Django Admin-la object-a display pannumbodhu human-readable name kaatta use pannuvom.
        return f"{self.card_holder_name} - ****{self.last_four}"
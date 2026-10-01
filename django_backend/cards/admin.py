from django.contrib import admin

from .models import Card


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):#Django kudukkura built-in admin functionality.ModelAdmin-oda features-ah inherit pannitu, namma card-ku custom settings add panrom.Idhu Django Admin-la Card model eppadi display/manage aaganum nu customize panna oru admin class create panradhu.

    list_display = [
        "id",
        "user",
        "card_holder_name",
        "masked_card_number",
        "last_four",
        "expiry_month",
        "expiry_year",
        "created_at",
    ]

    search_fields = [
        "card_holder_name",
        "user__username",#Django ORM relationship lookup when Card or Transaction has a relationship with User.
        "user__email",#user → Card/Transaction model's user ForeignKey
        "last_four",#username/email ->field inside the related User model
    ]

    list_filter = [
        "expiry_year",
        "expiry_month",
    ]
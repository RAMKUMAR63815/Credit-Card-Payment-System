from rest_framework import serializers
from .models import Card


class CardSerializer(serializers.ModelSerializer):#django modela request/request validate against model and return converted json format response like schema.py
    card_number = serializers.CharField(
        write_only=True,
        min_length=13,
        max_length=19
    )
    cvv = serializers.CharField(
        write_only=True,
        min_length=3,
        max_length=4
    )

    class Meta: #serializer hoew ist worknu settings specify panna use pannura class.
        model = Card
        fields = [
            "id",
            "card_holder_name",
            "card_number",
            "cvv",
            "expiry_month",
            "expiry_year",
            "masked_card_number",
            "last_four",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "masked_card_number",
            "last_four",
            "created_at",
        ]

    def validate_card_number(self, value):#validate_<field_name>
        if not value.isdigit():
            raise serializers.ValidationError(
                "Card number must contain only digits."
            )

        return value

    def validate_cvv(self, value):
        if not value.isdigit():
            raise serializers.ValidationError(
                "CVV must contain only digits."
            )

        return value

    def create(self, validated_data):
        card_number = validated_data.pop("card_number")#pop() means take the value out and remove that key from the dictionary.

        # CVV is received only for validation.
        # It is deliberately NOT stored.
        validated_data.pop("cvv")

        last_four = card_number[-4:]

        masked_card_number = "**** **** **** " + last_four

        user = self.context["request"].user #current API request-oda logged-in user-a get pannum.

        card = Card.objects.create(
            user=user,#Connects the card to the currently logged-in user.
            masked_card_number=masked_card_number,
            last_four=last_four,
            **validated_data#**validated_data → validated dictionary-la irukkura remaining data-va automatic-ah separate fields-aa Card.objects.create() kulla pass pannum._**
        )

        return card

class AdminCardSerializer(serializers.ModelSerializer):#ModelSerializer automatically creates fields based on your Django model
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = Card
        fields = [
            "id",
            "username",
            "masked_card_number",
            "last_four",
            "credit_limit",
            "is_blocked",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "username",
            "masked_card_number",
            "last_four",
            "created_at",
        ]#remaing field also response but perform write operation-->create/update
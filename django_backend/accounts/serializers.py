# Django-la current User model-ah automatically eduthukkum
# Namma custom User model (accounts.User) irundha atha use pannum
from django.contrib.auth import get_user_model

# Django REST Framework-la Serializer create panna use pannuvom
from rest_framework import serializers


# Current configured User model-ah get pannrom
# settings.py-la AUTH_USER_MODEL = "accounts.User" irundha
# accounts.User model inga User variable-kulla varum
User = get_user_model()


# RegisterSerializer:
# Frontend-la irundhu varra registration data-va
# validate panni Django User object-ah create panna use pannuvom
class RegisterSerializer(serializers.ModelSerializer):

    # Password field define pannrom
    password = serializers.CharField(
        # Password API response-la return aaga koodadhu
        # Example: registration response-la password show aagathu
        write_only=True,

        # Minimum password length 8 characters irukkanum
        min_length=8
    )

    # Serializer-ku related configuration
    class Meta:

        # Indha serializer endha model-oda work pannum?
        # Namma User model-oda work pannum
        model = User

        # API-la accept panna fields
        fields = [
            "username",      # User username
            "email",         # User email
            "password",      # User password
            "first_name",    # First name
            "last_name",     # Last name
        ]

    # Validated data use panni database-la User create panna
    # create() method automatically call aagum
    def create(self, validated_data):

        # Django User model-oda create_user() method use pannrom
        # Idhu password-ah plain text-la save pannaama
        # automatically hash panni database-la save pannum
        user = User.objects.create_user(

            # User entered username
            username=validated_data["username"],

            # User entered email
            email=validated_data["email"],

            # User entered password
            # create_user() password-ah hash pannum
            password=validated_data["password"],

            # first_name kudukkala na empty string ""
            first_name=validated_data.get("first_name", ""),

            # last_name kudukkala na empty string ""
            last_name=validated_data.get("last_name", ""),
        )

        # Create pannina User object-ah return pannrom
        return user
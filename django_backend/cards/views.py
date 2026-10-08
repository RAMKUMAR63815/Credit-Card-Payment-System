from rest_framework import status
# HTTP status codes like 201, 400

from rest_framework.permissions import IsAuthenticated,  IsAdminUser
# Only logged-in users can access this API

from rest_framework.response import Response
# Used to send API response

from rest_framework.views import APIView
# Base class for creating API views


from .serializers import CardSerializer
# Import CardSerializer to validate and process card data

from .models import Card

from django.shortcuts import get_object_or_404

from notifications.services import send_card_blocked_alert

from .serializers import AdminCardSerializer


class CardCreateView(APIView):
    # API view for creating a new card

    permission_classes = [IsAuthenticated]
    # User must be logged in to use this API

    def post(self, request):
        # Runs when client sends a POST request

        serializer = CardSerializer(
            data=request.data,
            # Get card data sent by the user

            context={"request": request}
            # Pass the request to serializer
            # This allows serializer to get request.user
        )

        if serializer.is_valid():
            # Check whether the submitted card data is valid

            card = serializer.save()
            # If valid, create/save the Card object in database
            # serializer.save() calls the serializer's create() method

            return Response(
                {
                    "message": "Card added successfully",

                    "card": CardSerializer(card).data
                    # Convert the created Card object into JSON data
                    # .data gives the serialized response data
                },

                status=status.HTTP_201_CREATED
                # 201 means resource was successfully created
            )

        return Response(
            serializer.errors,
            # If validation fails, return the validation errors

            status=status.HTTP_400_BAD_REQUEST
            # 400 means the request contains invalid data
        )
class MyCardsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cards = Card.objects.filter(user=request.user)#Current login user-oda cards mattum database-la fetch pannum.

        serializer = CardSerializer( #Card objects-ai JSON response format-ku convert pannudhu.
            cards,
            many=True
        )

        return Response(serializer.data)
class CardDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, card_id):#value get from input url 
        try:
            card = Card.objects.get(
                id=card_id,
                user=request.user
            )
        except Card.DoesNotExist:
            return Response(
                {"error": "Card not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        card.delete()

        return Response(
            {"message": "Card deleted successfully"},
            status=status.HTTP_200_OK
        )
class AdminBlockCardView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, card_id):
        # Find the card using the card ID from the URL.
        # select_related("user") also loads the card owner.
        try:
            card = Card.objects.select_related(
                "user"
            ).get(id=card_id)

        except Card.DoesNotExist:
            return Response(
                {"detail": "Card not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Block the card.
        card.is_blocked = True

        # Save the updated blocked status in the database.
        card.save(
            update_fields=["is_blocked"]
        )

        # Send email notification to the card owner.
        try:
            send_card_blocked_alert(
                card.user,
                card
            )
        except Exception as error:
            # Do not fail the block operation if email sending fails.
            print(
                "Card blocked successfully, "
                "but email notification failed:",
                error
            )

        return Response(
            {
                "message": "Card blocked successfully.",
                "is_blocked": card.is_blocked,
            },
            status=status.HTTP_200_OK
        )
class AdminCardListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cards = (
            Card.objects
            .select_related("user")
            .order_by("-created_at")
        )

        serializer = AdminCardSerializer(
            cards,
            many=True
        )

        return Response(
            serializer.data
        )

class AdminUnblockCardView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, card_id):
        try:
            card = Card.objects.select_related(
                "user"
            ).get(id=card_id)

        except Card.DoesNotExist:
            return Response(
                {"detail": "Card not found."},
                status=404
            )

        card.is_blocked = False

        card.save(
            update_fields=["is_blocked"]
        )

        return Response({
            "message":
                "Card unblocked successfully."
        })

class AdminUpdateCreditLimitView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, card_id):
        try:
            card = Card.objects.get(
                id=card_id
            )

        except Card.DoesNotExist:
            return Response(
                {"detail": "Card not found."},
                status=404
            )

        credit_limit = request.data.get(
            "credit_limit"
        )

        try:
            credit_limit = float(
                credit_limit
            )

        except (TypeError, ValueError):
            return Response(
                {
                    "detail":
                    "Invalid credit limit."
                },
                status=400
            )

        if credit_limit <= 0:
            return Response(
                {
                    "detail":
                    "Credit limit must be greater than 0."
                },
                status=400
            )

        card.credit_limit = credit_limit

        card.save(
            update_fields=["credit_limit"]
        )

        return Response({
            "message":
                "Credit limit updated successfully.",
            "credit_limit":
                card.credit_limit,
        })
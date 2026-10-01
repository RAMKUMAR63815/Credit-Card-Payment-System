from rest_framework import status
# HTTP status codes like 201, 400

from rest_framework.permissions import IsAuthenticated
# Only logged-in users can access this API

from rest_framework.response import Response
# Used to send API response

from rest_framework.views import APIView
# Base class for creating API views


from .serializers import CardSerializer
# Import CardSerializer to validate and process card data

from .models import Card


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
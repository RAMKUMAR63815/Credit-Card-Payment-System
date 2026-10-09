from rest_framework import status
# HTTP status codes like 201, 400

from rest_framework.permissions import IsAuthenticated,  IsAdminUser
# Only logged-in users can access this API

from rest_framework.response import Response
# Used to send API response

from decimal import Decimal, InvalidOperation
from django.db import transaction as db_transaction
from accounts.audit import record_audit
from accounts.models import AuditLog
from accounts.permissions import (IsAdminRole,IsReadOnlyOrAbove,)

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
    permission_classes = [IsAdminRole]

    def post(self, request, card_id):#tomic() use pannina card block aaguradhum audit history save aaguradhum ore transaction-la nadakkum. Audit save fail aana card update-um rollback aagum.
        with db_transaction.atomic():#All database opertion  changes-um serndhu success aaganum.
            card = get_object_or_404(
                Card.objects.select_for_update().select_related("user"),
                id=card_id,
            )

            changed = not card.is_blocked

            if changed:
                card.is_blocked = True
                card.save(update_fields=["is_blocked"])

                record_audit(
                    actor=request.user,
                    action=AuditLog.Action.CARD_BLOCKED,
                    target_type="Card",
                    target_id=card.id,
                    details={
                        "new_is_blocked": True,
                    },
                )

        # Email failure must not undo a successful card block.
        if changed:
            try:
                send_card_blocked_alert(card.user, card)
            except Exception:
                import logging#use pannina email send fail aana, andha error-oda details and traceback log-la save aagum. Developer later enna problem nu identify panni fix pannalaam. Aana card already block aagirundha, email fail aanaalum card block status change aagadhu.
                logging.getLogger(__name__).exception(
                    "Card-blocked email failed for card ID %s",
                    card.id,
                )

        return Response({
            "message": (
                "Card blocked successfully."
                if changed else "Card is already blocked."
            ),
            "is_blocked": card.is_blocked,
        })

class AdminCardListView(APIView):
    permission_classes = [IsReadOnlyOrAbove]

    def get(self, request):
        cards = (
            Card.objects
            .select_related("user")
            .order_by("-created_at")
        )

        serializer = AdminCardSerializer(#AdminCardSerializer prepares the card data for the API response
            cards,
            many=True#cards represents multiple card records, not a single card.
        )

        return Response(
            serializer.data
        )


class AdminUnblockCardView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, card_id):
        with db_transaction.atomic():
            card = get_object_or_404(
                Card.objects.select_for_update(),
                id=card_id,
            )

            changed = card.is_blocked

            if changed:
                card.is_blocked = False
                card.save(update_fields=["is_blocked"])

                record_audit(
                    actor=request.user,
                    action=AuditLog.Action.CARD_UNBLOCKED,
                    target_type="Card",
                    target_id=card.id,
                    details={
                        "new_is_blocked": False,
                    },
                )

        return Response({
            "message": (
                "Card unblocked successfully."
                if changed else "Card is already unblocked."
            ),
            "is_blocked": card.is_blocked,
        })


class AdminUpdateCreditLimitView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, card_id):
        raw_limit = request.data.get("credit_limit")

        try:
            new_limit = Decimal(str(raw_limit))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"detail": "A valid credit limit is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not new_limit.is_finite() or new_limit <= Decimal("0"):##checks whether the decimal value is a normal
            return Response(
                {"detail": "Credit limit must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # The model allows 2 decimal places and up to 12 digits total.
        if new_limit.as_tuple().exponent < -2 or new_limit >= Decimal("10000000000"):##condition rejects values represented with more than two decimal places
        
            return Response(
                {"detail": "Credit limit supports at most 2 decimal places and 10 digits before the decimal."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with db_transaction.atomic():
            card = get_object_or_404(
                Card.objects.select_for_update(),
                id=card_id,
            )

            old_limit = card.credit_limit

            if old_limit != new_limit:
                card.credit_limit = new_limit
                card.save(update_fields=["credit_limit"])

                record_audit(
                    actor=request.user,
                    action=AuditLog.Action.CREDIT_LIMIT_UPDATED,
                    target_type="Card",
                    target_id=card.id,
                    details={
                        "old_credit_limit": str(old_limit),
                        "new_credit_limit": str(new_limit),
                    },
                )

        return Response({
            "message": "Credit limit updated successfully.",
            "credit_limit": str(card.credit_limit),
        })

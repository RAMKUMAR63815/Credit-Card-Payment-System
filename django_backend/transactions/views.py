# Import csv module to create CSV files
import csv

# Import requests to send an HTTP request from Django to FastAPI
import requests

from notifications.services import (
    send_high_transaction_alert,
    send_low_credit_alert,
)

# Import Decimal for accurate money calculations
from decimal import Decimal

# Import Django admin module
from django.contrib import admin

# Allows only Django staff/admin users to access a function-based view
from django.contrib.admin.views.decorators import staff_member_required

# Used for creating database query conditions with Q()
from django.db import models

# Count() counts records, Sum() calculates the total
from django.db.models import Count, Sum

# TruncDate() extracts only the date from a DateTime field
from django.db.models.functions import TruncDate

# HttpResponse is used to send a response back to the browser
from django.http import HttpResponse

# render() is used to return an HTML page
from django.shortcuts import render

# Used to get Django's current timezone
from django.utils import timezone


# Import DRF HTTP status codes such as 200, 400, 404, 502, 503
from rest_framework import status

# ListAPIView is used when we want to return a list of objects
from rest_framework.generics import ListAPIView

# IsAdminUser allows only admin/staff users
# IsAuthenticated allows only logged-in users
from rest_framework.permissions import IsAdminUser, IsAuthenticated

# Response is used to return JSON data from DRF
from rest_framework.response import Response

# APIView is the base class for creating API endpoints
from rest_framework.views import APIView


# Import the Transaction database model
from .models import Transaction

# Import serializer used to convert Transaction objects into JSON
from .serializers import TransactionSerializer

# Import Card model to check whether the selected card belongs to the logged-in user
from cards.models import Card

# Import low credit alert function
from notifications.services import check_low_credit_alert

from .fraud_service import evaluate_transaction
from notifications.services import send_fraud_alert

from rest_framework.pagination import PageNumberPagination #Display results page by page
from rest_framework.exceptions import ValidationError
from django.db.models import Q  #Combine database query conditions

from datetime import timedelta

# =========================================================
# Payment Processing
# =========================================================

# Create a payment API view
class PaymentView(APIView):

    # Only logged-in/authenticated users can access this API
    permission_classes = [IsAuthenticated]

    # Handle POST requests
    def post(self, request):

        # Get card_id from the request body
        card_id = request.data.get("card_id")

        # Get payment amount from the request body
        amount = request.data.get("amount")

        # Check whether card_id or amount is missing
        if not card_id or not amount:
            return Response(
                {
                    "error": "card_id and amount are required"
                },

                # 400 means Bad Request
                status=status.HTTP_400_BAD_REQUEST
            )

        # Try to convert the amount into a number
        try:

            # Convert amount to Decimal
            # Decimal is safer and more accurate for money
            amount = Decimal(str(amount))

            # Payment amount must be greater than zero
            if amount <= 0:
                return Response(
                    {
                        "error": "Amount must be greater than 0"
                    },

                    # Return HTTP 400 Bad Request
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Handle invalid values such as "abc"
        except (TypeError, ValueError):

            return Response(
                {
                    "error": "Invalid amount"
                },

                # Return HTTP 400 Bad Request
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check whether the card exists
        # AND belongs to the currently logged-in user
        try:

            card = Card.objects.get(
                id=card_id,
                user=request.user
            )

        # If card does not exist or belongs to another user
        except Card.DoesNotExist:

            return Response(
                {
                    "error": "Card not found or does not belong to the user"
                },

                # 404 means Not Found
                status=status.HTTP_404_NOT_FOUND
            )

        # Create a transaction in Django database
        # Initially payment status is PENDING
        django_transaction = Transaction.objects.create(
            user=request.user,
            card=card,
            amount=amount,
            status="PENDING"
        )

        
        # Evaluate suspicious transaction patterns.
        fraud_reasons = evaluate_transaction(django_transaction)

        # Send an alert if the transaction was flagged.
        if fraud_reasons:
            send_fraud_alert(django_transaction)


        # FastAPI payment endpoint
        # "fastapi" is the Docker Compose service name
        fastapi_url = "http://fastapi:8001/payments/"

        # Data that Django will send to FastAPI
        payload = {

            # Send logged-in user's ID
            "user_id": request.user.id,

            # Send selected card ID
            "card_id": card_id,

            # Send payment amount
            # Convert Decimal to string because JSON does not
            # directly support Python Decimal objects
            "amount": str(amount)
        }

        # Try to send payment request from Django to FastAPI
        try:

            response = requests.post(

                # FastAPI URL
                fastapi_url,

                # Send payload as JSON
                json=payload,

                # Wait maximum 10 seconds for FastAPI
                timeout=10
            )

        # If Django cannot connect to FastAPI
        except requests.RequestException:

            # Change Django transaction status to FAILED
            django_transaction.status = "FAILED"

            # Save the updated status in database
            django_transaction.save()

            # Return error response to React
            return Response(
                {
                    "error": "Payment service unavailable"
                },

                # 503 means Service Unavailable
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Check whether FastAPI returned HTTP 200
        if response.status_code != 200:

            # FastAPI payment failed
            django_transaction.status = "FAILED"

            # Save FAILED status
            django_transaction.save()

            # Return error response
            return Response(
                {
                    "error": "Payment processing failed",

                    # Send FastAPI error response details
                    "details": response.text
                },

                # 502 means Bad Gateway
                status=status.HTTP_502_BAD_GATEWAY
            )

        # Convert FastAPI JSON response into Python dictionary
        fastapi_data = response.json()

        # Get the "payment" object from FastAPI response
        payment_data = fastapi_data["payment"]

        # Update Django transaction with FastAPI payment status
        django_transaction.status = payment_data["status"]

        # Store FastAPI payment ID in Django
        django_transaction.payment_id = payment_data["id"]

        # Save updated transaction into database
        django_transaction.save()

        # =========================================================
        # Successful Payment - Update Available Credit
        # =========================================================

        # Continue only if the payment was successful
        if django_transaction.status == "SUCCESS":

            # Reduce the available credit by the payment amount
            # Both values are Decimal, so this calculation is safe
            card.available_credit -= django_transaction.amount

            # Save only the available_credit field
            card.save(
                update_fields=["available_credit"]
            )

            # Check whether available credit is below 10%
            check_low_credit_alert(card)

        # =========================================================
        # High Transaction Alert
        # =========================================================

        # Check whether the transaction amount is greater than 5000
        # Decimal("5000") is used because amount is a Decimal
        if (
            django_transaction.status == "SUCCESS"
            and django_transaction.amount > Decimal("5000")
        ):

            # Send an email alert to the transaction owner
            send_high_transaction_alert(
                django_transaction.user,
                django_transaction.amount
            )

        # Send successful response back to React
        return Response(
            {
                # Message shown to frontend
                "message": "Payment processed successfully",

                # Return transaction details
                "transaction": {

                    # Django transaction ID
                    "id": django_transaction.id,

                    # Convert amount to string for JSON response
                    "amount": str(django_transaction.amount),

                    # Payment status such as SUCCESS/FAILED
                    "status": django_transaction.status,

                    # FastAPI payment ID
                    "payment_id": django_transaction.payment_id,
                }
            },

            # 200 means successful request
            status=status.HTTP_200_OK
        )

class TransactionHistoryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminTransactionListView(ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminUser]
    pagination_class = TransactionHistoryPagination

    def get_queryset(self):
        queryset = (
            Transaction.objects
            .select_related("user", "card")
            .all()
        )

        params = self.request.query_params
        status_filter = params.get("status", "").strip().upper()
        search = params.get("search", "").strip()
        min_amount = params.get("min_amount", "").strip()
        max_amount = params.get("max_amount", "").strip()
        start_date = params.get("start_date", "").strip()
        end_date = params.get("end_date", "").strip()

        if status_filter:
            if status_filter not in {"SUCCESS", "FAILED", "PENDING"}:
                raise ValidationError({
                    "status": "Use SUCCESS, FAILED, or PENDING."
                })
            queryset = queryset.filter(status=status_filter)

        if min_amount:
            try:
                minimum = Decimal(min_amount)
            except Exception:
                raise ValidationError({
                    "min_amount": "Enter a valid amount."
                })

            if not minimum.is_finite() or minimum < 0:
                raise ValidationError({
                    "min_amount": "Enter a non-negative amount."
                })
            queryset = queryset.filter(amount__gte=minimum)

        if max_amount:
            try:
                maximum = Decimal(max_amount)
            except Exception:
                raise ValidationError({
                    "max_amount": "Enter a valid amount."
                })

            if not maximum.is_finite() or maximum < 0:
                raise ValidationError({
                    "max_amount": "Enter a non-negative amount."
                })
            queryset = queryset.filter(amount__lte=maximum)

        if min_amount and max_amount and minimum > maximum:
            raise ValidationError({
                "amount": "Minimum amount cannot exceed maximum amount."
            })

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)

        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        if search:
            if not search.isdigit():
                # Do not return every transaction for an unsupported search.
                return queryset.none()

            search_number = int(search)
            conditions = (
                Q(id=search_number)
                | Q(payment_id=search_number)
            )

            if len(search) <= 4:
                conditions |= Q(card__last_four=search)

            queryset = queryset.filter(conditions)

        return queryset.order_by("-created_at", "-id")

# =========================================================
# Transaction History
# =========================================================

# ListAPIView is used to return multiple transactions

class TransactionHistoryView(ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TransactionHistoryPagination

    def get_queryset(self):
        queryset = (
            Transaction.objects
            .filter(user=self.request.user)
            .select_related("card")
        )

        params = self.request.query_params

        status_filter = params.get("status", "").strip().upper()
        min_amount = params.get("min_amount", "").strip()
        max_amount = params.get("max_amount", "").strip()
        start_date = params.get("start_date", "").strip()
        end_date = params.get("end_date", "").strip()
        search = params.get("search", "").strip()

        # Validate transaction status.
        allowed_statuses = {"SUCCESS", "FAILED", "PENDING"}

        if status_filter:
            if status_filter not in allowed_statuses:
                raise ValidationError({
                    "status": "Use SUCCESS, FAILED, or PENDING."
                })

            queryset = queryset.filter(status=status_filter)

        # Validate and filter minimum amount.
        if min_amount:
            try:
                minimum = Decimal(min_amount)
            except Exception:
                raise ValidationError({
                    "min_amount": "Enter a valid amount."
                })

            if not minimum.is_finite() or minimum < 0:
                raise ValidationError({
                    "min_amount": "Amount must be a non-negative number."
                })

            queryset = queryset.filter(amount__gte=minimum)

        # Validate and filter maximum amount.
        if max_amount:
            try:
                maximum = Decimal(max_amount)
            except Exception:
                raise ValidationError({
                    "max_amount": "Enter a valid amount."
                })

            if not maximum.is_finite() or maximum < 0:
                raise ValidationError({
                    "max_amount": "Amount must be a non-negative number."
                })

            queryset = queryset.filter(amount__lte=maximum)

        if min_amount and max_amount and minimum > maximum:
            raise ValidationError({
                "amount": "min_amount cannot exceed max_amount."
            })

        # Filter by date.
        if start_date:
            queryset = queryset.filter(
                created_at__date__gte=start_date
            )

        if end_date:
            queryset = queryset.filter(
                created_at__date__lte=end_date
            )

        # Search by transaction ID, payment ID, or card's last four digits.
        if search:
            search_conditions = Q()

            if search.isdigit():
                search_conditions |= Q(id=int(search))
                search_conditions |= Q(payment_id=int(search))

            if len(search) <= 4 and search.isdigit():
                search_conditions |= Q(card__last_four=search)

            queryset = queryset.filter(search_conditions)

        return queryset.order_by("-created_at", "-id")

# =========================================================
# Admin CSV Export
# =========================================================

# API view for exporting all transactions as CSV
class TransactionCSVExportView(APIView):

    # Only admin/staff users can download the CSV
    permission_classes = [IsAdminUser]

    # Handle GET request
    def get(self, request):

        # Get all transactions
        # select_related() also fetches related user and card data
        transactions = Transaction.objects.select_related(
            "user",
            "card"
        ).order_by("-created_at")

        # Create an HTTP response with CSV content type
        response = HttpResponse(
            content_type="text/csv"
        )

        # Tell browser to download the response as a file
        response["Content-Disposition"] = (
            'attachment; filename="transactions.csv"'
        )

        # Create CSV writer
        writer = csv.writer(response)

        # Write the first row as CSV headers
        writer.writerow([
            "Transaction ID",
            "Username",
            "Email",
            "Card",
            "Amount",
            "Status",
            "Payment ID",
            "Created At",
        ])

        # Loop through every transaction
        for transaction in transactions:

            # Write each transaction as one CSV row
            writer.writerow([
                transaction.id,
                transaction.user.username,
                transaction.user.email,

                # Show last four card digits
                # If card doesn't exist, use empty string
                transaction.card.last_four
                if transaction.card
                else "",

                transaction.amount,
                transaction.status,
                transaction.payment_id,
                transaction.created_at,
            ])

        # Send CSV file to browser
        return response


# =========================================================
# Daily Payment Summary - HTML PAGE
# =========================================================

# Only Django staff/admin users can access this page
@staff_member_required
def daily_payment_summary(request):

    # Get the current Django timezone
    current_timezone = timezone.get_current_timezone()

    # Start building the payment summary query
    summary = (

        # Get all Transaction records
        Transaction.objects

        # Extract only the date from created_at
        # Example:
        # 2026-10-01 14:30:25
        # becomes
        # 2026-10-01
        .annotate(
            date=TruncDate(
                "created_at",
                tzinfo=current_timezone
            )
        )

        # Group the transactions by date
        .values("date")

        # Calculate daily payment information
        .annotate(

            # Count total transactions for each day
            total_payments=Count("id"),

            # Count only SUCCESS transactions
            successful_payments=Count(
                "id",
                filter=models.Q(status="SUCCESS")
            ),

            # Count only FAILED transactions
            failed_payments=Count(
                "id",
                filter=models.Q(status="FAILED")
            ),

            # Count only PENDING transactions
            pending_payments=Count(
                "id",
                filter=models.Q(status="PENDING")
            ),

            # Calculate total amount of all transactions
            total_amount=Sum("amount"),
        )

        # Show newest date first
        .order_by("-date")
    )

    # Send the summary data to the HTML template
    return render(
        request,

        # HTML template path
        "transactions/daily_payment_summary.html",

        # Data sent from Django view to HTML
        {
            "summary": summary,

            # Send today's date to the template
            "current_date": timezone.localdate(),
        }
    )


# =========================================================
# Admin Payment Summary - JSON API
# =========================================================

# This API is used by the React Admin Dashboard

class AdminPaymentSummaryAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        start_date = today - timedelta(days=6)

        all_transactions = Transaction.objects.all()

        totals = all_transactions.aggregate(
            total_amount=Sum("amount"),
            successful_amount=Sum(
                "amount",
                filter=models.Q(status="SUCCESS"),
            ),
            total_transactions=Count("id"),
            successful_transactions=Count(
                "id",
                filter=models.Q(status="SUCCESS"),
            ),
            failed_transactions=Count(
                "id",
                filter=models.Q(status="FAILED"),
            ),
            pending_transactions=Count(
                "id",
                filter=models.Q(status="PENDING"),
            ),
        )

        # Daily data for the last seven calendar days.
        daily_queryset = (
            all_transactions
            .filter(created_at__date__gte=start_date)
            .annotate(
                date=TruncDate(
                    "created_at",
                    tzinfo=timezone.get_current_timezone(),
                )
            )
            .values("date")
            .annotate(
                total=Count("id"),
                successful=Count(
                    "id",
                    filter=models.Q(status="SUCCESS"),
                ),
                failed=Count(
                    "id",
                    filter=models.Q(status="FAILED"),
                ),
                successful_amount=Sum(
                    "amount",
                    filter=models.Q(status="SUCCESS"),
                ),
            )
            .order_by("date")
        )

        daily_data = [
            {
                "date": row["date"].isoformat(),
                "total": row["total"],
                "successful": row["successful"],
                "failed": row["failed"],
                "successful_amount": str(
                    row["successful_amount"] or Decimal("0.00")
                ),
            }
            for row in daily_queryset
        ]

        recent_transactions = (
            all_transactions
            .select_related("user", "card")
            .order_by("-created_at", "-id")[:5]
        )

        recent_data = [
            {
                "id": transaction.id,
                "payment_id": transaction.payment_id,
                "amount": str(transaction.amount),
                "status": transaction.status,
                "created_at": transaction.created_at,
                "username": transaction.user.username,
            }
            for transaction in recent_transactions
        ]

        return Response(
            {
                "total_transactions": totals["total_transactions"],
                "total_amount": str(
                    totals["total_amount"] or Decimal("0.00")
                ),
                "successful_amount": str(
                    totals["successful_amount"] or Decimal("0.00")
                ),
                "successful_transactions": totals[
                    "successful_transactions"
                ],
                "failed_transactions": totals["failed_transactions"],
                "pending_transactions": totals["pending_transactions"],
                "daily_analytics": daily_data,
                "recent_transactions": recent_data,
            },
            status=status.HTTP_200_OK,
        )

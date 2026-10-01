# Import csv module to create CSV files
import csv

# Import requests to send an HTTP request from Django to FastAPI
import requests


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
            amount = float(amount)

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
            "amount": amount
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


# =========================================================
# Transaction History
# =========================================================

# ListAPIView is used to return multiple transactions
class TransactionHistoryView(ListAPIView):

    # TransactionSerializer converts Transaction objects into JSON
    serializer_class = TransactionSerializer

    # Only logged-in users can access transaction history
    permission_classes = [IsAuthenticated]

    # get_queryset() decides which transactions should be returned
    def get_queryset(self):

        # Get only transactions belonging to the logged-in user
        queryset = Transaction.objects.filter(
            user=self.request.user
        )

        # Get status value from URL query parameter
        # Example: ?status=success
        status_filter = self.request.query_params.get("status")

        # Get minimum amount from URL
        # Example: ?min_amount=500
        min_amount = self.request.query_params.get("min_amount")

        # Get maximum amount from URL
        # Example: ?max_amount=5000
        max_amount = self.request.query_params.get("max_amount")

        # Get starting date from URL
        # Example: ?start_date=2026-09-01
        start_date = self.request.query_params.get("start_date")

        # Get ending date from URL
        # Example: ?end_date=2026-09-30
        end_date = self.request.query_params.get("end_date")

        # If status filter was provided
        if status_filter:

            # Convert status to uppercase
            # success -> SUCCESS
            queryset = queryset.filter(
                status=status_filter.upper()
            )

        # If minimum amount was provided
        if min_amount:

            # Return amounts greater than or equal to min_amount
            queryset = queryset.filter(
                amount__gte=min_amount
            )

        # If maximum amount was provided
        if max_amount:

            # Return amounts less than or equal to max_amount
            queryset = queryset.filter(
                amount__lte=max_amount
            )

        # If start date was provided
        if start_date:

            # Return transactions on or after this date
            queryset = queryset.filter(
                created_at__date__gte=start_date
            )

        # If end date was provided
        if end_date:

            # Return transactions on or before this date
            queryset = queryset.filter(
                created_at__date__lte=end_date
            )

        # Sort transactions by newest first
        return queryset.order_by("-created_at")


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
# Daily Payment Summary
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
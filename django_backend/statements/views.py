from calendar import monthrange
from datetime import datetime

from django.http import HttpResponse
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from transactions.models import Transaction


class MonthlyStatementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_date = timezone.localdate()

        year = int(
            request.query_params.get(
                "year",
                current_date.year
            )
        )

        month = int(
            request.query_params.get(
                "month",
                current_date.month
            )
        )

        first_day = datetime(
            year,
            month,
            1
        )

        last_day_number = monthrange(
            year,
            month
        )[1]

        next_month = (
            datetime(
                year,
                month,
                last_day_number
            )
        )

        transactions = (
            Transaction.objects
            .filter(
                user=request.user,
                created_at__year=year,
                created_at__month=month,
            )
            .select_related("card")
            .order_by("-created_at")
        )

        total_spending = sum(
            transaction.amount
            for transaction in transactions
            if transaction.status == "SUCCESS"
        )

        response = HttpResponse(
            content_type="application/pdf"
        )

        response[
            "Content-Disposition"
        ] = (
            f'attachment; filename='
            f'"monthly_statement_'
            f'{year}_{month:02d}.pdf"'
        )

        document = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=15 * mm,
            leftMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm,
        )

        styles = getSampleStyleSheet()

        elements = []

        elements.append(
            Paragraph(
                "CREDIT CARD MONTHLY STATEMENT",
                styles["Title"]
            )
        )

        elements.append(
            Spacer(1, 10)
        )

        elements.append(
            Paragraph(
                f"Customer: {request.user.username}",
                styles["Normal"]
            )
        )

        elements.append(
            Paragraph(
                f"Statement Period: "
                f"{month:02d}/{year}",
                styles["Normal"]
            )
        )

        elements.append(
            Spacer(1, 15)
        )

        elements.append(
            Paragraph(
                f"<b>Total Spending:</b> "
                f"₹{total_spending:,.2f}",
                styles["Heading2"]
            )
        )

        elements.append(
            Spacer(1, 15)
        )

        table_data = [
            [
                "Date",
                "Amount",
                "Status",
                "Card"
            ]
        ]

        for transaction in transactions:
            masked_card = (
                transaction.card.masked_card_number
                if transaction.card
                else "****"
            )

            table_data.append(
                [
                    transaction.created_at.strftime(
                        "%d-%m-%Y"
                    ),
                    f"₹{transaction.amount:,.2f}",
                    transaction.status,
                    masked_card,
                ]
            )

        table = Table(
            table_data,
            repeatRows=1
        )

        table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#1f2937")
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),
                    (
                        "PADDING",
                        (0, 0),
                        (-1, -1),
                        6
                    ),
                ]
            )
        )

        elements.append(table)

        elements.append(
            Spacer(1, 20)
        )

        elements.append(
            Paragraph(
                "This statement is system generated.",
                styles["Normal"]
            )
        )

        document.build(elements)

        return response
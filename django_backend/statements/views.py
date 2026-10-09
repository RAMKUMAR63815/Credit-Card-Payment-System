from django.http import HttpResponse  # Sends a response or generated PDF file to the browser.
from django.utils import timezone  # Gets the current date and time with timezone support.
from rest_framework.permissions import IsAuthenticated  # Allows API access only to authenticated users when configured.
from rest_framework.views import APIView  # Creates class-based API views to handle HTTP requests.
from reportlab.lib import colors  # Provides colors for PDF text, backgrounds, and borders.
from reportlab.lib.enums import TA_CENTER  # Centers text inside a paragraph.
from reportlab.lib.pagesizes import A4  # Sets the PDF page size to A4.
from reportlab.lib.styles import (ParagraphStyle, getSampleStyleSheet,)  # Creates custom text styles and provides predefined styles.
from reportlab.lib.units import mm  # Converts millimetre measurements into PDF layout units.
from reportlab.platypus import (
    SimpleDocTemplate,  # Creates the PDF document and controls its page layout.
    Paragraph,  # Adds formatted text such as titles and descriptions to the PDF.
    Spacer,  # Adds empty space between PDF elements.
    Table,  # Displays transaction details in rows and columns.
    TableStyle,  # Applies colors, borders, alignment, and padding to the table.
)
from transactions.models import Transaction  # Imports the Transaction model to retrieve transaction records from the database.


class MonthlyStatementView(APIView):
    """
    Generates a monthly PDF statement
    for the currently logged-in user.
    """

    # Only authenticated users can access
    # the monthly statement endpoint.
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Get today's date.
        # This is used when the user does not
        # provide year/month in the URL.
        current_date = timezone.localdate()

        # Read year from query parameter.
        #
        # Example:
        # /api/statements/monthly/?year=2026&month=10
        #
        # If year is not provided, current year is used.
        try:
            year = int(request.query_params.get("year",current_date.year,))

            # Read month from query parameter.
            # If month is not provided,
            # current month is used.
            month = int(request.query_params.get("month",current_date.month,) )

        except ValueError:

            # Return a proper error if year/month
            # contains invalid text.
            return HttpResponse(
                "Invalid year or month.",
                status=400,
            )

        # Validate month.
        if month < 1 or month > 12:

            return HttpResponse(
                "Month must be between 1 and 12.",
                status=400,
            )

        # Validate year.
        if year < 2000 or year > current_date.year:

            return HttpResponse(
                "Invalid year.",
                status=400,
            )

        # Get transactions belonging ONLY to
        # the currently authenticated user.
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

        # Calculate total spending.
        #
        # Only SUCCESS transactions are counted
        # as actual spending.
        total_spending = sum(
            transaction.amount
            for transaction in transactions
            if transaction.status == "SUCCESS"
        )

        # Count all transactions for the month.
        transaction_count = transactions.count()

        # Create PDF HTTP response.
        response = HttpResponse(
            content_type="application/pdf"
        )

        # Tell the browser that this response
        # should be downloaded as a PDF file.
        response["Content-Disposition"] = (#Sets an HTTP response header.It tells the browser how to handle the returned file.
            f'attachment; filename='
            f'"monthly_statement_'
            f'{year}_{month:02d}.pdf"'
        )

        # Create the PDF document.
        document = SimpleDocTemplate(#creates the PDF document layout.
            response,
            pagesize=A4,
            rightMargin=15 * mm,#leaves 15 mm of space on the right.
            leftMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm,
        )

        # Load ReportLab's default styles.
        styles = getSampleStyleSheet() #ReportLab already provides some text styles.

        # Create custom title style.
        title_style = ParagraphStyle(
            "StatementTitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=18,
            leading=22, #Sets the line spacing
            spaceAfter=10, #Adds space after the paragraph

        )

        # Create heading style.
        heading_style = ParagraphStyle(
            "StatementHeading",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            spaceAfter=8,
        )

        # Store PDF elements here.
        elements = []

        # --------------------------------------------------
        # TITLE
        # --------------------------------------------------

        elements.append(
            Paragraph(
                "CREDIT CARD MONTHLY STATEMENT",
                title_style,
            )
        )

        elements.append(
            Spacer(1, 8)#widht,height
        )

        # --------------------------------------------------
        # CUSTOMER INFORMATION
        # --------------------------------------------------

        elements.append(
            Paragraph(
                f"<b>Customer:</b> "
                f"{request.user.username}",
                styles["Normal"],
            )
        )

        elements.append(
            Paragraph(
                f"<b>Email:</b> "
                f"{request.user.email}",
                styles["Normal"],
            )
        )

        elements.append(
            Paragraph(
                f"<b>Statement Period:</b> "
                f"{month:02d}/{year}",
                styles["Normal"],
            )
        )

        elements.append(
            Spacer(1, 15)
        )

        # --------------------------------------------------
        # SUMMARY
        # --------------------------------------------------

        elements.append(
            Paragraph(
                "Statement Summary",
                heading_style,
            )
        )

        summary_data = [
            [
                "Total Transactions",
                str(transaction_count),
            ],
            [
                "Total Successful Spending",
                f"{total_spending:,.2f}",#formats the amount with commas and two decimal places
            ],
        ]

        summary_table = Table(
            summary_data,
            colWidths=[
                90 * mm,
                75 * mm,
            ],
        )

        summary_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),#0, 0), (0, -1) means the first column, from its first row to its last row.
                        (0, -1),
                        colors.HexColor("#e5e7eb"),
                    ),
                    (
                        "FONTNAME",
                        (0, 0),
                        (0, -1),
                        "Helvetica-Bold",
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey,
                    ),
                    (
                        "PADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                ]
            )
        )

        elements.append(summary_table)

        elements.append(
            Spacer(1, 20)
        )

        # --------------------------------------------------
        # TRANSACTION LIST
        # --------------------------------------------------

        elements.append(
            Paragraph(
                "Transaction Details",
                heading_style,
            )
        )

        table_data = [
            [
                "Date",
                "Amount",
                "Status",
                "Card",
            ]
        ]

        # Add every transaction to the PDF table.
        for transaction in transactions:

            # Get masked card number.
            #
            # Example:
            # **** **** **** 1234
            masked_card = (
                transaction.card.masked_card_number
                if transaction.card
                else "**** **** **** ****"
            )

            table_data.append(
                [
                    transaction.created_at.strftime(
                        "%d-%m-%Y"
                    ),
                    f" {transaction.amount:,.2f}",
                    transaction.status,
                    masked_card,
                ]
            )

        # If there are no transactions,
        # show a message instead of an empty table.
        if not transactions.exists():

            table_data.append(
                [
                    "-",
                    "-",
                    "No transactions",
                    "-",
                ]
            )

        # Create transaction table.
        table = Table(
            table_data,
            colWidths=[
                32 * mm,
                35 * mm,
                35 * mm,
                60 * mm,
            ],
            repeatRows=1,
        )

        # Style transaction table.
        table.setStyle(
            TableStyle(
                [
                    # Header background
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#1f2937"),
                    ),

                    # Header text
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),

                    # Header font
                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold",
                    ),

                    # Borders
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey,
                    ),

                    # Cell padding
                    (
                        "PADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),

                    # Align amount column
                    (
                        "ALIGN",
                        (1, 1),
                        (1, -1),
                        "RIGHT",
                    ),
                ]
            )
        )

        elements.append(table)

        elements.append(
            Spacer(1, 20)
        )

        # --------------------------------------------------
        # FOOTER MESSAGE
        # --------------------------------------------------

        elements.append(
            Paragraph(
                "This statement is system generated "
                "and does not require a signature.",
                styles["Normal"],
            )
        )

        # Generate the PDF.
        document.build(elements)#the PDF document object created using SimpleDocTemplate(). #build-arranges the content and generates the PDF.

        # Return the generated PDF to the browser.
        return response
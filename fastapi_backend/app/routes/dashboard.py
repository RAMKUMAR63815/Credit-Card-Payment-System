from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func

from app.auth import get_current_user
from app.database import get_db
from app.models import Card, Transaction
from app.schemas import DashboardSummary


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/summary",
    response_model=DashboardSummary
)
def dashboard_summary(
    current_user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    # -----------------------------------------
    # 1. Total successful transactions
    # -----------------------------------------

    total_transactions = (
        db.query(func.count(Transaction.id))
        .filter(
            Transaction.user_id == current_user_id,
            Transaction.status == "SUCCESS"
        )
        .scalar()#get only single vaalue
        or 0
    )

    # -----------------------------------------
    # 2. Total amount spent
    # -----------------------------------------

    total_amount_spent = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user_id,
            Transaction.status == "SUCCESS"
        )
        .scalar()
        or Decimal("0.00")
    )

    # -----------------------------------------
    # 3. Current month spending
    # -----------------------------------------

    now = datetime.now()

    current_month_spending = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user_id,
            Transaction.status == "SUCCESS",
            func.year(Transaction.created_at) == now.year,#extract year and month only
            func.month(Transaction.created_at) == now.month
        )
        .scalar()
        or Decimal("0.00")
    )

    # -----------------------------------------
    # 4. Total credit limit
    # -----------------------------------------

    total_credit_limit = (
        db.query(func.sum(Card.credit_limit))
        .filter(
            Card.user_id == current_user_id
        )
        .scalar()
        or Decimal("0.00")
    )

    # -----------------------------------------
    # 5. Available credit
    # -----------------------------------------

    available_credit_limit = (
        total_credit_limit - total_amount_spent
    )

    if available_credit_limit < 0:
        available_credit_limit = Decimal("0.00")

    # -----------------------------------------
    # 6. Last 5 transactions
    # -----------------------------------------

    last_5_transactions = (
        db.query(
            Transaction.amount,
            Card.masked_card_number,
            Transaction.created_at,
            Transaction.status
        )
        .join(
            Card,
            Transaction.card_id == Card.id
        )
        .filter(
            Transaction.user_id == current_user_id
        )
        .order_by(
            Transaction.created_at.desc()
        )
        .limit(5)
        .all()
    )

    transactions = []

    for transaction in last_5_transactions:
        transactions.append({
            "amount": transaction.amount,
            "masked_card_number": transaction.masked_card_number,
            "date": transaction.created_at,
            "status": transaction.status
        })

    # -----------------------------------------
    # 7. Return dashboard response
    # -----------------------------------------

    return {
        "total_transactions": total_transactions,
        "total_amount_spent": total_amount_spent,
        "current_month_spending": current_month_spending,
        "available_credit_limit": available_credit_limit,
        "last_5_transactions": transactions
    }
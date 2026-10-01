from fastapi import FastAPI,Depends

from .database import Base, engine ,get_db
from . import models
from .schemas import PaymentCreate
from sqlalchemy.orm import Session


Base.metadata.create_all(bind=engine)#na, namma SQLAlchemy-la define pannirukkura models/table structure-ah eduthu, MySQL database-la table illa-na create pannu nu solrom.


app = FastAPI(
    title="Credit Card Payment API",
    description="Payment processing service",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Credit Card Payment API is running"
    }

@app.post("/payments/")
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db)
):
    # Step 1: Create payment with PENDING status
    new_payment = models.Payment(
        user_id=payment.user_id,
        card_id=payment.card_id,
        amount=payment.amount,
        status="PENDING"
    )

    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)

    # Step 2: Simulate payment result
    if payment.amount % 2 == 0:
        new_payment.status = "SUCCESS"
    else:
        new_payment.status = "FAILED"

    # Step 3: Save final status
    db.commit()
    db.refresh(new_payment)

    return {
        "message": "Payment processed",
        "payment": {
            "id": new_payment.id,
            "user_id": new_payment.user_id,
            "card_id": new_payment.card_id,
            "amount": new_payment.amount,
            "status": new_payment.status,
        }
    }
from sqlalchemy import Column, DateTime, Integer, String, Numeric,ForeignKey
from sqlalchemy.sql import func

from .database import Base



class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False)

    card_id = Column(Integer, nullable=False)

    amount = Column(Numeric(10, 2), nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="PENDING"
    )

    created_at = Column(
        DateTime,
        server_default=func.now()#Database itself automatically puts the current date and time when a new row is inserted.server_default->Set the default value on the database server.func.now()SQLAlchemy represents the database's NOW() function.
    )

class Card(Base):
    __tablename__ = "cards_card"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    masked_card_number = Column(String(19), nullable=False)
    credit_limit = Column(Numeric(12, 2), nullable=False, default=50000.00)


class Transaction(Base):
    __tablename__ = "transactions_transaction"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    card_id = Column(Integer, ForeignKey("cards_card.id"), nullable=True)

    amount = Column(Numeric(10, 2), nullable=False)

    status = Column(String(20), nullable=False)

    created_at = Column(DateTime)
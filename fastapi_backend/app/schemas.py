from decimal import Decimal

from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    user_id: int
    card_id: int
    amount: Decimal = Field(gt=0)


class PaymentResponse(BaseModel):
    id: int
    user_id: int
    card_id: int
    amount: Decimal
    status: str
    created_at: object

    class Config:
        from_attributes = True#from_attributes = True na, SQLAlchemy object-la irukkura user.id, user.name, user.email maadhiri attributes-ah Pydantic read panni response JSON-a convert pannalam.
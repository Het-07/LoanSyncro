from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RepaymentBase(BaseModel):
    loan_id: str
    amount: float
    payment_date: datetime
    notes: Optional[str] = None

class RepaymentCreate(RepaymentBase):
    pass

class Repayment(RepaymentBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        orm_mode = True

class Summary(BaseModel):
    total_loans: int
    total_borrowed: float
    total_repaid: float
    outstanding_amount: float
    next_payment_due: Optional[datetime] = None
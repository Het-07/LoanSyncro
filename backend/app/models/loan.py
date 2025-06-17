from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LoanBase(BaseModel):
    title: str
    amount: float
    interest_rate: float
    term_months: int
    start_date: datetime
    description: Optional[str] = None

class LoanCreate(LoanBase):
    pass

class Loan(LoanBase):
    id: str
    user_id: str
    created_at: datetime
    total_amount: float  # Principal + Interest
    monthly_payment: float
    status: str = "active"  # active, paid, defaulted

    class Config:
        orm_mode = True
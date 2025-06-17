export interface Repayment {
  id: string;
  loan_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export interface RepaymentFormData {
  loan_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
}

export interface Summary {
  total_loans: number;
  total_borrowed: number;
  total_repaid: number;
  outstanding_amount: number;
  next_payment_due?: string;
}
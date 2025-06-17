export interface Loan {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  description?: string;
  created_at: string;
  total_amount: number;
  monthly_payment: number;
  status: 'active' | 'paid' | 'defaulted';
}

export interface LoanFormData {
  title: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  description?: string;
}
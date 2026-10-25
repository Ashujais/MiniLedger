export interface User {
  id: string;
  phone_number: string;
  created_at?: string;
  updated_at?: string;
}

export interface Loan {
  id: string;
  user_id: string;
  friend_name: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  is_repaid: boolean;
  repaid_at: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  pendingAmount: number;
  totalCount: number;
  repaidCount: number;
  overdueCount: number;
  pendingCount: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

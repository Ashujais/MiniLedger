export interface User {
  id: string;
  phone_number: string;
  created_at: Date;
  updated_at: Date;
}

export interface OTPRecord {
  id: string;
  phone_number: string;
  otp: string;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

export interface Loan {
  id: string;
  user_id: string;
  friend_name: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  is_repaid: boolean;
  repaid_at: Date | null;
  notes?: string | null;
  receipt_url?: string | null;
  created_at: Date;
  updated_at: Date;
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

export interface AuthTokenPayload {
  userId: string;
  phoneNumber: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

import { Platform } from 'react-native';
import { ApiResponse, AuthResponse, Loan, LoanSummary, User } from '../types';

// Default host based on platform
const getDefaultBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    // Android emulator loops back to localhost via 10.0.2.2
    return 'http://10.0.2.2:5000';
  }
  // iOS simulator or Web
  return 'http://localhost:5000';
};

class ApiClient {
  private baseUrl: string = getDefaultBaseUrl();
  private token: string | null = null;

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>)
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: json.error || `HTTP error ${response.status}`,
          details: json.details
        };
      }

      return json;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network request failed. Is the backend server running?'
      };
    }
  }

  // --- Auth Endpoints ---

  async sendOtp(phoneNumber: string): Promise<ApiResponse<{ debugOtp?: string }>> {
    return this.request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<ApiResponse<AuthResponse>> {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp })
    });
  }

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/api/auth/me');
  }

  // --- Loans Endpoints ---

  async getSummary(): Promise<ApiResponse<LoanSummary>> {
    return this.request('/api/loans/summary');
  }

  async getLoans(filters: { status?: string; search?: string } = {}): Promise<ApiResponse<Loan[]>> {
    const query = new URLSearchParams();
    if (filters.status && filters.status !== 'all') {
      query.append('status', filters.status);
    }
    if (filters.search) {
      query.append('search', filters.search);
    }

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/api/loans${queryString}`);
  }

  async createLoan(data: {
    friendName: string;
    amount: number;
    dueDate: string;
    notes?: string;
    receiptUri?: string;
  }): Promise<ApiResponse<Loan>> {
    if (data.receiptUri) {
      // Send multipart form-data for bonus receipt upload
      const formData = new FormData();
      formData.append('friendName', data.friendName);
      formData.append('amount', String(data.amount));
      formData.append('dueDate', data.dueDate);
      if (data.notes) formData.append('notes', data.notes);

      const filename = data.receiptUri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('receipt', {
        uri: data.receiptUri,
        name: filename,
        type
      } as any);

      return this.request('/api/loans', {
        method: 'POST',
        body: formData
      });
    }

    return this.request('/api/loans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async markAsRepaid(loanId: string): Promise<ApiResponse<Loan>> {
    return this.request(`/api/loans/${loanId}/repay`, {
      method: 'PATCH'
    });
  }

  async deleteLoan(loanId: string): Promise<ApiResponse<null>> {
    return this.request(`/api/loans/${loanId}`, {
      method: 'DELETE'
    });
  }
}

export const api = new ApiClient();

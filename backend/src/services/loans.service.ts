import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { Loan, LoanSummary } from '../types';

export interface CreateLoanParams {
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  notes?: string | null;
  receiptUrl?: string | null;
}

export interface GetLoansFilters {
  status?: 'all' | 'pending' | 'repaid' | 'overdue';
  search?: string;
  sortBy?: 'due_date' | 'created_at' | 'amount';
  sortOrder?: 'ASC' | 'DESC';
}

export class LoansService {
  /**
   * Create a new loan entry
   */
  static async createLoan(params: CreateLoanParams): Promise<Loan> {
    const { userId, friendName, amount, dueDate, notes, receiptUrl } = params;

    const id = uuidv4();
    const query = `
      INSERT INTO loans (id, user_id, friend_name, amount, due_date, notes, receipt_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await db.query(query, [
      id,
      userId,
      friendName.trim(),
      amount,
      dueDate,
      notes ? notes.trim() : null,
      receiptUrl || null
    ]);

    const row = result.rows[0];
    return this.mapLoanRow(row);
  }

  /**
   * Get all loans for a specific user with optional filters
   */
  static async getLoans(userId: string, filters: GetLoansFilters = {}): Promise<Loan[]> {
    const { status = 'all', search, sortBy = 'due_date', sortOrder = 'ASC' } = filters;

    let query = `
      SELECT 
        l.*,
        CASE 
          WHEN l.is_repaid = FALSE AND l.due_date < CURRENT_DATE THEN TRUE
          ELSE FALSE 
        END as is_overdue
      FROM loans l
      WHERE l.user_id = $1
    `;

    const values: any[] = [userId];
    let paramIndex = 2;

    if (status === 'repaid') {
      query += ` AND l.is_repaid = TRUE`;
    } else if (status === 'pending') {
      query += ` AND l.is_repaid = FALSE`;
    } else if (status === 'overdue') {
      query += ` AND l.is_repaid = FALSE AND l.due_date < CURRENT_DATE`;
    }

    if (search && search.trim()) {
      query += ` AND l.friend_name ILIKE $${paramIndex}`;
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const allowedSortFields = ['due_date', 'created_at', 'amount', 'friend_name'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'due_date';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Overdue items highlighted first or standard sort
    query += ` ORDER BY l.is_repaid ASC, is_overdue DESC, l.${safeSortBy} ${safeSortOrder}`;

    const result = await db.query(query, values);
    return result.rows.map((row) => this.mapLoanRow(row));
  }

  /**
   * Get a single loan by ID
   */
  static async getLoanById(loanId: string, userId: string): Promise<Loan | null> {
    const query = `
      SELECT 
        l.*,
        CASE 
          WHEN l.is_repaid = FALSE AND l.due_date < CURRENT_DATE THEN TRUE
          ELSE FALSE 
        END as is_overdue
      FROM loans l
      WHERE l.id = $1 AND l.user_id = $2
    `;

    const result = await db.query(query, [loanId, userId]);
    if (result.rowCount === 0) return null;
    return this.mapLoanRow(result.rows[0]);
  }

  /**
   * Mark loan as repaid
   */
  static async markAsRepaid(loanId: string, userId: string): Promise<Loan> {
    const query = `
      UPDATE loans
      SET 
        is_repaid = TRUE,
        repaid_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [loanId, userId]);
    if (result.rowCount === 0) {
      throw new Error('Loan not found or unauthorized');
    }

    return this.mapLoanRow(result.rows[0]);
  }

  /**
   * Delete a loan
   */
  static async deleteLoan(loanId: string, userId: string): Promise<boolean> {
    const query = `DELETE FROM loans WHERE id = $1 AND user_id = $2`;
    const result = await db.query(query, [loanId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Calculate financial summary: total lent, total repaid, overdue amount
   */
  static async getSummary(userId: string): Promise<LoanSummary> {
    const query = `
      SELECT 
        COALESCE(SUM(amount), 0) AS total_lent,
        COALESCE(SUM(CASE WHEN is_repaid = TRUE THEN amount ELSE 0 END), 0) AS total_repaid,
        COALESCE(SUM(CASE WHEN is_repaid = FALSE AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0) AS overdue_amount,
        COALESCE(SUM(CASE WHEN is_repaid = FALSE THEN amount ELSE 0 END), 0) AS pending_amount,
        COUNT(*) AS total_count,
        COUNT(CASE WHEN is_repaid = TRUE THEN 1 END) AS repaid_count,
        COUNT(CASE WHEN is_repaid = FALSE AND due_date < CURRENT_DATE THEN 1 END) AS overdue_count,
        COUNT(CASE WHEN is_repaid = FALSE THEN 1 END) AS pending_count
      FROM loans
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    const row = result.rows[0];

    const totalLent = parseFloat(row.total_lent) || 0;
    const totalRepaid = parseFloat(row.total_repaid) || 0;
    const overdueAmount = parseFloat(row.overdue_amount) || 0;
    const pendingAmount = parseFloat(row.pending_amount) || 0;

    return {
      totalLent: Math.round(totalLent * 100) / 100,
      totalRepaid: Math.round(totalRepaid * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      totalCount: parseInt(row.total_count, 10) || 0,
      repaidCount: parseInt(row.repaid_count, 10) || 0,
      overdueCount: parseInt(row.overdue_count, 10) || 0,
      pendingCount: parseInt(row.pending_count, 10) || 0
    };
  }

  /**
   * Helper to format raw database row into typed Loan object
   */
  private static mapLoanRow(row: any): Loan {
    // Determine is_overdue if not explicitly calculated
    const dueDateStr = row.due_date instanceof Date
      ? row.due_date.toISOString().split('T')[0]
      : String(row.due_date).split('T')[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = row.is_overdue !== undefined
      ? Boolean(row.is_overdue)
      : (!row.is_repaid && dueDateStr < todayStr);

    return {
      id: row.id,
      user_id: row.user_id,
      friend_name: row.friend_name,
      amount: parseFloat(row.amount),
      due_date: dueDateStr,
      is_repaid: Boolean(row.is_repaid),
      repaid_at: row.repaid_at ? new Date(row.repaid_at) : null,
      notes: row.notes || null,
      receipt_url: row.receipt_url || null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      is_overdue: isOverdue
    };
  }
}

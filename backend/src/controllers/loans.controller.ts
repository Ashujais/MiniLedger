import { Request, Response, NextFunction } from 'express';
import { LoansService } from '../services/loans.service';
import { createLoanSchema, loanIdParamSchema } from '../validators/loan.validator';
import { config } from '../config';

export class LoansController {
  /**
   * Add a new loan entry
   */
  static async createLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const validated = createLoanSchema.parse(req.body);

      // Handle optional receipt photo upload
      let receiptUrl = validated.receiptUrl || null;
      if (req.file) {
        receiptUrl = `${config.baseUrl}/uploads/${req.file.filename}`;
      }

      const loan = await LoansService.createLoan({
        userId,
        friendName: validated.friendName,
        amount: validated.amount,
        dueDate: validated.dueDate,
        notes: validated.notes,
        receiptUrl
      });

      res.status(201).json({
        success: true,
        data: loan,
        message: 'Loan entry created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all loan entries for the authenticated user
   */
  static async getLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { status, search, sortBy, sortOrder } = req.query;

      const loans = await LoansService.getLoans(userId, {
        status: status as any,
        search: search as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      });

      res.status(200).json({
        success: true,
        data: loans,
        count: loans.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single loan by ID
   */
  static async getLoanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = loanIdParamSchema.parse(req.params);

      const loan = await LoansService.getLoanById(id, userId);
      if (!loan) {
        res.status(404).json({
          success: false,
          error: 'Loan entry not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a loan entry as repaid
   */
  static async markAsRepaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = loanIdParamSchema.parse(req.params);

      const loan = await LoansService.markAsRepaid(id, userId);

      res.status(200).json({
        success: true,
        data: loan,
        message: `Loan to ${loan.friend_name} marked as repaid`
      });
    } catch (error: any) {
      if (error.message && error.message.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        next(error);
      }
    }
  }

  /**
   * Delete a loan entry
   */
  static async deleteLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = loanIdParamSchema.parse(req.params);

      const deleted = await LoansService.deleteLoan(id, userId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Loan entry not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Loan entry deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Financial summary endpoint: total lent, total repaid, overdue amount
   */
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await LoansService.getSummary(userId);

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bonus: Upload receipt photo
   */
  static async uploadReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No image file uploaded'
        });
        return;
      }

      const receiptUrl = `${config.baseUrl}/uploads/${req.file.filename}`;

      res.status(200).json({
        success: true,
        data: {
          filename: req.file.filename,
          receiptUrl,
          mimetype: req.file.mimetype,
          size: req.file.size
        },
        message: 'Receipt uploaded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

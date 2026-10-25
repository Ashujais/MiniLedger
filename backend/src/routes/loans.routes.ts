import { Router } from 'express';
import { LoansController } from '../controllers/loans.controller';
import { authenticateToken } from '../middleware/auth';
import { uploadReceipt } from '../middleware/upload';

const router = Router();

// All loan endpoints require authentication
router.use(authenticateToken);

// Summary endpoint: total lent, total repaid, overdue amount
router.get('/summary', LoansController.getSummary);

// Bonus: Upload receipt photo
router.post('/upload-receipt', uploadReceipt.single('receipt'), LoansController.uploadReceipt);

// Get list of loans
router.get('/', LoansController.getLoans);

// Add loan entry (supports optional receipt upload in multipart/form-data)
router.post('/', uploadReceipt.single('receipt'), LoansController.createLoan);

// Get single loan by ID
router.get('/:id', LoansController.getLoanById);

// Mark loan as repaid
router.patch('/:id/repay', LoansController.markAsRepaid);

// Delete loan
router.delete('/:id', LoansController.deleteLoan);

export default router;

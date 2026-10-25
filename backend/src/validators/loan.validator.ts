import { z } from 'zod';

export const sendOtpSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number format. Example: +919876543210 or 9876543210')
});

export const verifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(20, 'Phone number must not exceed 20 characters'),
  otp: z
    .string()
    .trim()
    .min(4, 'OTP must be at least 4 digits')
    .max(10, 'OTP must not exceed 10 characters')
    .regex(/^[0-9]+$/, 'OTP must be numeric')
});

export const createLoanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(1, 'Friend name is required')
    .max(255, 'Friend name must not exceed 255 characters'),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Amount must be a positive number greater than 0'
    }),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, { message: 'Invalid due date' }),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .nullable(),
  receiptUrl: z
    .string()
    .url()
    .optional()
    .nullable()
});

export const loanIdParamSchema = z.object({
  id: z.string().uuid('Invalid loan ID format (must be UUID)')
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;

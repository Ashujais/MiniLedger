import { describe, it, expect } from '@jest/globals';
import { formatDate, getDaysOverdue, getDaysRemaining, formatCurrency } from '../src/utils/date';

describe('Date & Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format numbers to INR currency representation', () => {
      expect(formatCurrency(5000)).toContain('5,000');
      expect(formatCurrency(125000)).toContain('1,25,000');
      expect(formatCurrency(0)).toContain('0');
    });

    it('should handle NaN gracefully', () => {
      expect(formatCurrency(NaN)).toBe('₹0');
    });
  });

  describe('formatDate', () => {
    it('should format YYYY-MM-DD into human readable date', () => {
      const formatted = formatDate('2026-11-15');
      expect(formatted).toContain('15');
      expect(formatted).toContain('Nov');
      expect(formatted).toContain('2026');
    });

    it('should handle null or undefined safely', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
    });
  });

  describe('getDaysOverdue', () => {
    it('should return positive number for dates in the past', () => {
      const overdueDays = getDaysOverdue('2020-01-01');
      expect(overdueDays).toBeGreaterThan(0);
    });

    it('should return 0 for dates in the future', () => {
      const overdueDays = getDaysOverdue('2099-12-31');
      expect(overdueDays).toBe(0);
    });
  });

  describe('getDaysRemaining', () => {
    it('should return positive days for future dates', () => {
      const remaining = getDaysRemaining('2099-12-31');
      expect(remaining).toBeGreaterThan(0);
    });
  });
});

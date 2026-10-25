/**
 * Formats YYYY-MM-DD or ISO date string into human-readable format (e.g., '15 Nov 2026')
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculates how many days overdue a date is. Returns 0 if not overdue.
 */
export function getDaysOverdue(dueDateString: string): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateString.includes('T') ? dueDateString : `${dueDateString}T00:00:00`);
    due.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return 0;
  }
}

/**
 * Calculates days remaining until due date.
 */
export function getDaysRemaining(dueDateString: string): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateString.includes('T') ? dueDateString : `${dueDateString}T00:00:00`);
    due.setHours(0, 0, 0, 0);

    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return 0;
  }
}

/**
 * Formats a number to currency string (e.g., ₹ 5,000)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

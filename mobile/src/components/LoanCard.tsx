import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Loan } from '../types';
import { colors } from '../theme/colors';
import { formatDate, formatCurrency, getDaysOverdue, getDaysRemaining } from '../utils/date';

interface LoanCardProps {
  loan: Loan;
  onMarkRepaid: (loan: Loan) => void;
  onViewReceipt?: (receiptUrl: string) => void;
  onDelete?: (loan: Loan) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onMarkRepaid,
  onViewReceipt,
  onDelete
}) => {
  const isOverdue = loan.is_overdue && !loan.is_repaid;
  const isRepaid = loan.is_repaid;
  const daysOverdue = isOverdue ? getDaysOverdue(loan.due_date) : 0;
  const daysRemaining = !isOverdue && !isRepaid ? getDaysRemaining(loan.due_date) : 0;

  return (
    <View
      style={[
        styles.card,
        isOverdue && styles.overdueCard,
        isRepaid && styles.repaidCard
      ]}
    >
      {/* Top Row: Friend Name + Status Badge */}
      <View style={styles.topRow}>
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, isRepaid && styles.repaidText]}>
            {loan.friend_name}
          </Text>
          <Text style={styles.createdDate}>
            Lent on {formatDate(loan.created_at)}
          </Text>
        </View>

        {/* Status Badge */}
        {isOverdue && (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueBadgeText}>
              ⚠️ OVERDUE {daysOverdue > 0 ? `(${daysOverdue}d)` : ''}
            </Text>
          </View>
        )}

        {isRepaid && (
          <View style={styles.repaidBadge}>
            <Text style={styles.repaidBadgeText}>✓ Repaid</Text>
          </View>
        )}

        {!isOverdue && !isRepaid && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>
              ⏳ {daysRemaining <= 0 ? 'Due Today' : `${daysRemaining}d left`}
            </Text>
          </View>
        )}
      </View>

      {/* Middle Row: Amount & Due Date */}
      <View style={styles.amountDueDateRow}>
        <View>
          <Text style={styles.amountLabel}>Amount Lent</Text>
          <Text
            style={[
              styles.amountValue,
              isOverdue && styles.overdueAmountValue,
              isRepaid && styles.repaidAmountValue
            ]}
          >
            {formatCurrency(loan.amount)}
          </Text>
        </View>

        <View style={styles.dueDateContainer}>
          <Text style={styles.dueDateLabel}>Due Date</Text>
          <Text
            style={[
              styles.dueDateValue,
              isOverdue && styles.overdueDueDateValue
            ]}
          >
            📅 {formatDate(loan.due_date)}
          </Text>
        </View>
      </View>

      {/* Optional Notes */}
      {loan.notes ? (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText} numberOfLines={2}>
            💬 {loan.notes}
          </Text>
        </View>
      ) : null}

      {/* Optional Receipt Attachment Thumbnail */}
      {loan.receipt_url ? (
        <TouchableOpacity
          style={styles.receiptContainer}
          activeOpacity={0.8}
          onPress={() => onViewReceipt && onViewReceipt(loan.receipt_url!)}
        >
          <Image
            source={{ uri: loan.receipt_url }}
            style={styles.receiptThumbnail}
            resizeMode="cover"
          />
          <View style={styles.receiptTextContainer}>
            <Text style={styles.receiptTitle}>📎 Receipt Attached</Text>
            <Text style={styles.receiptSubtext}>Tap to inspect full photo</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Card Action Footer */}
      <View style={styles.footerRow}>
        {!isRepaid ? (
          <TouchableOpacity
            style={[
              styles.repayButton,
              isOverdue && styles.repayButtonOverdue
            ]}
            onPress={() => onMarkRepaid(loan)}
            activeOpacity={0.8}
          >
            <Text style={styles.repayButtonText}>✓ Mark as Repaid</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.repaidConfirmedRow}>
            <Text style={styles.repaidConfirmedText}>
              ✓ Settled on {formatDate(loan.repaid_at || loan.updated_at)}
            </Text>
          </View>
        )}

        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(loan)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  // Overdue Highlighting (Prominently styled with alert borders and soft red background)
  overdueCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
    borderLeftWidth: 6,
    borderLeftColor: colors.danger,
    shadowColor: colors.danger,
    shadowOpacity: 0.12
  },
  repaidCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderLeftWidth: 5,
    borderLeftColor: colors.success,
    opacity: 0.88
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  friendInfo: {
    flex: 1,
    marginRight: 8
  },
  friendName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary
  },
  createdDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  repaidText: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through'
  },
  overdueBadge: {
    backgroundColor: colors.overdueBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.dangerBorder
  },
  overdueBadgeText: {
    color: colors.overdueBadgeText,
    fontSize: 11,
    fontWeight: '800'
  },
  repaidBadge: {
    backgroundColor: colors.repaidBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.successBorder
  },
  repaidBadgeText: {
    color: colors.repaidBadgeText,
    fontSize: 11,
    fontWeight: '700'
  },
  pendingBadge: {
    backgroundColor: colors.pendingBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warningBorder
  },
  pendingBadgeText: {
    color: colors.pendingBadgeText,
    fontSize: 11,
    fontWeight: '700'
  },
  amountDueDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginVertical: 4
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase'
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2
  },
  overdueAmountValue: {
    color: colors.danger
  },
  repaidAmountValue: {
    color: colors.textMuted,
    textDecorationLine: 'line-through'
  },
  dueDateContainer: {
    alignItems: 'flex-end'
  },
  dueDateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase'
  },
  dueDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2
  },
  overdueDueDateValue: {
    color: colors.danger,
    fontWeight: '800'
  },
  notesContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 8,
    borderRadius: 6,
    marginTop: 8
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic'
  },
  receiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  receiptThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#CBD5E1'
  },
  receiptTextContainer: {
    marginLeft: 10,
    flex: 1
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark
  },
  receiptSubtext: {
    fontSize: 11,
    color: colors.primary
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 6
  },
  repayButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  repayButtonOverdue: {
    backgroundColor: '#047857' // Deep emerald
  },
  repayButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  repaidConfirmedRow: {
    flex: 1,
    paddingVertical: 6
  },
  repaidConfirmedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted
  }
});

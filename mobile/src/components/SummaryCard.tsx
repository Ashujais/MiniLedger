import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoanSummary } from '../types';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/date';

interface SummaryCardProps {
  summary: LoanSummary | null;
  loading?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, loading }) => {
  const totalLent = summary?.totalLent ?? 0;
  const totalRepaid = summary?.totalRepaid ?? 0;
  const overdueAmount = summary?.overdueAmount ?? 0;
  const pendingAmount = summary?.pendingAmount ?? (totalLent - totalRepaid);

  return (
    <View style={styles.cardContainer}>
      {/* Top Banner: Net Outstanding */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerSubtitle}>Net Active Lent</Text>
          <Text style={styles.headerPrimaryAmount}>
            {loading ? '...' : formatCurrency(pendingAmount)}
          </Text>
        </View>
        {overdueAmount > 0 && (
          <View style={styles.overdueAlertPill}>
            <Text style={styles.overdueAlertText}>
              ⚠️ {summary?.overdueCount ?? 1} Overdue
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* 3 Core Metric Columns: Total Lent, Repaid, Overdue */}
      <View style={styles.metricsRow}>
        {/* Total Lent */}
        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>Total Lent</Text>
          <Text style={styles.metricValueLent}>
            {loading ? '...' : formatCurrency(totalLent)}
          </Text>
          <Text style={styles.metricCountText}>
            {summary?.totalCount ?? 0} {summary?.totalCount === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        <View style={styles.verticalDivider} />

        {/* Total Repaid */}
        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>Total Repaid</Text>
          <Text style={styles.metricValueRepaid}>
            {loading ? '...' : formatCurrency(totalRepaid)}
          </Text>
          <Text style={[styles.metricCountText, { color: colors.success }]}>
            {summary?.repaidCount ?? 0} repaid
          </Text>
        </View>

        <View style={styles.verticalDivider} />

        {/* Overdue Amount (Highlighted) */}
        <View style={[styles.metricColumn, overdueAmount > 0 ? styles.overdueColumnHighlight : null]}>
          <Text style={[styles.metricLabel, overdueAmount > 0 ? { color: colors.danger } : null]}>
            Overdue
          </Text>
          <Text style={[styles.metricValueOverdue, overdueAmount > 0 ? { color: colors.danger } : null]}>
            {loading ? '...' : formatCurrency(overdueAmount)}
          </Text>
          <Text style={[styles.metricCountText, overdueAmount > 0 ? { color: colors.danger } : null]}>
            {summary?.overdueCount ?? 0} past due
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F172A', // Slate 900 dark theme card
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8', // Slate 400
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  headerPrimaryAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC', // Slate 50
    marginTop: 2
  },
  overdueAlertPill: {
    backgroundColor: '#7F1D1D', // Dark red bg
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.danger
  },
  overdueAlertText: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '700'
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B', // Slate 800
    marginVertical: 12
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4
  },
  overdueColumnHighlight: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 4
  },
  verticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#1E293B',
    alignSelf: 'center'
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  metricValueLent: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0'
  },
  metricValueRepaid: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34D399' // Light emerald
  },
  metricValueOverdue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F87171' // Light red
  },
  metricCountText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4
  }
});

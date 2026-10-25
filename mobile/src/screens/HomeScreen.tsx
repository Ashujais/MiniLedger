import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Loan, LoanSummary } from '../types';
import { colors } from '../theme/colors';
import { SummaryCard } from '../components/SummaryCard';
import { LoanCard } from '../components/LoanCard';
import { AddLoanModal } from '../components/AddLoanModal';
import { ReceiptModal } from '../components/ReceiptModal';

type FilterTab = 'all' | 'overdue' | 'pending' | 'repaid';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [loansRes, summaryRes] = await Promise.all([
        api.getLoans(),
        api.getSummary()
      ]);

      if (loansRes.success && loansRes.data) {
        setLoans(loansRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      console.warn('Failed to fetch loans data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleMarkRepaid = (loan: Loan) => {
    Alert.alert(
      'Mark as Repaid',
      `Did ${loan.friend_name} repay ₹${loan.amount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Repaid',
          style: 'default',
          onPress: async () => {
            // Optimistic UI update
            setLoans((prev) =>
              prev.map((item) =>
                item.id === loan.id
                  ? { ...item, is_repaid: true, repaid_at: new Date().toISOString(), is_overdue: false }
                  : item
              )
            );

            const res = await api.markAsRepaid(loan.id);
            if (res.success) {
              // Refresh summary metrics from server
              const sumRes = await api.getSummary();
              if (sumRes.success && sumRes.data) {
                setSummary(sumRes.data);
              }
            } else {
              Alert.alert('Error', res.error || 'Failed to update repayment status');
              fetchData(); // Rollback on error
            }
          }
        }
      ]
    );
  };

  const handleDeleteLoan = (loan: Loan) => {
    Alert.alert(
      'Delete Loan Entry',
      `Are you sure you want to delete the loan record to ${loan.friend_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoans((prev) => prev.filter((item) => item.id !== loan.id));
            await api.deleteLoan(loan.id);
            const sumRes = await api.getSummary();
            if (sumRes.success && sumRes.data) {
              setSummary(sumRes.data);
            }
          }
        }
      ]
    );
  };

  const handleCreateLoan = async (data: {
    friendName: string;
    amount: number;
    dueDate: string;
    notes?: string;
    receiptUri?: string;
  }): Promise<boolean> => {
    const res = await api.createLoan(data);
    if (res.success && res.data) {
      await fetchData();
      return true;
    }
    throw new Error(res.error || 'Failed to create loan entry');
  };

  const handleViewReceipt = (receiptUrl: string) => {
    setSelectedReceiptUrl(receiptUrl);
    setReceiptModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of MiniLedger?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout }
    ]);
  };

  // Filter and search logic
  const filteredLoans = loans.filter((item) => {
    // Status filter
    if (activeFilter === 'overdue' && (!item.is_overdue || item.is_repaid)) {
      return false;
    }
    if (activeFilter === 'pending' && item.is_repaid) {
      return false;
    }
    if (activeFilter === 'repaid' && !item.is_repaid) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.friend_name.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q) ?? false;
      return matchName || matchNotes;
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Text style={styles.headerLogo}>💰</Text>
          <View>
            <Text style={styles.appName}>MiniLedger</Text>
            <Text style={styles.userPhoneBadge}>
              📱 {user?.phone_number || 'Guest User'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={fetchData}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.refreshIconText}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content with FlatList */}
      <FlatList
        data={filteredLoans}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Summary Card at the Top */}
            <SummaryCard summary={summary} loading={loading} />

            {/* Search Input Bar */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search friend name or notes..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              {(['all', 'overdue', 'pending', 'repaid'] as FilterTab[]).map((tab) => {
                const isActive = activeFilter === tab;
                const overdueCount = summary?.overdueCount ?? 0;

                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.filterPill,
                      isActive && styles.filterPillActive,
                      tab === 'overdue' && overdueCount > 0 && !isActive && styles.filterPillOverdueNotice
                    ]}
                    onPress={() => setActiveFilter(tab)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isActive && styles.filterPillTextActive,
                        tab === 'overdue' && overdueCount > 0 && styles.filterPillTextOverdue
                      ]}
                    >
                      {tab === 'all' && `All (${loans.length})`}
                      {tab === 'overdue' && `Overdue ${overdueCount > 0 ? `(${overdueCount})` : ''}`}
                      {tab === 'pending' && `Pending (${summary?.pendingCount ?? 0})`}
                      {tab === 'repaid' && `Repaid (${summary?.repaidCount ?? 0})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section Heading */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeFilter === 'all' && 'All Loan Entries'}
                {activeFilter === 'overdue' && '⚠️ Overdue Loans (Urgent)'}
                {activeFilter === 'pending' && '⏳ Active Pending Loans'}
                {activeFilter === 'repaid' && '✓ Settled & Repaid Loans'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {filteredLoans.length} {filteredLoans.length === 1 ? 'entry' : 'entries'} shown
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            onMarkRepaid={handleMarkRepaid}
            onViewReceipt={handleViewReceipt}
            onDelete={handleDeleteLoan}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyText}>Loading loans...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching entries found' : 'No loan entries yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try searching with a different name or clear the filter.'
                  : 'Tap the "+ Add Loan" button below to record money lent to a friend.'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setAddModalVisible(true)}
                >
                  <Text style={styles.emptyAddBtnText}>+ Add First Loan</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button (FAB) to Add Loan */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>Add Loan</Text>
      </TouchableOpacity>

      {/* Add Loan Modal */}
      <AddLoanModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleCreateLoan}
      />

      {/* Full Screen Receipt Modal */}
      <ReceiptModal
        visible={receiptModalVisible}
        imageUrl={selectedReceiptUrl}
        onClose={() => {
          setReceiptModalVisible(false);
          setSelectedReceiptUrl(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerLogo: {
    fontSize: 26,
    marginRight: 10
  },
  appName: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  userPhoneBadge: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  refreshIconBtn: {
    padding: 6
  },
  refreshIconText: {
    fontSize: 16
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9'
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary
  },
  listContent: {
    paddingBottom: 90
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary
  },
  clearSearchText: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: 4
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border
  },
  filterPillActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary
  },
  filterPillOverdueNotice: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.overdueBadgeBg
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary
  },
  filterPillTextActive: {
    color: '#FFFFFF'
  },
  filterPillTextOverdue: {
    color: colors.danger
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginVertical: 6
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280
  },
  emptyAddBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6
  },
  fabIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '900',
    marginRight: 6
  },
  fabText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});

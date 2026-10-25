import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    friendName: string;
    amount: number;
    dueDate: string;
    notes?: string;
    receiptUri?: string;
  }) => Promise<boolean>;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  visible,
  onClose,
  onSubmit
}) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  
  // Default due date: 7 days from today in YYYY-MM-DD
  const getDefaultDueDate = (daysAhead: number = 7): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(getDefaultDueDate(7));
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFriendName('');
    setAmount('');
    setDueDate(getDefaultDueDate(7));
    setNotes('');
    setReceiptUri(null);
    setErrorMessage(null);
  };

  const handleQuickAddDays = (days: number) => {
    setDueDate(getDefaultDueDate(days));
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + addValue));
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to attach receipt photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Image Picker Error', err.message || 'Failed to select image');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    // Validation
    if (!friendName.trim()) {
      setErrorMessage('Please enter your friend\'s name');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid loan amount greater than ₹0');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      setErrorMessage('Due date must be in YYYY-MM-DD format (e.g. 2026-11-15)');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await onSubmit({
        friendName: friendName.trim(),
        amount: numAmount,
        dueDate: dueDate.trim(),
        notes: notes.trim() || undefined,
        receiptUri: receiptUri || undefined
      });

      if (success) {
        resetForm();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create loan entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>+ New Loan Entry</Text>
              <Text style={styles.modalSubtitle}>Record money lent to a friend</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}

            {/* Friend Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Friend's Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textMuted}
                value={friendName}
                onChangeText={setFriendName}
                autoCapitalize="words"
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Amount Lent (₹) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.amountInput]}
                placeholder="₹ 0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              {/* Quick Amount Chips */}
              <View style={styles.chipsRow}>
                {[500, 1000, 2000, 5000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={styles.chip}
                    onPress={() => handleQuickAddAmount(val)}
                  >
                    <Text style={styles.chipText}>+₹{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Due Date (YYYY-MM-DD) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={dueDate}
                onChangeText={setDueDate}
              />
              {/* Quick Date Chips */}
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleQuickAddDays(7)}
                >
                  <Text style={styles.chipText}>In 7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleQuickAddDays(14)}
                >
                  <Text style={styles.chipText}>In 2 Weeks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => handleQuickAddDays(30)}
                >
                  <Text style={styles.chipText}>In 1 Month</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes / Reason (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="e.g. Dinner bill, concert ticket, split cab fare..."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Bonus: Receipt Photo Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Receipt Photo (Bonus)</Text>
              {receiptUri ? (
                <View style={styles.receiptPreviewContainer}>
                  <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                  <TouchableOpacity
                    style={styles.removeReceiptButton}
                    onPress={() => setReceiptUri(null)}
                  >
                    <Text style={styles.removeReceiptText}>✕ Remove Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadText}>Attach Receipt Photo</Text>
                  <Text style={styles.uploadSubtext}>Select from photo gallery</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Submit Action Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>✓ Save Loan Entry</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6
  },
  requiredStar: {
    color: colors.danger
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary
  },
  amountInput: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top'
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  chip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  chipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700'
  },
  uploadButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary
  },
  uploadSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  receiptPreviewContainer: {
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    backgroundColor: '#F8FAFC'
  },
  receiptImage: {
    width: '100%',
    height: 140,
    borderRadius: 8
  },
  removeReceiptButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  removeReceiptText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700'
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  }
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { colors } from '../theme/colors';

export const LoginScreen: React.FC = () => {
  const { login, apiBaseUrl, setApiBaseUrl } = useAuth();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('+919876543210');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Settings for custom API URL
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(apiBaseUrl);

  const handleSendOtp = async () => {
    setErrorMsg(null);
    setSuccessInfo(null);

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      setErrorMsg('Please enter a valid phone number (at least 7 digits)');
      return;
    }

    try {
      setLoading(true);
      const res = await api.sendOtp(cleanPhone);

      if (res.success) {
        setStep('OTP');
        setSuccessInfo(
          `OTP sent! Check your backend terminal logs. (Or use mock master OTP '123456')`
        );
        if (res.data?.debugOtp) {
          setOtpCode(res.data.debugOtp);
        }
      } else {
        setErrorMsg(res.error || 'Failed to send OTP. Check backend connection.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);

    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }

    try {
      setLoading(true);
      const result = await login(phoneNumber.trim(), otpCode.trim());

      if (!result.success) {
        setErrorMsg(result.error || 'Invalid OTP code');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = async () => {
    if (customUrl.trim()) {
      await setApiBaseUrl(customUrl.trim());
      setShowConfig(false);
      Alert.alert('Server URL Updated', `API endpoint set to: ${customUrl.trim()}`);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>💰</Text>
          </View>
          <Text style={styles.brandTitle}>MiniLedger</Text>
          <Text style={styles.brandTagline}>
            Track money lent to friends effortlessly
          </Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {successInfo && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>ℹ️ {successInfo}</Text>
            </View>
          )}

          {step === 'PHONE' ? (
            /* Step 1: Phone Number */
            <View>
              <Text style={styles.sectionTitle}>Welcome Back</Text>
              <Text style={styles.sectionSubtitle}>
                Enter your phone number to receive an instant OTP
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+919876543210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Get OTP Code →</Text>
                )}
              </TouchableOpacity>

              {/* Demo Hint */}
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  💡 <Text style={{ fontWeight: '700' }}>Mock OTP:</Text> The server logs the 6-digit OTP in its terminal. Master code <Text style={{ fontWeight: '700' }}>123456</Text> is also accepted!
                </Text>
              </View>
            </View>
          ) : (
            /* Step 2: OTP Verification */
            <View>
              <Text style={styles.sectionTitle}>Enter Verification Code</Text>
              <Text style={styles.sectionSubtitle}>
                Sent to <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{phoneNumber}</Text>
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>6-Digit OTP Code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Login ✓</Text>
                )}
              </TouchableOpacity>

              <View style={styles.otpActionRow}>
                <TouchableOpacity
                  onPress={() => {
                    setStep('PHONE');
                    setErrorMsg(null);
                  }}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>← Change Number</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendOtp}
                  style={styles.secondaryAction}
                >
                  <Text style={styles.secondaryActionText}>Resend OTP 🔄</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Server Connection URL Config (Useful for Testing on Physical Devices) */}
        <View style={styles.serverConfigContainer}>
          <TouchableOpacity
            onPress={() => setShowConfig(!showConfig)}
            style={styles.serverConfigToggle}
          >
            <Text style={styles.serverConfigToggleText}>
              ⚙️ Server Endpoint: {apiBaseUrl} {showConfig ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.serverConfigBox}>
              <Text style={styles.configLabel}>
                Change backend URL (e.g. http://192.168.1.5:5000 for physical phone Expo Go):
              </Text>
              <TextInput
                style={styles.configInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.configSaveBtn}
                onPress={handleSaveApiUrl}
              >
                <Text style={styles.configSaveText}>Update URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  logoIcon: {
    fontSize: 32
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5
  },
  brandTagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.textPrimary
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    color: colors.primaryDark
  },
  primaryButton: {
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
  buttonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  otpActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18
  },
  secondaryAction: {
    padding: 6
  },
  secondaryActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700'
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600'
  },
  successBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16
  },
  successText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '600'
  },
  hintContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17
  },
  serverConfigContainer: {
    marginTop: 24,
    alignItems: 'center'
  },
  serverConfigToggle: {
    padding: 8
  },
  serverConfigToggleText: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline'
  },
  serverConfigBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    width: '100%'
  },
  configLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6
  },
  configInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 10
  },
  configSaveBtn: {
    backgroundColor: colors.textPrimary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  configSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  }
});

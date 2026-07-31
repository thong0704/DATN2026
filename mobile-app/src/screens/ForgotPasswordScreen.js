import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { forgotPassword, resetPassword, resendVerificationCodeApi } from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendRequest = async () => {
    if (!email) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      setStep(2);
      setCountdown(60);
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      await resendVerificationCodeApi(email);
      setCountdown(60);
      Alert.alert('Thành công', 'Đã gửi lại mã OTP mới');
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email, code, newPassword);
      Alert.alert('Thành công', 'Đặt lại mật khẩu thành công.', [
        { text: 'Đăng Nhập', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (e) {
      Alert.alert('Lỗi', e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerBox}>
          <Text style={styles.title}>Quên Mật Khẩu 🔑</Text>
          <Text style={styles.subtitle}>
            {step === 1 
              ? 'Nhập email tài khoản của bạn để nhận mã khôi phục mật khẩu.' 
              : `Chúng tôi đã gửi mã OTP gồm 6 chữ số tới email ${email}`}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.label}>Địa chỉ Email tài khoản *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSendRequest} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.sendBtnText}>Gửi Mã Khôi Phục</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>Mã OTP (6 chữ số) *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mã OTP"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
            </View>

            <Text style={styles.label}>Mật khẩu mới *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Xác nhận mật khẩu mới *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity style={styles.sendBtn} onPress={handleResetPassword} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.sendBtnText}>Đặt Lại Mật Khẩu</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendBox}>
              <Text style={styles.resendText}>Chưa nhận được mã? </Text>
              <TouchableOpacity 
                onPress={handleResendOTP} 
                disabled={countdown > 0 || loading}
              >
                <Text style={[styles.resendBtnText, countdown > 0 && styles.disabledText]}>
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại ngay'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerBox: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  sendBtnText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 15,
  },
  resendBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  disabledText: {
    color: COLORS.textMuted,
  }
});

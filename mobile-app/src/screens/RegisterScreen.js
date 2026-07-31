import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { registerUser, verifyRegistrationApi, resendVerificationCodeApi } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { login } = useContext(AuthContext);

  // Step 1: Thẻ điền thông tin cá nhân | Step 2: Màn hình nhập mã xác thực OTP 6 chữ số qua Email
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Bước 1: Đăng ký thông tin -> Backend gửi OTP 6 chữ số tới Email
  const handleRegisterStep1 = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      const res = await registerUser({ name, email, phone, password });
      Alert.alert('Mã Xác Thực Đã Gửi! 📧', res.message || `Mã OTP xác nhận đã được gửi về email ${email}`);
      setStep(2); // Chuyển sang bước 2 nhập OTP
    } catch (error) {
      Alert.alert('Đăng ký thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Nhập mã OTP 6 chữ số -> Hoàn tất đăng ký & Đăng nhập
  const handleVerifyOtp = async () => {
    if (!verificationCode || verificationCode.trim().length < 4) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã xác thực OTP gửi qua email.');
      return;
    }

    try {
      setLoading(true);
      const result = await verifyRegistrationApi(email, verificationCode.trim());
      if (result && result.user && result.token) {
        login(result.user, result.token);
        Alert.alert('Thành Công 🎉', 'Tài khoản của bạn đã được xác thực thành công!');
        navigation.navigate('MainTabs', { screen: 'Profile' });
      }
    } catch (error) {
      Alert.alert('Xác thực thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendCode = async () => {
    try {
      setLoading(true);
      await resendVerificationCodeApi(email);
      Alert.alert('Thành công', `Đã gửi lại mã OTP mới về email ${email}`);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Đăng Ký Tài Khoản' : 'Xác Thực Email OTP'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {step === 1 ? (
          /* ================= BƯỚC 1: ĐIỀN THÔNG TIN ================= */
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Tạo Tài Khoản Mới ✨</Text>
            <Text style={styles.subtitleText}>Trải nghiệm đặt phòng nghỉ dưỡng tinh hoa với 2T Hotel Group.</Text>

            <Text style={styles.label}>Họ và Tên *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
              <TextInput style={styles.input} placeholder="Nguyễn Văn A" value={name} onChangeText={setName} />
            </View>

            <Text style={styles.label}>Địa Chỉ Email *</Text>
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

            <Text style={styles.label}>Số Điện Thoại *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="0901234567"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <Text style={styles.label}>Mật Khẩu *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Xác Nhận Mật Khẩu *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegisterStep1} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.primaryBtnText}>Tiếp Tục & Nhận Mã Email</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Đăng Nhập Ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ================= BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ XÁC THỰC EMAIL ================= */
          <View style={styles.formCard}>
            <View style={styles.emailIconBox}>
              <Ionicons name="mail-unread-outline" size={54} color={COLORS.primary} />
            </View>

            <Text style={styles.welcomeText}>Nhập Mã Xác Thực 📩</Text>
            <Text style={styles.subtitleText}>
              Mã OTP xác thực 6 chữ số đã được gửi đến email:{'\n'}
              <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{email}</Text>
            </Text>

            <Text style={styles.label}>Mã Xác Thực OTP (6 chữ số) *</Text>
            <View style={[styles.inputBox, styles.otpBox]}>
              <Ionicons name="key-outline" size={22} color={COLORS.primary} style={styles.icon} />
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.primaryBtnText}>Xác Nhận & Hoàn Tất Đăng Ký</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={handleResendCode} disabled={loading}>
              <Text style={styles.resendText}>Chưa nhận được mã? Gửi lại mã OTP</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  formCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  emailIconBox: {
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
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
  otpBox: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff',
  },
  otpInput: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: COLORS.primary,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  primaryBtnText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 15,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  linkText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

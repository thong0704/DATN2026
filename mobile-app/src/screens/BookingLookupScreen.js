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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { ThemeContext } from '../context/ThemeContext';
import { lookupBookingByCode } from '../services/api';
import BookingCard from '../components/BookingCard';

export default function BookingLookupScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const [bookingCode, setBookingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundBooking, setFoundBooking] = useState(null);

  const handleLookup = async () => {
    if (!bookingCode) {
      Alert.alert('Thông báo', 'Vui lòng nhập Mã Đơn Hàng.');
      return;
    }

    try {
      setLoading(true);
      const res = await lookupBookingByCode(bookingCode);
      setFoundBooking(res);
    } catch (error) {
      Alert.alert('Không tìm thấy', error.message || 'Không tìm thấy đơn hàng');
      setFoundBooking(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Tra Cứu Đơn Đặt Phòng 🔍</Text>
        <Text style={styles.subtitle}>
          Dành cho khách hàng chưa đăng nhập tài khoản. Tra cứu bằng mã vé.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Mã Đơn Hàng (Ví dụ: BK-89412) *</Text>
          <View style={styles.inputBox}>
            <Ionicons name="barcode-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="BK-XXXXX"
              value={bookingCode}
              onChangeText={setBookingCode}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleLookup} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.textWhite} />
            ) : (
              <Text style={styles.submitBtnText}>Tra Cứu Ngay</Text>
            )}
          </TouchableOpacity>
        </View>

        {foundBooking && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Kết Quả Tìm Thấy:</Text>
            <BookingCard booking={foundBooking} onViewDetails={() => {}} />
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
    padding: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
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
    marginBottom: SPACING.sm,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  submitBtnText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultBox: {
    marginTop: SPACING.md,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
});

import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { changePassword } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, token, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, theme } = useContext(ThemeContext);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const userAvatar =
    user?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  const handleLogout = () => {
    Alert.alert('Đăng Xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng Xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }
    try {
      setIsLoadingPassword(true);
      await changePassword(token, currentPassword, newPassword);
      Alert.alert('Thành công', 'Đổi mật khẩu thành công');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.cardBackground}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        {user ? (
          <View style={[styles.userCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: theme.textPrimary }]}>{user.name}</Text>
                <View style={styles.vipBadge}>
                  <Ionicons name="sparkles" size={12} color="#b45309" />
                  <Text style={styles.vipText}>Thành Viên VIP</Text>
                </View>
              </View>

              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
              <Text style={styles.rewardPoints}>⭐ 2,450 Điểm Tích Lũy</Text>
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.guestCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Ionicons name="person-circle-outline" size={54} color={COLORS.primary} />
            <Text style={[styles.guestTitle, { color: theme.textPrimary }]}>Chào mừng bạn đến với 2T Hotel Group!</Text>
            <Text style={[styles.guestDesc, { color: theme.textSecondary }]}>Đăng nhập để tích điểm hội viên và quản lý lịch sử đặt phòng.</Text>

            <View style={styles.guestAuthBtns}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginBtnText}>Đăng Nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerBtn}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerBtnText}>Đăng Ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* AI Assistant Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={() => navigation.navigate('Chatbot')}
          activeOpacity={0.9}
        >
          <View style={styles.aiBannerIcon}>
            <Ionicons name="sparkles" size={24} color={COLORS.textWhite} />
          </View>
          <View style={styles.aiBannerTextContainer}>
            <Text style={styles.aiBannerTitle}>AI Assistant Tư Vấn 24/7 🤖</Text>
            <Text style={styles.aiBannerDesc}>Gợi ý khách sạn & điểm đến thông minh</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textWhite} />
        </TouchableOpacity>

        {/* Quick Features Menu */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Tài Khoản & Tiện Ích Đầy Đủ Như Bản Web</Text>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('Wishlist')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="heart" size={18} color={COLORS.danger} />
            </View>
            <Text style={[styles.menuText, { color: theme.textPrimary }]}>Khách Sạn Đã Lưu (Wishlist)</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('MyInvoices')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="receipt-outline" size={18} color={COLORS.success} />
            </View>
            <Text style={[styles.menuText, { color: theme.textPrimary }]}>Hóa Đơn Thanh Toán của Tôi</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('BookingLookup')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="search" size={18} color={COLORS.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.textPrimary }]}>Tra Cứu Đơn Đặt Phòng (Không cần ĐN)</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('Articles')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="book" size={18} color={COLORS.accent} />
            </View>
            <Text style={[styles.menuText, { color: theme.textPrimary }]}>Cẩm Nang Du Lịch & Mẹo Săn Voucher</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('Contact')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="call" size={18} color={COLORS.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.textPrimary }]}>Liên Hệ Hỗ Trợ</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Cài Đặt Ứng Dụng</Text>

          <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.inputBg }]}>
              <Ionicons name="moon" size={18} color={theme.textPrimary} />
            </View>
            <Text style={[styles.menuText, { color: theme.textPrimary }]}>Giao Diện Tối (Dark Mode)</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={isDarkMode ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          {user && (
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => setShowPasswordModal(true)}
            >
              <View style={[styles.iconBox, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="lock-closed" size={18} color="#be185d" />
              </View>
              <Text style={[styles.menuText, { color: theme.textPrimary }]}>Đổi mật khẩu</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button if Logged In */}
        {user && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Đăng Xuất Tài Khoản</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.versionText, { color: theme.textMuted }]}>
          Phiên bản App Hotel Booking v1.0.0 (Tương thích 100% CSDL Web)
        </Text>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Đổi Mật Khẩu</Text>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.passwordInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Mật khẩu hiện tại"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPwd}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeIcon}>
                <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.passwordInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Mật khẩu mới"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPwd}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.passwordInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPwd}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            
            <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword} disabled={isLoadingPassword}>
              {isLoadingPassword ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.submitBtnText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPasswordModal(false)}>
              <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 6,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  vipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b45309',
    marginLeft: 2,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  rewardPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  editProfileBtn: {
    padding: 8,
  },
  guestCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  guestDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: SPACING.xs,
  },
  guestAuthBtns: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    width: '100%',
  },
  loginBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginRight: 8,
  },
  loginBtnText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
  },
  registerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  registerBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  aiBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  aiBannerTextContainer: {
    flex: 1,
  },
  aiBannerTitle: {
    color: COLORS.textWhite,
    fontWeight: '800',
    fontSize: 15,
  },
  aiBannerDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    marginBottom: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.large,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  submitBtnText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 14,
  },
});

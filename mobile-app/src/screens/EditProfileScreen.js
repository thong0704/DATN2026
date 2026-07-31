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
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { updateProfile } from '../services/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
];

export default function EditProfileScreen({ navigation }) {
  const { user, token, setUser, updateAvatar } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(
    user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Chọn ảnh từ kho ảnh thư viện của điện thoại
  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Cấp quyền', 'Ứng dụng cần quyền truy cập bộ sưu tập ảnh để đổi avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setAvatar(selectedUri);
        setShowAvatarModal(false);
      }
    } catch (error) {
      Alert.alert('Lỗi chọn ảnh', 'Không thể chọn ảnh từ thư viện thiết bị.');
    }
  };

  const handleSaveProfile = async () => {
    if (!name || !phone) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    try {
      setLoading(true);
      const res = await updateProfile(token, { name, phone, avatar });
      await updateAvatar(avatar);
      if (res && res.data && res.data.user) {
        await setUser({ ...res.data.user, avatar });
      }
      Alert.alert('Thành công 🎉', 'Đã cập nhật thông tin cá nhân & Ảnh đại diện!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Cập nhật thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.cardBackground} />

      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Chỉnh Sửa Hồ Sơ 👤</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
            <TouchableOpacity style={styles.changeAvatarBtn} onPress={() => setShowAvatarModal(true)}>
              <Ionicons name="camera" size={16} color={COLORS.textWhite} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>Nhấn biểu tượng camera để đổi Ảnh Đại Diện</Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Họ và Tên *</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="person-outline" size={20} color={theme.textMuted} style={styles.icon} />
            <TextInput style={[styles.input, { color: theme.textPrimary }]} value={name} onChangeText={setName} placeholder="Họ và tên" />
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Địa chỉ Email (Khóa cố định)</Text>
          <View style={[styles.inputBox, styles.disabledInput, { backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9', borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.icon} />
            <TextInput style={[styles.input, { color: theme.textMuted }]} value={user?.email || ''} editable={false} />
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Số Điện Thoại *</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="call-outline" size={20} color={theme.textMuted} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="0901234567"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.textWhite} />
            ) : (
              <Text style={styles.saveBtnText}>Lưu Thay Đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Avatar Selection Options Modal */}
      <Modal visible={showAvatarModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Đổi Ảnh Đại Diện 📸</Text>

            {/* Pick From Gallery Button */}
            <TouchableOpacity style={styles.galleryPickBtn} onPress={handlePickFromGallery}>
              <Ionicons name="images" size={22} color={COLORS.textWhite} style={{ marginRight: 8 }} />
              <Text style={styles.galleryPickText}>Chọn Ảnh Từ Kho Thư Viện Điện Thoại</Text>
            </TouchableOpacity>

            <Text style={[styles.orText, { color: theme.textMuted }]}>HOẶC CHỌN TỪ BỘ AVATAR CÓ SẴN</Text>

            <View style={styles.presetGrid}>
              {PRESET_AVATARS.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setAvatar(url);
                    setShowAvatarModal(false);
                  }}
                  style={[styles.presetItem, avatar === url && styles.selectedPreset]}
                >
                  <Image source={{ uri: url }} style={styles.presetImage} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowAvatarModal(false)}>
              <Text style={styles.closeModalText}>Đóng</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  container: {
    padding: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  changeAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: SPACING.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  disabledInput: {
    opacity: 0.8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveBtnText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  galleryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    width: '100%',
    justifyContent: 'center',
  },
  galleryPickText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
  },
  orText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  presetItem: {
    padding: 3,
    borderRadius: 35,
    margin: 6,
  },
  selectedPreset: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  presetImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  closeModalBtn: {
    backgroundColor: '#94a3b8',
    paddingVertical: 10,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
  },
  closeModalText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
});

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { ThemeContext } from '../context/ThemeContext';
import { submitContact } from '../services/api';

export default function ContactScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !email || !message) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ họ tên, email và lời nhắn');
      return;
    }
    try {
      setIsLoading(true);
      await submitContact({ name: fullName, email, phone, subject, message });
      setIsSuccess(true);
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi liên hệ');
    } finally {
      setIsLoading(false);
    }
  };

  const openCall = () => {
    Linking.openURL('tel:19001234');
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@2thotel.vn');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.cardBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liên Hệ Hỗ Trợ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contact Info Cards */}
        <View style={styles.infoCardsContainer}>
          <TouchableOpacity style={styles.infoCard} onPress={openCall}>
            <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.infoCardTitle}>Hotline</Text>
            <Text style={styles.infoCardText}>1900 1234</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.infoCard} onPress={openEmail}>
            <View style={[styles.iconBox, { backgroundColor: '#fce7f3' }]}>
              <Ionicons name="mail" size={20} color="#be185d" />
            </View>
            <Text style={styles.infoCardTitle}>Email</Text>
            <Text style={styles.infoCardText}>support@2thotel.vn</Text>
          </TouchableOpacity>
          
          <View style={styles.infoCard}>
            <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="location" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.infoCardTitle}>Địa chỉ</Text>
            <Text style={styles.infoCardText}>123 Nguyễn Huệ, TP.HCM</Text>
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Gửi lời nhắn cho chúng tôi</Text>

          {isSuccess ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
              <Text style={styles.successTitle}>Gửi thành công!</Text>
              <Text style={styles.successText}>Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.</Text>
              <TouchableOpacity 
                style={styles.newFormBtn}
                onPress={() => {
                  setIsSuccess(false);
                  setFullName('');
                  setEmail('');
                  setPhone('');
                  setSubject('');
                  setMessage('');
                }}
              >
                <Text style={styles.newFormBtnText}>Gửi tin nhắn khác</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Họ và tên *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={COLORS.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  placeholder="090 123 4567"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Chủ đề</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vấn đề cần hỗ trợ"
                  placeholderTextColor={COLORS.textMuted}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lời nhắn *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Nhập nội dung chi tiết..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleSubmit} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.textWhite} />
                ) : (
                  <Text style={styles.submitBtnText}>Gửi Liên Hệ</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* AI Chatbot Banner */}
        <TouchableOpacity 
          style={styles.aiBanner}
          onPress={() => navigation.navigate('Chatbot')}
        >
          <View style={styles.aiBannerIcon}>
            <Ionicons name="sparkles" size={24} color={COLORS.textWhite} />
          </View>
          <View style={styles.aiBannerContent}>
            <Text style={styles.aiBannerTitle}>Hỏi đáp nhanh với AI Chatbot</Text>
            <Text style={styles.aiBannerDesc}>Trợ lý ảo 24/7 giải đáp mọi thắc mắc</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textWhite} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoCardText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 100,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  submitBtnText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: 'bold',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  successText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  newFormBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  newFormBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
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
  aiBannerContent: {
    flex: 1,
  },
  aiBannerTitle: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  aiBannerDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});

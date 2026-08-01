import React, { useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../theme/theme';
import { ThemeContext } from '../context/ThemeContext';

export default function ArticleDetailScreen({ route, navigation }) {
  const { article } = route.params || {};
  const { theme } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageBox}>
          <Image source={{ uri: article?.image || article?.coverImage }} style={styles.image} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{article?.date} • Cẩm Nang Du Lịch</Text>
            <View style={styles.viewsBadge}>
              <Ionicons name="eye-outline" size={14} color={COLORS.textWhite} />
              <Text style={styles.viewsBadgeText}>{article?.views || 0} lượt xem</Text>
            </View>
          </View>
          
          <Text style={styles.title}>{article?.title}</Text>
          <Text style={styles.summary}>{article?.summary}</Text>

          {article?.couponCode && (
            <View style={styles.couponBox}>
              <Ionicons name="ticket-outline" size={24} color={COLORS.primary} />
              <View style={styles.couponContent}>
                <Text style={styles.couponTitle}>Mã Khuyến Mãi Đặc Biệt!</Text>
                <Text style={styles.couponCode}>{article.couponCode}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.bodyText}>{article?.content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  imageBox: {
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    top: 45,
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -RADIUS.xl,
    padding: SPACING.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  viewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  viewsBadgeText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 28,
    marginBottom: SPACING.sm,
  },
  summary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 22,
  },
  couponBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd', // Light blue background for emphasis
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  couponContent: {
    marginLeft: SPACING.md,
  },
  couponTitle: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  couponCode: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  bodyText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
});

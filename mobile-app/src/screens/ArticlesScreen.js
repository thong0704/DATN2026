import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { fetchArticles } from '../services/api';

export default function ArticlesScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await fetchArticles();
      setArticles(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cẩm Nang & Mẹo Du Lịch 📖</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          articles.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate('ArticleDetail', { article: item })}
              activeOpacity={0.9}
            >
              <Image source={{ uri: item.image || item.coverImage }} style={styles.image} />
              <View style={styles.content}>
                <View style={styles.metaRow}>
                  <Text style={styles.date}>{item.date}</Text>
                  <View style={styles.viewsContainer}>
                    <Ionicons name="eye-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.viewsText}>{item.views || 0}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.summary} numberOfLines={2}>
                  {item.summary}
                </Text>
              </View>
            </TouchableOpacity>
          ))
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  container: {
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  summary: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

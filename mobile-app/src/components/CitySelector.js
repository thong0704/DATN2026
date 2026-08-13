import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { SERVER_BASE_URL, normalizeMediaUrl } from '../services/api';

const DESTINATIONS = [
  {
    id: 'hanoi',
    name: 'Hà Nội',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
    subtitle: 'Tìm khách sạn →',
  },
  {
    id: 'danang',
    name: 'Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
    subtitle: 'Tìm khách sạn →',
  },
  {
    id: 'nhatrang',
    name: 'Nha Trang',
    image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&q=80',
    subtitle: 'Tìm khách sạn →',
  },
  {
    id: 'dalat',
    name: 'Đà Lạt',
    image: 'https://images.unsplash.com/photo-1555217851-6141535bd771?w=600&q=80',
    subtitle: 'Tìm khách sạn →',
  },
];

export default function CitySelector({ destinations, selectedCity, onSelectCity }) {
  const displayDestinations = Array.isArray(destinations) && destinations.length > 0
    ? destinations.slice(0, 4).map((d, idx) => ({
        id: d._id || `dest_${idx}`,
        name: d.title,
        image: d.image,
        subtitle: 'Tìm khách sạn →',
      }))
    : DESTINATIONS;

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>KHÁM PHÁ</Text>
        </View>
        <Text style={styles.title}>Điểm đến thịnh hành</Text>
        <Text style={styles.subtitle}>Tìm kiếm nguồn cảm hứng nghỉ dưỡng tiếp theo của bạn</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {displayDestinations.map((item) => {
          const isSelected = selectedCity === item.name;
          const imageUrl = normalizeMediaUrl(item.image) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isSelected && styles.selectedCard]}
              onPress={() => onSelectCity(isSelected ? '' : item.name)}
              activeOpacity={0.85}
            >
              <ImageBackground source={{ uri: imageUrl }} style={styles.cardBg} imageStyle={styles.cardBgImage}>
                <View style={styles.overlay} />
                <View style={styles.cardContent}>
                  <Text style={styles.khamPhaSmall}>KHÁM PHÁ</Text>
                  <Text style={styles.cityName}>{item.name}</Text>
                  <Text style={styles.actionText}>{item.subtitle}</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  badgeRow: {
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d97706',
    letterSpacing: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },
  card: {
    width: 220,
    height: 240,
    marginRight: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.medium,
  },
  selectedCard: {
    borderColor: COLORS.primary,
  },
  cardBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardBgImage: {
    borderRadius: RADIUS.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: RADIUS.xl,
  },
  cardContent: {
    padding: SPACING.md,
    zIndex: 10,
  },
  khamPhaSmall: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#f59e0b',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  cityName: {
    color: COLORS.textWhite,
    fontSize: 20,
    fontWeight: '800',
  },
  actionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

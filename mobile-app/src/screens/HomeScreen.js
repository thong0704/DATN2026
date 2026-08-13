import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { ThemeContext } from '../context/ThemeContext';
import { CATEGORIES } from '../data/mockData';
import { fetchHotels, fetchBanners, SERVER_BASE_URL } from '../services/api';
import HotelCard from '../components/HotelCard';
import CategoryFilter from '../components/CategoryFilter';
import CitySelector from '../components/CitySelector';

export default function HomeScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hotels, setHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fallbackSlides = [
    {
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=80',
      title: 'Nơi những kỳ nghỉ trở thành kỷ niệm',
      subtitle: 'Đắm mình trong không gian thiết kế độc bản và dịch vụ may đo tinh tế của chuỗi khách sạn 2T Hotel.',
    },
    {
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80',
      title: 'Hồ bơi vô cực bên sườn đồi',
      subtitle: 'Trải nghiệm không gian xa hoa và đẳng cấp vượt trội.',
    },
    {
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80',
      title: 'Không gian nghỉ dưỡng thượng lưu',
      subtitle: 'Sự riêng tư tuyệt đối cùng dịch vụ phục vụ cá nhân hóa.',
    }
  ];

  const [slides, setSlides] = useState(fallbackSlides);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides]);

  useEffect(() => {
    loadHotelsFromApi();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHotelsFromApi();
    setRefreshing(false);
  };

  const loadHotelsFromApi = async () => {
    try {
      setLoading(true);
      const data = await fetchHotels();
      const safeData = Array.isArray(data) ? data : [];
      setHotels(safeData);

      // Tải banners từ Server để đồng bộ ảnh và text với Web
      try {
        const bannerDataList = await fetchBanners();
        const heroBanners = bannerDataList.filter((b) => b.type === 'hero');
        if (heroBanners.length > 0) {
          setSlides(heroBanners.map((b) => ({
            image: b.image,
            title: b.subtitle || '2T Hotel',
            subtitle: b.title || 'Elite Retreats',
          })));
        }

        const destBanners = bannerDataList.filter((b) => b.type === 'destination');
        if (destBanners.length > 0) {
          setDestinations(destBanners);
        } else {
          // Tạo danh sách Điểm đến thịnh hành fallback
          const cityMap = {};
          safeData.forEach((h) => {
            if (h && h.city) {
              cityMap[h.city] = (cityMap[h.city] || 0) + 1;
            }
          });

          const cityImageMap = {
            'Hà Nội': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
            'TP.HCM': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&auto=format&fit=crop&q=80',
            'Đà Nẵng': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop&q=80',
            'Nha Trang': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
            'Đà Lạt': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&auto=format&fit=crop&q=80',
            'Cần Thơ': 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80',
            'Vũng Tàu': 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&auto=format&fit=crop&q=80',
          };

          const dynDestinations = Object.keys(cityMap).map((cityName, idx) => ({
            _id: `dest_${idx}`,
            type: 'destination',
            title: cityName,
            image: cityImageMap[cityName] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
          }));

          setDestinations(dynDestinations);
        }
      } catch (err) {
        console.log('[HomeScreen] Fetch banners error:', err);
      }
    } catch (e) {
      console.log('[HomeScreen] Load hotels error:', e);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHotels = (hotels || []).filter((hotel) => {
    if (!hotel) return false;
    const hotelCity = hotel.city || '';
    const hotelName = hotel.name || '';

    if (selectedCity === 'all') {
      const matchesSearch =
        !searchQuery ||
        hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotelCity.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }

    // So sánh linh hoạt tên thành phố (vd: "TP.HCM", "HCM", "Hồ Chí Minh", "Hà Nội"...)
    const selNorm = selectedCity.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cityNorm = hotelCity.toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchesCategory =
      hotelCity.toLowerCase().includes(selectedCity.toLowerCase()) ||
      selectedCity.toLowerCase().includes(hotelCity.toLowerCase()) ||
      (selNorm.length > 0 && cityNorm.includes(selNorm)) ||
      (selNorm.includes('hcm') && (cityNorm.includes('hcm') || cityNorm.includes('hochiminh'))) ||
      (selNorm.includes('hanoi') && cityNorm.includes('hanoi'));

    const matchesSearch =
      !searchQuery ||
      hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotelCity.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Hero Header Section with Image Slideshow */}
        <ImageBackground
          source={{ uri: slides[activeSlideIndex]?.image }}
          style={styles.heroContainer}
          imageStyle={styles.heroContainerImage}
        >
          {/* Overlay to ensure text readability */}
          <View style={styles.heroOverlay} />

          <View style={styles.topRow}>
            <View>
              <Text style={styles.badgeText}>✦ Trải nghiệm nghỉ dưỡng tinh hoa</Text>
              <Text style={styles.locationText}>2T Hotel Group • Tiêu chuẩn 5★</Text>
            </View>

            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Chatbot')}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>{slides[activeSlideIndex]?.title}</Text>
          <Text style={styles.heroSubtitle}>
            {slides[activeSlideIndex]?.subtitle}
          </Text>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={COLORS.primary} style={styles.searchIcon} />
            <TextInput
              placeholder="Bạn muốn nghỉ dưỡng ở đâu?"
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </ImageBackground>

        {/* Categories / Cities */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chọn Thành Phố</Text>
        </View>
        <CategoryFilter
          categories={CATEGORIES}
          selectedCategory={selectedCity}
          onSelectCategory={setSelectedCity}
        />

        {/* Dynamic Popular Cities Synced with DB */}
        <CitySelector
          destinations={destinations}
          selectedCity={selectedCity === 'all' ? '' : selectedCity}
          onSelectCity={(city) => setSelectedCity(city || 'all')}
        />

        {/* Hotel List Section */}
        <View style={styles.hotelsSection}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>
              {selectedCity !== 'all' ? `Khách Sạn Tại ${selectedCity}` : 'Danh Sách Khách Sạn'}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.emptyText}>Đang tải danh sách khách sạn...</Text>
            </View>
          ) : filteredHotels.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Không tìm thấy khách sạn phù hợp</Text>
            </View>
          ) : (
            filteredHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onPress={() => navigation.navigate('HotelDetail', { hotelId: hotel.id })}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating AI Assistant Chatbot Button */}
      <TouchableOpacity
        style={styles.floatingAiBtn}
        onPress={() => navigation.navigate('Chatbot')}
        activeOpacity={0.85}
      >
        <Ionicons name="sparkles" size={20} color={COLORS.textWhite} />
        <Text style={styles.floatingAiText}>Hỏi AI Assistant 🤖</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // overridden by inline theme
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  heroContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  heroContainerImage: {
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  locationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textWhite,
    marginBottom: 4,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    ...SHADOWS.medium,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sectionHeader: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  seeAllText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  hotelsSection: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    marginTop: SPACING.sm,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  floatingAiBtn: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    ...SHADOWS.large,
    elevation: 8,
  },
  floatingAiText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
});

import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../theme/theme';
import { fetchHotels } from '../services/api';
import HotelCard from '../components/HotelCard';

const SORT_OPTIONS = [
  { label: 'Đánh giá cao', value: '-avgRating' },
  { label: 'Giá thấp', value: 'basePrice' },
  { label: 'Giá cao', value: '-basePrice' },
  { label: 'Nhiều sao', value: '-stars' },
];

export default function ExploreScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedSort, setSelectedSort] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    loadHotels();
  }, [selectedSort]);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const data = await fetchHotels({ sort: selectedSort });
      setHotels(data);
    } catch (e) {
      console.log('[ExploreScreen] Fetch hotels error:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    // Note: if you want to apply date filters to fetchHotels, you'd do it here and trigger reload.
    // For now we just close the modal.
    loadHotels();
  };

  const filteredHotels = hotels.filter((hotel) => {
    const matchesSearch =
      hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      hotel.city.toLowerCase().includes(search.toLowerCase());
    const matchesRating = selectedRating === 0 || hotel.rating >= selectedRating;

    return matchesSearch && matchesRating;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Danh Sách Khách Sạn</Text>
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <Ionicons name="options-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm địa điểm, tên khách sạn..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
          {SORT_OPTIONS.map((sortOption) => (
            <TouchableOpacity
              key={sortOption.value}
              style={[styles.sortChip, selectedSort === sortOption.value && styles.activeSortChip]}
              onPress={() => setSelectedSort(selectedSort === sortOption.value ? null : sortOption.value)}
            >
              <Text style={[styles.sortChipText, selectedSort === sortOption.value && styles.activeSortChipText]}>
                {sortOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Rating Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedRating === 0 && styles.activeChip]}
            onPress={() => setSelectedRating(0)}
          >
            <Text style={[styles.chipText, selectedRating === 0 && styles.activeChipText]}>Tất cả hạng sao</Text>
          </TouchableOpacity>

          {[5, 4.8, 4.5].map((stars) => (
            <TouchableOpacity
              key={stars}
              style={[styles.filterChip, selectedRating === stars && styles.activeChip]}
              onPress={() => setSelectedRating(selectedRating === stars ? 0 : stars)}
            >
              <Ionicons name="star" size={14} color={selectedRating === stars ? COLORS.textWhite : COLORS.accent} />
              <Text style={[styles.chipText, selectedRating === stars && styles.activeChipText]}>
                {stars}★ trở lên
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsCount}>Tìm thấy {filteredHotels.length} khách sạn phù hợp</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          filteredHotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              onPress={() => navigation.navigate('HotelDetail', { hotelId: hotel.id })}
            />
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Bộ Lọc Tìm Kiếm</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Ngày Nhận Phòng (DD/MM/YYYY)</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Ví dụ: 01/08/2026"
              value={checkIn}
              onChangeText={setCheckIn}
            />

            <Text style={styles.filterLabel}>Ngày Trả Phòng (DD/MM/YYYY)</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Ví dụ: 05/08/2026"
              value={checkOut}
              onChangeText={setCheckOut}
            />

            <View style={styles.counterRow}>
              <Text style={styles.filterLabel}>Người lớn</Text>
              <View style={styles.counter}>
                <TouchableOpacity onPress={() => setAdults(Math.max(1, adults - 1))}>
                  <Ionicons name="remove-circle-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{adults}</Text>
                <TouchableOpacity onPress={() => setAdults(adults + 1)}>
                  <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.counterRow}>
              <Text style={styles.filterLabel}>Trẻ em</Text>
              <View style={styles.counter}>
                <TouchableOpacity onPress={() => setChildren(Math.max(0, children - 1))}>
                  <Ionicons name="remove-circle-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{children}</Text>
                <TouchableOpacity onPress={() => setChildren(children + 1)}>
                  <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Áp Dụng</Text>
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
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sortScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  activeSortChip: {
    backgroundColor: '#dbeafe',
  },
  sortChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  activeSortChipText: {
    color: COLORS.primary,
  },
  filterScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  activeChipText: {
    color: COLORS.textWhite,
  },
  listContainer: {
    padding: SPACING.md,
  },
  resultsCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  filterCard: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 10,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

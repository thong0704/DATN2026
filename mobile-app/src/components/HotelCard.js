import React, { useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { toggleWishlist as toggleWishlistApi } from '../services/api';

export default function HotelCard({ hotel, onPress }) {
  const { user, token, toggleWishlist } = useContext(AuthContext);

  const isFavorite = user?.wishlist?.includes(hotel.id) || false;

  const handleToggleWishlist = async () => {
    if (!user) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng tính năng này.');
      return;
    }
    // Cập nhật UI nhanh (Optimistic Update)
    toggleWishlist(hotel.id);
    try {
      await toggleWishlistApi(token, hotel.id);
    } catch (error) {
      // Hoàn tác nếu lỗi
      toggleWishlist(hotel.id);
      Alert.alert('Lỗi', 'Không thể cập nhật danh sách yêu thích');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Hotel Image with Badge & Favorite */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: hotel.image }} style={styles.image} resizeMode="cover" />
        
        <View style={styles.topBadges}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color={COLORS.accent} />
            <Text style={styles.ratingText}>{hotel.rating}</Text>
            <Text style={styles.reviewCount}>({hotel.reviewsCount})</Text>
          </View>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleWishlist}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? COLORS.danger : COLORS.textWhite}
            />
          </TouchableOpacity>
        </View>

        {hotel.originalPrice && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>ƯU ĐÃI KHỦNG</Text>
          </View>
        )}
      </View>

      {/* Hotel Details */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {hotel.name}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={15} color={COLORS.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {hotel.city} • {hotel.address}
          </Text>
        </View>

        {/* Pricing Row */}
        <View style={styles.priceRow}>
          <View>
            {hotel.originalPrice && (
              <Text style={styles.originalPrice}>{formatCurrency(hotel.originalPrice)}</Text>
            )}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatCurrency(hotel.pricePerNight)}</Text>
              <Text style={styles.perNight}> / đêm</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.bookBtn} onPress={onPress}>
            <Text style={styles.bookBtnText}>Xem chi tiết</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textWhite} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBadges: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  ratingText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
  },
  reviewCount: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  discountText: {
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: SPACING.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  perNight: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
});

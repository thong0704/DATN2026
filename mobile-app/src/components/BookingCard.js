import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';

export default function BookingCard({ booking, onViewDetails }) {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed':
        return { bg: '#dcfce7', text: '#15803d', label: 'Đã xác nhận' };
      case 'Completed':
        return { bg: '#e0f2fe', text: '#0369a1', label: 'Đã hoàn thành' };
      case 'Pending':
        return { bg: '#fef3c7', text: '#b45309', label: 'Chờ xác nhận' };
      default:
        return { bg: '#fee2e2', text: '#b91c1c', label: 'Đã hủy' };
    }
  };

  const statusInfo = getStatusStyle(booking.status);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <View style={styles.card}>
      {/* Header Info */}
      <View style={styles.cardHeader}>
        <Text style={styles.bookingId}>{booking.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
        </View>
      </View>

      {/* Main Body */}
      <View style={styles.cardBody}>
        <Image source={{ uri: booking.image }} style={styles.image} />
        <View style={styles.infoContainer}>
          <Text style={styles.hotelName} numberOfLines={1}>
            {booking.hotelName}
          </Text>
          <Text style={styles.roomName} numberOfLines={1}>
            {booking.roomName}
          </Text>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {booking.checkIn} → {booking.checkOut}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer & Actions */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalPrice}>{formatCurrency(booking.totalPrice)}</Text>
        </View>

        <TouchableOpacity style={styles.detailBtn} onPress={() => onViewDetails(booking)}>
          <Text style={styles.detailBtnText}>Mã vé / Đơn</Text>
          <Ionicons name="qr-code-outline" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bookingId: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.md,
    marginRight: SPACING.md,
  },
  infoContainer: {
    flex: 1,
  },
  hotelName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  roomName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: '#e0e7ff',
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
});

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { fetchMyBookings, cancelBooking, createReview } from '../services/api';
import { useIsFocused } from '@react-navigation/native';
import BookingCard from '../components/BookingCard';

const FILTER_STATUSES = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Đã nhận phòng', value: 'checked_in' },
  { label: 'Đã trả phòng', value: 'checked_out' },
  { label: 'Đã hủy', value: 'cancelled' },
];

export default function MyBookingsScreen() {
  const { token } = useContext(AuthContext);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancel Booking State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Review State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadBookings();
    }
  }, [isFocused, token]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await fetchMyBookings(token);
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('[MyBookingsScreen] Error:', e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const currentList = bookings.filter((b) => {
    if (filterStatus === 'all') return true;
    return b.rawStatus === filterStatus;
  });

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do hủy phòng');
      return;
    }
    try {
      setIsCancelling(true);
      await cancelBooking(token, selectedTicket._id, cancelReason);
      Alert.alert('Thành công', 'Hủy phòng thành công');
      setShowCancelModal(false);
      setSelectedTicket(null);
      loadBookings();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hủy phòng lúc này');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề và nhận xét');
      return;
    }
    try {
      setIsSubmittingReview(true);
      await createReview(token, {
        hotel: selectedTicket.hotel._id,
        booking: selectedTicket._id,
        rating,
        title: reviewTitle,
        comment: reviewComment,
      });
      Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá');
      setShowReviewModal(false);
      setSelectedTicket(null);
      loadBookings();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá lúc này');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Sử Đặt Phòng</Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.md }}>
          {FILTER_STATUSES.map((status) => (
            <TouchableOpacity
              key={status.value}
              style={[styles.filterPill, filterStatus === status.value && styles.activeFilterPill]}
              onPress={() => setFilterStatus(status.value)}
            >
              <Text style={[styles.filterPillText, filterStatus === status.value && styles.activeFilterPillText]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Booking List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.emptyText}>Đang tải lịch sử đơn hàng từ CSDL...</Text>
          </View>
        ) : currentList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Chưa có thông tin đơn đặt phòng nào</Text>
          </View>
        ) : (
          currentList.map((item) => (
            <BookingCard
              key={item.id || item._id}
              booking={item}
              onViewDetails={(booking) => setSelectedTicket(booking)}
            />
          ))
        )}
      </ScrollView>

      {/* Ticket Voucher Modal */}
      <Modal visible={!!selectedTicket && !showCancelModal && !showReviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.ticketCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTicket(null)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.ticketHeader}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.success} />
              <Text style={styles.ticketHotel}>{selectedTicket?.hotel?.name || selectedTicket?.hotelName}</Text>
              <Text style={styles.ticketRoom}>{selectedTicket?.room?.name || selectedTicket?.roomName}</Text>
            </View>

            <View style={styles.dashLine} />

            <View style={styles.ticketBody}>
              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Mã Đơn</Text>
                <Text style={styles.ticketVal}>{selectedTicket?._id || selectedTicket?.id}</Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Ngày Nhận Phòng</Text>
                <Text style={styles.ticketVal}>{selectedTicket?.checkIn}</Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Ngày Trả Phòng</Text>
                <Text style={styles.ticketVal}>{selectedTicket?.checkOut}</Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Trạng Thái</Text>
                <Text style={[styles.ticketVal, { color: COLORS.success }]}>{selectedTicket?.status}</Text>
              </View>

              {(selectedTicket?.rawStatus === 'pending' || selectedTicket?.rawStatus === 'confirmed') && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCancelModal(true)}>
                  <Text style={styles.cancelBtnText}>Hủy Đặt Phòng</Text>
                </TouchableOpacity>
              )}

              {selectedTicket?.rawStatus === 'checked_out' && (
                <TouchableOpacity style={styles.reviewBtn} onPress={() => setShowReviewModal(true)}>
                  <Text style={styles.reviewBtnText}>Đánh Giá</Text>
                </TouchableOpacity>
              )}

              <View style={styles.qrContainer}>
                <Ionicons name="qr-code-sharp" size={140} color={COLORS.textPrimary} />
                <Text style={styles.qrHint}>Đưa mã QR này cho lễ tân khi làm thủ tục nhận phòng</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Hủy Đặt Phòng</Text>
            <Text style={styles.actionSubtitle}>Vui lòng cho biết lý do bạn muốn hủy đơn đặt phòng này.</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Lý do hủy..."
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={styles.actionBtnRow}>
              <TouchableOpacity style={styles.actionBtnCancel} onPress={() => setShowCancelModal(false)}>
                <Text style={styles.actionBtnCancelText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnConfirm} onPress={handleCancelBooking} disabled={isCancelling}>
                {isCancelling ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnConfirmText}>Xác nhận hủy</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Đánh Giá Khách Sạn</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons name={star <= rating ? "star" : "star-outline"} size={32} color={COLORS.accent} />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.textInputSingle}
              placeholder="Tiêu đề..."
              value={reviewTitle}
              onChangeText={setReviewTitle}
            />
            
            <TextInput
              style={styles.textInput}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
            />
            
            <View style={styles.actionBtnRow}>
              <TouchableOpacity style={styles.actionBtnCancel} onPress={() => setShowReviewModal(false)}>
                <Text style={styles.actionBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnConfirm} onPress={handleSubmitReview} disabled={isSubmittingReview}>
                {isSubmittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnConfirmText}>Gửi Đánh Giá</Text>}
              </TouchableOpacity>
            </View>
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  filterContainer: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeFilterPillText: {
    color: COLORS.textWhite,
  },
  listContainer: {
    padding: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  ticketCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    position: 'relative',
    ...SHADOWS.large,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  ticketHeader: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  ticketHotel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 6,
  },
  ticketRoom: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  dashLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  ticketBody: {
    width: '100%',
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  ticketVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
  },
  qrHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  cancelBtn: {
    marginTop: SPACING.md,
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  reviewBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  reviewBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  actionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  textInputSingle: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actionBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnCancelText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  actionBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    alignItems: 'center',
  },
  actionBtnConfirmText: {
    color: COLORS.textWhite,
    fontWeight: '600',
  },
});

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
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { createBookingApi, confirmPaymentApi, checkPaymentStatusApi, validateCoupon, cancelBooking } from '../services/api';

export default function BookingScreen({ route, navigation }) {
  const { hotel, room, checkIn: routeCheckIn, checkOut: routeCheckOut } = route.params || {};
  const { user, token } = useContext(AuthContext);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [identityCard, setIdentityCard] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  const [guestsCount, setGuestsCount] = useState(2);
  const [nights, setNights] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, momo, vnpay, cash
  const [loading, setLoading] = useState(false);

  // States cho Mã Giảm Giá
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // States cho Form Thẻ Ngân Hàng
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(fullName.toUpperCase());
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // States cho Link Thanh Toán Thật MoMo / VNPay
  const [realPaymentUrl, setRealPaymentUrl] = useState('');
  const [realIntentId, setRealIntentId] = useState('');

  // Modal Thành công
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.name || '');
      setEmail((prev) => prev || user.email || '');
      setPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  // Cập nhật cardHolder khi fullName thay đổi
  useEffect(() => {
    if (fullName) {
      setCardHolder(fullName.toUpperCase());
    }
  }, [fullName]);

  const roomPrice = room?.price || 780000;
  const subtotal = roomPrice * nights;
  const taxAndFee = Math.round(subtotal * 0.08);
  const totalPrice = subtotal + taxAndFee - discountAmount;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await validateCoupon(token, couponCode, hotel?.id);
      if (res && res.discount) {
        setDiscountAmount(res.discount);
      }
    } catch (error) {
      setCouponError(error.message || 'Mã giảm giá không hợp lệ');
      setDiscountAmount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleOpenPaymentModal = async () => {
    console.log('[BookingScreen] handleOpenPaymentModal - user:', user);
    const missing = [];
    if (!fullName) missing.push('Họ và Tên');
    if (!phone) missing.push('Số điện thoại');

    if (missing.length > 0) {
      Alert.alert(
        'Thông báo', 
        `Vui lòng điền đầy đủ thông tin người đặt. (Thiếu: ${missing.join(', ')})`
      );
      return;
    }

    const today = new Date();
    const checkInDate = routeCheckIn || new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0];
    
    // Tính toán ngày checkOut động dựa trên số đêm thực tế khách chọn
    const inDateObj = new Date(checkInDate);
    inDateObj.setDate(inDateObj.getDate() + nights);
    const checkOutDate = inDateObj.toISOString().split('T')[0];

    const payload = {
      roomId: room?.id || '6a6b14284e9e11c392408056',
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: { adults: guestsCount, children: 0 },
      guestInfo: {
        name: fullName,
        email: user?.email || 'customer@hotel.dev',
        phone: phone,
        identityCard: identityCard,
      },
      specialRequests: specialRequests,
      paymentMethod,
      couponCode: discountAmount > 0 ? couponCode : undefined,
    };

    try {
      setLoading(true);
      const res = await createBookingApi(payload, token);
      setBookingResult(res);

      if (res.paymentData?.paymentUrl) {
        setRealPaymentUrl(res.paymentData.paymentUrl);
        try {
          await Linking.openURL(res.paymentData.paymentUrl);
        } catch (err) {
          console.log('Không thể tự động mở link:', err.message);
        }
      }
      if (res.paymentData?.intentId) {
        setRealIntentId(res.paymentData.intentId);
      }

      setShowPaymentModal(true);
    } catch (err) {
      Alert.alert('Lỗi đặt phòng', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRealPaymentGateway = async () => {
    if (realPaymentUrl) {
      try {
        await Linking.openURL(realPaymentUrl);
      } catch (err) {
        Alert.alert('Cổng thanh toán', 'Không thể mở liên kết thanh toán MoMo/VNPay.');
      }
    }
  };

  // Hàm Hủy giao dịch thanh toán và Hủy đơn hàng trong CSDL
  const handleCancelPayment = async () => {
    setShowPaymentModal(false);
    if (bookingResult?.data?._id) {
      try {
        setLoading(true);
        // Gọi API Hủy đơn hàng với lý do Hủy thanh toán
        await cancelBooking(token, bookingResult.data._id, 'Người dùng hủy thanh toán');
        Alert.alert('Giao dịch đã hủy ❌', 'Đơn đặt phòng của bạn đã được hủy thành công.');
      } catch (err) {
        console.log('Error canceling booking:', err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // KIỂM TRA BẢO MẬT: Bắt buộc giao dịch thành công trong CSDL MongoDB mới cho hoàn tất
  const handleProcessPaymentAndBooking = async () => {
    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      const validStripeTestCards = [
        '4242424242424242',
        '4000002760003184',
        '5555555555554444',
        '378282246310005',
        '371234567890123'
      ];

      if (!validStripeTestCards.includes(cleanNum)) {
        Alert.alert(
          'Thanh toán thất bại ❌',
          'Thẻ không hợp lệ. Vui lòng nhập thẻ thử nghiệm Stripe chính xác (Ví dụ: 4242 4242 4242 4242).'
        );
        return;
      }

      if (!cardHolder || cardHolder.trim().length < 3) {
        Alert.alert('Thanh toán thất bại ❌', 'Vui lòng nhập Họ Tên chủ thẻ ngân hàng.');
        return;
      }

      if (!cardExpiry || !cardExpiry.includes('/') || cardExpiry.length < 5) {
        Alert.alert(
          'Thanh toán thất bại ❌',
          'Vui lòng nhập Hạn sử dụng thẻ theo định dạng MM/YY (ví dụ: 12/28).'
        );
        return;
      }

      // Kiểm tra hạn sử dụng thẻ có nằm ở tương lai không
      const parts = cardExpiry.split('/');
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);
      const now = new Date();
      const currentYearShort = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < currentYearShort || (year === currentYearShort && month < currentMonth)) {
        Alert.alert('Thanh toán thất bại ❌', 'Thẻ đã hết hạn sử dụng hoặc định dạng MM/YY không hợp lệ.');
        return;
      }

      if (!cardCvc || cardCvc.length < 3 || isNaN(cardCvc)) {
        Alert.alert('Thanh toán thất bại ❌', 'Vui lòng nhập đúng 3 chữ số mã bảo mật CVV/CVC.');
        return;
      }
    }

    try {
      setLoading(true);

      // Đối với MoMo/VNPay: Kiểm tra giao dịch đã được cập nhật thành công trong CSDL (qua callback/return URL ở Ảnh 1)
      if (bookingResult?.data?._id && (paymentMethod === 'momo' || paymentMethod === 'vnpay')) {
        const paymentObj = await checkPaymentStatusApi(bookingResult.data._id, token);
        if (!paymentObj || paymentObj.status !== 'succeeded') {
          Alert.alert(
            'Thanh toán chưa hoàn tất ❌',
            'Hệ thống chưa ghi nhận giao dịch thành công. Vui lòng thanh toán trên trình duyệt trước khi bấm xác nhận!'
          );
          setLoading(false);
          return;
        }
      }

      // Đối với Thẻ quốc tế: tiến hành gọi confirm lên server để hoàn tất thanh toán
      if (realIntentId && paymentMethod === 'card') {
        try {
          await confirmPaymentApi(realIntentId, token);
        } catch (e) {
          console.log('[Card] Confirm error:', e.message);
        }
      }

      setShowPaymentModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert('Lỗi thanh toán', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Nút hỗ trợ nhà phát triển giả lập thanh toán thành công trong sandbox
  const handleSimulateSandboxSuccess = async () => {
    try {
      setLoading(true);
      if (realIntentId) {
        await confirmPaymentApi(realIntentId, token);
      }
      setShowPaymentModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert('Giả lập thất bại', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác Nhận & Thanh Toán Đặt Phòng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hotel & Room Summary Card */}
        <View style={styles.card}>
          <Text style={styles.hotelTitle}>{hotel?.name}</Text>
          <Text style={styles.roomSubtitle}>{room?.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{hotel?.city || hotel?.address}</Text>
          </View>
        </View>

        {/* Stay Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông Tin Lưu Trú</Text>

          <View style={styles.counterRow}>
            <Text style={styles.label}>Số đêm nghỉ:</Text>
            <View style={styles.counterControl}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setNights(Math.max(1, nights - 1))}
              >
                <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{nights} đêm</Text>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setNights(nights + 1)}>
                <Ionicons name="add" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.counterRow}>
            <Text style={styles.label}>Số khách:</Text>
            <View style={styles.counterControl}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setGuestsCount(Math.max(1, guestsCount - 1))}
              >
                <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{guestsCount} người</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setGuestsCount(guestsCount + 1)}
              >
                <Ionicons name="add" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Customer Details Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông Tin Khách Hàng</Text>

          <Text style={styles.inputLabel}>Họ và Tên *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ tên"
          />



          <Text style={styles.inputLabel}>Số điện thoại liên hệ *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="0901234567"
          />

          <Text style={styles.inputLabel}>CMND/CCCD (Tùy chọn)</Text>
          <TextInput
            style={styles.input}
            value={identityCard}
            onChangeText={setIdentityCard}
            keyboardType="number-pad"
            placeholder="Nhập số CMND/CCCD"
          />

          <Text style={styles.inputLabel}>Yêu cầu đặc biệt</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            placeholder="Ghi chú thêm cho khách sạn..."
          />
        </View>

        {/* Coupon Code Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mã Giảm Giá</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="Nhập mã giảm giá"
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={styles.couponBtn} 
              onPress={handleApplyCoupon}
              disabled={isApplyingCoupon || !couponCode}
            >
              {isApplyingCoupon ? (
                <ActivityIndicator color={COLORS.textWhite} size="small" />
              ) : (
                <Text style={styles.couponBtnText}>Áp dụng</Text>
              )}
            </TouchableOpacity>
          </View>
          {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
          {discountAmount > 0 ? (
            <Text style={styles.couponSuccessText}>
              Đã giảm {formatCurrency(discountAmount)}
            </Text>
          ) : null}
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chọn Phương Thức Thanh Toán</Text>

          {[
            { id: 'card', name: 'Thẻ Quốc Tế Visa / Mastercard', icon: 'card-outline' },
            { id: 'momo', name: 'Ví Điện Tử MoMo', icon: 'qr-code-outline' },
            { id: 'vnpay', name: 'Cổng Thanh Toán VNPay', icon: 'globe-outline' },
            { id: 'cash', name: 'Thanh toán tiền mặt tại Lễ Tân', icon: 'cash-outline' },
          ].map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.payOption, isSelected && styles.selectedPayOption]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Ionicons
                  name={method.icon}
                  size={20}
                  color={isSelected ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={[styles.payOptionText, isSelected && styles.selectedPayText]}>
                  {method.name}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Order Price Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chi Tiết Giá</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Phòng ({nights} đêm x {formatCurrency(roomPrice)})
            </Text>
            <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Thuế VAT & Phí dịch vụ (8%)</Text>
            <Text style={styles.priceValue}>{formatCurrency(taxAndFee)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giảm giá</Text>
              <Text style={[styles.priceValue, { color: COLORS.danger }]}>-{formatCurrency(discountAmount)}</Text>
            </View>
          )}

          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Tổng cộng thanh toán</Text>
            <Text style={styles.totalPriceValue}>{formatCurrency(totalPrice)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>Tổng thanh toán</Text>
          <Text style={styles.bottomTotalPrice}>{formatCurrency(totalPrice)}</Text>
        </View>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleOpenPaymentModal}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textWhite} />
          ) : (
            <Text style={styles.confirmBtnText}>Tiến Hành Thanh Toán</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Cổng Thanh Toán MoMo / VNPay / Card Thật */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {paymentMethod === 'card'
                ? 'Nhập Thông Tin Thẻ Ngân Hàng 💳'
                : paymentMethod === 'momo'
                ? 'Thanh Toán Qua Ví MoMo Thật 📱'
                : paymentMethod === 'vnpay'
                ? 'Thanh Toán Qua Cổng VNPay Thật 🌐'
                : 'Thanh Toán Tiền Mặt 💵'}
            </Text>

            {paymentMethod === 'card' ? (
              <View style={styles.cardPayForm}>
                <Text style={styles.inputLabel}>Tên Chủ Thẻ (Bắt buộc) *</Text>
                <TextInput
                  style={styles.input}
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  placeholder="NGUYEN VAN A"
                />

                <Text style={styles.inputLabel}>Số Thẻ 16 Chữ Số (Bắt buộc) *</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="number-pad"
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Hạn Dùng (MM/YY) *</Text>
                    <TextInput
                      style={styles.input}
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      placeholder="12/28"
                      maxLength={5}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Mã CVV / CVC *</Text>
                    <TextInput
                      style={styles.input}
                      value={cardCvc}
                      onChangeText={setCardCvc}
                      keyboardType="number-pad"
                      placeholder="123"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            ) : paymentMethod === 'momo' || paymentMethod === 'vnpay' ? (
              <View style={styles.qrPayForm}>
                <Image
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(realPaymentUrl || 'https://momo.vn')}` }}
                  style={styles.qrImage}
                />
                <Text style={styles.qrDesc}>
                  Số tiền thanh toán:{' '}
                  <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{formatCurrency(totalPrice)}</Text>
                </Text>

                {realPaymentUrl ? (
                  <TouchableOpacity style={styles.openRealUrlBtn} onPress={handleOpenRealPaymentGateway}>
                    <Ionicons name="open-outline" size={18} color={COLORS.textWhite} />
                    <Text style={styles.openRealUrlText}>Mở Cổng {paymentMethod.toUpperCase()} Trên Điện Thoại</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Developer Sandbox Simulator */}
                <TouchableOpacity style={styles.simulateSuccessBtn} onPress={handleSimulateSandboxSuccess}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#d97706" />
                  <Text style={styles.simulateSuccessText}>[Giả Lập Thanh Toán Sandbox Thành Công]</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.cashDesc}>
                Bạn chọn thanh toán tiền mặt trực tiếp tại quầy Lễ Tân khi nhận phòng. Đơn hàng sẽ được xác nhận ngay lập tức trên hệ thống!
              </Text>
            )}

            <TouchableOpacity
              style={styles.paySubmitBtn}
              onPress={handleProcessPaymentAndBooking}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.paySubmitText}>Xác Nhận Đã Thanh Toán & Hoàn Tất</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelPayBtn} onPress={handleCancelPayment} disabled={loading}>
              <Text style={styles.cancelPayText}>Hủy Bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Đặt Phòng Thành Công */}
      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
            </View>

            <Text style={styles.modalTitle}>Thanh Toán & Đặt Phòng Thành Công! 🎉</Text>
            <Text style={styles.modalSub}>
              Mã đơn hàng: <Text style={{ fontWeight: 'bold' }}>{bookingResult?.bookingId}</Text>
            </Text>
            <Text style={styles.modalDesc}>
              Đơn hàng của bạn đã được ghi nhận thành công trên hệ thống. Bạn có thể kiểm tra chi tiết tại Hóa Đơn của Tôi.
            </Text>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('MainTabs', { screen: 'Bookings' });
              }}
            >
              <Text style={styles.closeModalText}>Xem Đơn Đặt Của Tôi</Text>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  hotelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  roomSubtitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  counterControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  counterValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: COLORS.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  selectedPayOption: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff',
  },
  payOptionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  selectedPayText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.large,
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bottomTotalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  confirmBtnText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.large,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  cardPayForm: {
    width: '100%',
  },
  qrPayForm: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
    width: '100%',
  },
  qrImage: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  qrDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  openRealUrlBtn: {
    backgroundColor: '#a21caf',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.xs,
    width: '100%',
  },
  openRealUrlText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  simulateSuccessBtn: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  simulateSuccessText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
  cashDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.md,
    lineHeight: 20,
  },
  paySubmitBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  paySubmitText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelPayBtn: {
    marginTop: SPACING.sm,
    paddingVertical: 8,
  },
  cancelPayText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  successIconBox: {
    marginBottom: SPACING.md,
  },
  modalSub: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  closeModalBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  closeModalText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 15,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  couponInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  couponBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponBtnText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 14,
  },
  couponErrorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  couponSuccessText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});

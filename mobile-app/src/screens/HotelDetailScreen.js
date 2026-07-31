import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme/theme';
import { fetchHotelById, fetchRoomsByHotel, toggleWishlist as toggleWishlistApi, fetchHotelReviews, getSimilarHotels, getWishlist } from '../services/api';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function HotelDetailScreen({ route, navigation }) {
  const { hotelId } = route.params || {};

  const { user, token, toggleWishlist, setUser } = useContext(AuthContext);

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const isWishlisted = user?.wishlist?.includes(hotelId) || false;
  const [reviews, setReviews] = useState([]);
  const [similarHotels, setSimilarHotels] = useState([]);

  // Ngày nhận & trả phòng tự nhập giống hệt Web (Mặc định là ngày hôm nay và ngày mai)
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(todayObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);

  // States cho Custom Calendar Modal
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarMode, setCalendarMode] = useState('in'); // 'in' or 'out'
  const [currentYear, setCurrentYear] = useState(todayObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayObj.getMonth()); // 0-indexed

  useEffect(() => {
    loadHotelData();
  }, [hotelId, checkIn, checkOut]);

  const loadHotelData = async () => {
    try {
      setLoading(true);
      const hotelData = await fetchHotelById(hotelId);
      setHotel(hotelData);

      // Gọi endpoint /rooms/available của Express Server để lấy phòng trống theo ngày chọn
      let availableRooms = [];
      try {
        const resAvail = await api.get('/rooms/available', {
          params: { hotelId, checkIn, checkOut },
        });
        const rawRooms = resAvail.data?.data?.rooms || resAvail.data?.rooms || [];
          availableRooms = rawRooms.map((r) => ({
            id: r._id ? r._id.toString() : r.id,
            name: r.type === 'basic' ? `Phòng Tiêu Chuẩn (${r.roomNumber})` : r.type === 'standard' ? `Phòng Cao Cấp (${r.roomNumber})` : `Phòng VIP Suite (${r.roomNumber})`,
            price: r.dynamicPricing?.averagePrice || r.pricePerNight || 780000,
            originalPrice: r.pricePerNight,
            dynamicPricing: r.dynamicPricing,
            capacity: `${r.capacity?.adults || 2} người lớn`,
            size: `${r.size || 30}m²`,
            bedType: `${r.bedType || 'King'} Bed`,
            image: r.images?.[0]?.url || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
            status: r.status,
          }));
      } catch (err) {
        console.log('[HotelDetail] getAvailable fallback');
      }

      if (availableRooms.length === 0) {
        const roomData = await fetchRoomsByHotel(hotelId);
        availableRooms = roomData.filter((r) => r.status === 'available' || !r.status);
      }

      // Lọc phòng trống
      const finalAvailableRooms = availableRooms.filter(
        (r) => r.status !== 'booked' && r.status !== 'occupied' && r.status !== 'unavailable'
      );

      setRooms(finalAvailableRooms);
      setSelectedRoom(finalAvailableRooms[0] || null);
    } catch (e) {
      console.log('[HotelDetailScreen] Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      loadExtraData();
    }
  }, [hotelId]);

  const loadExtraData = async () => {
    try {
      const fetchedReviews = await fetchHotelReviews(hotelId);
      setReviews(fetchedReviews || []);
      const fetchedSimilar = await getSimilarHotels(hotelId);
      setSimilarHotels(fetchedSimilar || []);
      
      // Đồng bộ danh sách yêu thích từ CSDL thật vào AuthContext
      if (token && user) {
        const wishlist = await getWishlist(token);
        const wishlistIds = wishlist.map((h) => h.id);
        setUser({ ...user, wishlist: wishlistIds });
      }
    } catch (error) {
      console.log('Error loading extra data:', error);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng tính năng này.');
      return;
    }
    // Cập nhật UI nhanh (Optimistic Update)
    toggleWishlist(hotelId);
    try {
      await toggleWishlistApi(token, hotelId);
    } catch (error) {
      // Hoàn tác nếu lỗi
      toggleWishlist(hotelId);
      Alert.alert('Lỗi', 'Không thể cập nhật danh sách yêu thích.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // --- CALENDAR LOGIC GENERATOR ---
  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  const handleOpenCalendar = (mode) => {
    setCalendarMode(mode);
    const baseDate = new Date(mode === 'in' ? checkIn : checkOut);
    setCurrentYear(baseDate.getFullYear());
    setCurrentMonth(baseDate.getMonth());
    setShowCalendarModal(true);
  };

  const changeMonth = (direction) => {
    let nextMonth = currentMonth + direction;
    let nextYear = currentYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  const getDaysGrid = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0: CN, 1: T2...
    const grid = [];

    // Thêm các ô trống trước ngày 1 của tháng
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }

    // Thêm các ngày của tháng
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(day);
    }

    return grid;
  };

  const handleSelectDay = (day) => {
    if (!day) return;
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const selectedDateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

    if (calendarMode === 'in') {
      // Khi chọn ngày Check-in
      setCheckIn(selectedDateStr);
      // Nếu ngày Check-out nhỏ hơn hoặc bằng ngày Check-in mới, tự động dời ngày Check-out thêm 1 ngày
      const inDateObj = new Date(selectedDateStr);
      const outDateObj = new Date(checkOut);
      if (outDateObj <= inDateObj) {
        const nextDayObj = new Date(inDateObj);
        nextDayObj.setDate(inDateObj.getDate() + 1);
        setCheckOut(nextDayObj.toISOString().split('T')[0]);
      }
    } else {
      // Khi chọn ngày Check-out
      const inDateObj = new Date(checkIn);
      const outDateObj = new Date(selectedDateStr);
      if (outDateObj <= inDateObj) {
        Alert.alert('Ngày không hợp lệ', 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày.');
        return;
      }
      setCheckOut(selectedDateStr);
    }
    setShowCalendarModal(false);
  };

  const isDaySelected = (day) => {
    if (!day) return false;
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    return calendarMode === 'in' ? dateStr === checkIn : dateStr === checkOut;
  };

  const isDayInRange = (day) => {
    if (!day) return false;
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    
    const dTime = new Date(dateStr).getTime();
    const checkInTime = new Date(checkIn).getTime();
    const checkOutTime = new Date(checkOut).getTime();
    
    return dTime > checkInTime && dTime < checkOutTime;
  };

  if (loading || !hotel) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang kiểm tra phòng trống từ CSDL...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Image Header */}
        <View style={styles.imageGalleryContainer}>
          <Image
            source={{ uri: hotel.gallery[activeImageIndex] || hotel.image }}
            style={styles.mainImage}
          />
          <View style={styles.gradientOverlay} />

          {/* Navigation Controls */}
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.rightHeaderBtns}>
              <TouchableOpacity style={styles.circleBtn}>
                <Ionicons name="share-social-outline" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleBtn} onPress={handleToggleWishlist}>
                <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Thumbnails */}
          {hotel.gallery && hotel.gallery.length > 1 && (
            <ScrollView horizontal style={styles.thumbnailContainer} showsHorizontalScrollIndicator={false}>
              {hotel.gallery.map((imgUrl, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveImageIndex(idx)}
                  style={[styles.thumbnail, activeImageIndex === idx && styles.activeThumbnail]}
                >
                  <Image source={{ uri: imgUrl }} style={styles.thumbImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Hotel Main Information */}
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
          </View>

          <View style={styles.ratingLocationRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color={COLORS.accent} />
              <Text style={styles.ratingText}>{hotel.rating}</Text>
              <Text style={styles.reviewCount}>({hotel.reviewsCount} đánh giá)</Text>
            </View>

            <View style={styles.locationBadge}>
              <Ionicons name="location-outline" size={14} color={COLORS.primary} />
              <Text style={styles.locationCity}>{hotel.city}</Text>
            </View>
          </View>

          <Text style={styles.addressText}>{hotel.address}</Text>

          {/* Bộ Chọn Ngày Nhận & Trả Phòng Dạng Lịch Premium Giống Bản Web */}
          <View style={styles.divider} />
          <Text style={styles.sectionHeading}>Chọn Ngày Nhận & Trả Phòng</Text>

          <View style={styles.dateSelectorCard}>
            <TouchableOpacity style={styles.dateSelectorBox} onPress={() => handleOpenCalendar('in')}>
              <Text style={styles.dateBoxLabel}>Check-in (Nhận phòng)</Text>
              <View style={styles.dateBoxValueRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.dateBoxValue}>{checkIn}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dateArrowBox}>
              <Ionicons name="arrow-forward-outline" size={18} color={COLORS.textMuted} />
            </View>

            <TouchableOpacity style={styles.dateSelectorBox} onPress={() => handleOpenCalendar('out')}>
              <Text style={styles.dateBoxLabel}>Check-out (Trả phòng)</Text>
              <View style={styles.dateBoxValueRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.dateBoxValue}>{checkOut}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.divider} />
          <Text style={styles.sectionHeading}>Mô Tả Khách Sạn</Text>
          <Text style={styles.descriptionText}>{hotel.description}</Text>

          {/* Amenities Grid */}
          <View style={styles.divider} />
          <Text style={styles.sectionHeading}>Tiện Nghi Nổi Bật</Text>
          <View style={styles.amenitiesGrid}>
            {hotel.amenities.map((item, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.amenityText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Room Selection Section */}
          <View style={styles.divider} />
          <View style={styles.roomHeaderRow}>
            <Text style={styles.sectionHeading}>Danh Sách Phòng Trống Khả Dụng ({rooms.length})</Text>

            <View style={styles.availableBadgeTag}>
              <Ionicons name="shield-checkmark" size={12} color="#166534" />
              <Text style={styles.availableTagText}>Đã lọc theo ngày</Text>
            </View>
          </View>

          {rooms.length === 0 ? (
            <View style={styles.emptyRoomsBox}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyRoomsText}>
                Tất cả các phòng đã hết vào khoảng thời gian {checkIn} đến {checkOut}. Vui lòng nhập ngày khác!
              </Text>
            </View>
          ) : (
            rooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;

              return (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomCard, isSelected && styles.selectedRoomCard]}
                  onPress={() => setSelectedRoom(room)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: room.image }} style={styles.roomImage} />
                  <View style={styles.roomDetails}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomMeta}>
                      {room.size} • {room.capacity}
                    </Text>
                    <Text style={styles.bedType}>{room.bedType}</Text>

                    <View style={styles.roomPriceRow}>
                      <Text style={styles.roomPrice}>{formatCurrency(room.price)}</Text>
                      <Text style={styles.perNightText}> /đêm</Text>
                      {room.originalPrice && room.price !== room.originalPrice ? (
                        <Text style={styles.roomOriginalPrice}>{formatCurrency(room.originalPrice)}</Text>
                      ) : null}
                    </View>

                    {(() => {
                      const activeLabels = room.dynamicPricing?.perNight
                        ? [...new Set(room.dynamicPricing.perNight.map((d) => d.label).filter(Boolean))]
                        : [];
                      if (activeLabels.length > 0) {
                        return (
                          <View style={styles.holidayBadgeContainer}>
                            {activeLabels.map((lbl, idx) => (
                              <View key={idx} style={[
                                styles.holidayBadge,
                                lbl === 'Cuối tuần' ? styles.weekendBadge :
                                lbl === 'Mùa cao điểm' ? styles.peakBadge :
                                styles.tetBadge
                              ]}>
                                <Text style={[
                                  styles.holidayBadgeText,
                                  lbl === 'Cuối tuần' ? styles.weekendBadgeText :
                                  lbl === 'Mùa cao điểm' ? styles.peakBadgeText :
                                  styles.tetBadgeText
                                ]}>✦ {lbl}</Text>
                              </View>
                            ))}
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </View>

                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={14} color={COLORS.textWhite} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
          
          {/* Reviews Section */}
          <View style={styles.divider} />
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Đánh giá từ khách hàng</Text>
            <Text style={styles.reviewCountBadge}>{reviews.length} đánh giá</Text>
          </View>
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  {review.userAvatar ? (
                    <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
                  ) : (
                    <View style={styles.reviewAvatarFallback}>
                      <Text style={styles.reviewAvatarText}>{review.userName.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewName}>{review.userName}</Text>
                    <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</Text>
                  </View>
                  <View style={styles.reviewRatingBox}>
                    <Ionicons name="star" size={14} color={COLORS.accent} />
                    <Text style={styles.reviewRatingText}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          )}

          {/* Similar Hotels Section */}
          {similarHotels.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionHeading}>Khách sạn tương tự</Text>
              <FlatList
                horizontal
                data={similarHotels}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.similarHotelCard}
                    onPress={() => navigation.push('HotelDetail', { hotelId: item.id })}
                  >
                    <Image source={{ uri: item.image }} style={styles.similarHotelImage} />
                    <View style={styles.similarHotelInfo}>
                      <Text style={styles.similarHotelName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.similarHotelRatingRow}>
                        <Ionicons name="star" size={12} color={COLORS.accent} />
                        <Text style={styles.similarHotelRating}>{item.rating}</Text>
                      </View>
                      <Text style={styles.similarHotelPrice}>{formatCurrency(item.pricePerNight)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

        </View>
      </ScrollView>

      {/* Custom Calendar Modal */}
      <Modal visible={showCalendarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {calendarMode === 'in' ? 'Chọn ngày nhận phòng 📥' : 'Chọn ngày trả phòng 📤'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Month switch row */}
            <View style={styles.monthSwitchRow}>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                Tháng {currentMonth + 1}, {currentYear}
              </Text>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => changeMonth(1)}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Days of week */}
            <View style={styles.daysOfWeekRow}>
              {daysOfWeek.map((day) => (
                <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.daysGrid}>
              {getDaysGrid().map((day, idx) => {
                const isSelected = isDaySelected(day);
                const isInRange = isDayInRange(day);

                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={!day}
                    style={[
                      styles.dayCell,
                      isSelected && styles.selectedDayCell,
                      isInRange && styles.rangeDayCell,
                    ]}
                    onPress={() => handleSelectDay(day)}
                  >
                    {day ? (
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedDayText,
                          isInRange && styles.rangeDayText,
                        ]}
                      >
                        {day}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity
        style={styles.floatingAiBtn}
        onPress={() => navigation.navigate('Chatbot')}
        activeOpacity={0.85}
      >
        <Ionicons name="sparkles" size={20} color={COLORS.textWhite} />
        <Text style={styles.floatingAiText}>Hỏi AI Chatbot 🤖</Text>
      </TouchableOpacity>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Giá phòng đã chọn</Text>
          <Text style={styles.bottomPrice}>{formatCurrency(selectedRoom?.price || hotel.pricePerNight)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.bookNowBtn, !selectedRoom && { backgroundColor: COLORS.textMuted }]}
          onPress={() => {
            if (!selectedRoom) return;
            if (!user) {
              Alert.alert('Thông báo', 'Vui lòng đăng nhập để tiếp tục đặt phòng.');
              navigation.navigate('Login');
              return;
            }
            navigation.navigate('Booking', { hotel, room: selectedRoom, checkIn, checkOut });
          }}
          disabled={!selectedRoom}
          activeOpacity={0.8}
        >
          <Text style={styles.bookNowText}>Tiếp Tục Đặt Phòng</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  imageGalleryContainer: {
    height: 300,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  headerButtons: {
    position: 'absolute',
    top: 45,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  rightHeaderBtns: {
    flexDirection: 'row',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    ...SHADOWS.small,
  },
  thumbnailContainer: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
  },
  thumbnail: {
    width: 60,
    height: 45,
    borderRadius: RADIUS.sm,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: COLORS.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -RADIUS.xl,
    padding: SPACING.md,
  },
  hotelName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  ratingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.sm,
  },
  ratingText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationCity: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 2,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  dateSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  dateSelectorBox: {
    flex: 1,
  },
  dateBoxLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
  dateBoxValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBoxValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
  dateArrowBox: {
    paddingHorizontal: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  availableBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  availableTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#166534',
    marginLeft: 3,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
  roomCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: 'relative',
  },
  selectedRoomCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff',
  },
  roomImage: {
    width: 85,
    height: 85,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
  },
  roomDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roomMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  bedType: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  roomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  roomPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  perNightText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  roomOriginalPrice: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginLeft: 6,
    fontFamily: 'monospace',
    alignSelf: 'center',
  },
  holidayBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  holidayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    marginRight: 4,
    marginBottom: 2,
  },
  holidayBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  weekendBadge: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  weekendBadgeText: {
    color: '#4f46e5',
  },
  peakBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  peakBadgeText: {
    color: '#d97706',
  },
  tetBadge: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  tetBadgeText: {
    color: '#e11d48',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRoomsBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyRoomsText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  floatingAiBtn: {
    position: 'absolute',
    bottom: 85,
    right: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    ...SHADOWS.large,
    elevation: 8,
  },
  floatingAiText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
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
  bottomPriceLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  bookNowBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    ...SHADOWS.medium,
  },
  bookNowText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewCountBadge: {
    fontSize: 13,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  reviewCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  reviewAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  reviewAvatarText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
    fontSize: 18,
  },
  reviewMeta: {
    flex: 1,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reviewRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  reviewRatingText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  similarHotelCard: {
    width: 160,
    marginRight: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  similarHotelImage: {
    width: '100%',
    height: 100,
  },
  similarHotelInfo: {
    padding: SPACING.sm,
  },
  similarHotelName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  similarHotelRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  similarHotelRating: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  similarHotelPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // Calendar styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.xl,
    padding: 16,
    width: '100%',
    ...SHADOWS.large,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  monthSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayOfWeekText: {
    width: (width - 72) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: (width - 72) / 7,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 8,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary,
  },
  rangeDayCell: {
    backgroundColor: '#eff6ff',
  },
  dayText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  selectedDayText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  rangeDayText: {
    color: COLORS.primary,
  },
});

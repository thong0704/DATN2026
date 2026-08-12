import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { HOTELS, MOCK_BOOKINGS } from '../data/mockData';

// Tự động nhận diện IP Server (Máy ảo Android / Máy ảo iOS / Máy thật qua Expo QR)
const getHostIp = () => {
  const overrideUrl = process.env.EXPO_PUBLIC_API_URL;
  if (overrideUrl) {
    try {
      const url = new URL(overrideUrl);
      return url.hostname;
    } catch {
      return overrideUrl.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    }
  }

  // 1. Android Emulator (luôn dùng 10.0.2.2)
  if (!Constants.isDevice && Platform.OS === 'android') {
    return '10.0.2.2';
  }
  // 2. iOS Simulator (luôn dùng localhost)
  if (!Constants.isDevice && Platform.OS === 'ios') {
    return 'localhost';
  }

  // 3. Tự động trích xuất IP máy tính từ Expo Metro Bundler khi dùng Expo Go / QR
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') return ip;
  }

  // 4. Fallback cho mạng LAN, nhưng không cố định nếu QR đang chạy trên thiết bị thật
  return '192.168.1.21';
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://hotel-booking-api-khsw.onrender.com/api/v1';
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const normalizeMediaUrl = (url) => {
  if (!url) return url;
  if (typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/localhost|127\.0\.0\.1|10\.0\.2\.2/g, LAN_IP);
  }
  if (url.startsWith('/')) {
    return `${SERVER_BASE_URL}${url}`;
  }
  return url;
};

console.log('[API.JS] Resolved API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// --- HELPER CHUẨN HÓA DỮ LIỆU TỪ MONGODB SANG MOBILE FORMAT ---
export const normalizeHotel = (rawHotel) => {
  if (!rawHotel) return null;

  let mainImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  let gallery = [];

  if (Array.isArray(rawHotel.images) && rawHotel.images.length > 0) {
    gallery = rawHotel.images.map((img) => normalizeMediaUrl(typeof img === 'string' ? img : img.url || img.secure_url));
    mainImage = gallery[0] || mainImage;
  } else if (rawHotel.image) {
    mainImage = normalizeMediaUrl(rawHotel.image);
    gallery = rawHotel.gallery || [rawHotel.image].map(normalizeMediaUrl);
  }

  let city = 'Việt Nam';
  let address = '';
  if (rawHotel.address) {
    if (typeof rawHotel.address === 'object') {
      city = rawHotel.address.city || rawHotel.address.province || 'Việt Nam';
      address = `${rawHotel.address.street || ''}, ${city}`;
    } else {
      address = String(rawHotel.address);
      city = rawHotel.city || 'Việt Nam';
    }
  }

  const rooms = Array.isArray(rawHotel.rooms) ? rawHotel.rooms.map(normalizeRoom) : [];

  return {
    id: rawHotel._id ? rawHotel._id.toString() : rawHotel.id,
    name: rawHotel.name || 'Khách sạn nghỉ dưỡng 2T Hotel',
    slug: rawHotel.slug || '',
    city: city,
    address: address || 'Địa chỉ đang cập nhật',
    rating: rawHotel.avgRating || rawHotel.stars || rawHotel.rating || 4.8,
    reviewsCount: rawHotel.totalReviews || rawHotel.reviewsCount || 120,
    pricePerNight: rawHotel.basePrice || rawHotel.pricePerNight || 780000,
    originalPrice: rawHotel.originalPrice || (rawHotel.basePrice ? Math.round(rawHotel.basePrice * 1.2) : 950000),
    category: rawHotel.category || 'resort',
    image: mainImage,
    gallery: gallery.length > 0 ? gallery : [mainImage],
    description: rawHotel.description || 'Khách sạn 5 sao cao cấp với không gian sang trọng và dịch vụ đẳng cấp.',
    amenities: Array.isArray(rawHotel.amenities) && rawHotel.amenities.length > 0
      ? rawHotel.amenities
      : ['wifi', 'pool', 'gym', 'spa', 'parking', 'restaurant', 'bar', 'airport_shuttle'],
    rooms: rooms,
  };
};

export const normalizeRoom = (rawRoom) => {
  if (!rawRoom) return null;
  let capacityText = '2 người lớn';
  if (rawRoom.capacity) {
    if (typeof rawRoom.capacity === 'object') {
      capacityText = `${rawRoom.capacity.adults || 2} người lớn, ${rawRoom.capacity.children || 0} trẻ em`;
    } else {
      capacityText = String(rawRoom.capacity);
    }
  }

  let roomImg = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80';
  if (Array.isArray(rawRoom.images) && rawRoom.images.length > 0) {
    roomImg = typeof rawRoom.images[0] === 'string' ? rawRoom.images[0] : rawRoom.images[0].url || roomImg;
  } else if (rawRoom.image) {
    roomImg = rawRoom.image;
  }

  return {
    id: rawRoom._id ? rawRoom._id.toString() : rawRoom.id,
    name: rawRoom.type === 'basic' ? `Phòng Tiêu Chuẩn (${rawRoom.roomNumber})` : rawRoom.type === 'standard' ? `Phòng Cao Cấp (${rawRoom.roomNumber})` : `Phòng VIP Suite (${rawRoom.roomNumber})`,
    price: rawRoom.pricePerNight || rawRoom.price || rawRoom.basePrice || 780000,
    capacity: capacityText,
    size: rawRoom.size ? `${rawRoom.size}m²` : '30m²',
    bedType: rawRoom.bedType ? `${rawRoom.bedType} Bed` : '1 Giường King lớn',
    image: roomImg,
    status: rawRoom.status || 'available',
  };
};

export const normalizeBooking = (rawBooking) => {
  if (!rawBooking) return null;
  const hotelObj = typeof rawBooking.hotel === 'object' ? rawBooking.hotel : {};
  const roomObj = typeof rawBooking.room === 'object' ? rawBooking.room : {};

  return {
    id: rawBooking.bookingCode || rawBooking.code || (rawBooking._id ? `BK-${rawBooking._id.slice(-5)}` : rawBooking.id),
    hotelName: hotelObj.name || rawBooking.hotelName || 'Khách sạn 2T Hotel',
    roomName: roomObj.type ? `Phòng ${roomObj.roomNumber || ''} (${roomObj.type})` : rawBooking.roomName || 'Phòng nghỉ',
    checkIn: rawBooking.checkIn ? new Date(rawBooking.checkIn).toISOString().split('T')[0] : '2026-08-01',
    checkOut: rawBooking.checkOut ? new Date(rawBooking.checkOut).toISOString().split('T')[0] : '2026-08-03',
    guests: `${rawBooking.adults || 2} Người lớn`,
    totalPrice: rawBooking.pricing?.total || rawBooking.totalAmount || rawBooking.totalPrice || 1500000,
    status: rawBooking.paymentStatus === 'paid' || rawBooking.status === 'paid' ? 'Confirmed' : rawBooking.status === 'completed' ? 'Completed' : 'Confirmed',
    image: hotelObj.images?.[0]?.url || rawBooking.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
    city: hotelObj.address?.city || rawBooking.city || 'Việt Nam',
  };
};

// --- AUTH APIS ---
export const loginUser = async (email, password) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data?.data || res.data;
    return {
      token: data.accessToken || data.token,
      user: data.user,
    };
  } catch (error) {
    if (email === 'demo@gmail.com' || password === '123456') {
      return {
        token: 'mock-jwt-token-xyz',
        user: { id: 'u1', name: 'Nguyễn Văn A', email: 'demo@gmail.com', phone: '0901234567', role: 'customer' },
      };
    }
    throw new Error(error.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
  }
};

export const registerUser = async (userData) => {
  try {
    const res = await api.post('/auth/register', userData);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Đăng ký tài khoản không thành công');
  }
};

export const verifyRegistrationApi = async (email, code) => {
  try {
    const res = await api.post('/auth/verify-registration', { email, code });
    const data = res.data?.data || res.data;
    return {
      token: data.accessToken || data.token,
      user: data.user,
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn');
  }
};

export const resendVerificationCodeApi = async (email) => {
  try {
    const res = await api.post('/auth/resend-code', { email });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không thể gửi lại mã xác thực');
  }
};

export const updateProfile = async (token, updateData) => {
  try {
    const res = await api.put('/auth/profile', updateData, authHeader(token));
    return res.data;
  } catch (error) {
    return { data: { user: updateData } };
  }
};

export const getProfile = async (token) => {
  try {
    const res = await api.get('/auth/profile', authHeader(token));
    const data = res.data?.data || res.data;
    return { user: data.user || data };
  } catch (error) {
    return null;
  }
};

// --- HOTEL & ROOM APIS ---
export const fetchHotels = async (params = {}) => {
  try {
    const res = await api.get('/hotels', { params });
    const rawList = res.data?.data?.hotels || res.data?.hotels || res.data;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map(normalizeHotel);
    }
    return HOTELS;
  } catch (error) {
    console.log('[API] fetchHotels error:', error.message);
    return HOTELS;
  }
};

export const fetchHotelById = async (id) => {
  try {
    const isObjectId = id && id.length === 24 && !id.includes('-');
    const endpoint = isObjectId ? `/hotels/id/${id}` : `/hotels/${id}`;
    const res = await api.get(endpoint);
    const rawHotel = res.data?.data?.hotel || res.data?.hotel || res.data;
    return normalizeHotel(rawHotel);
  } catch (error) {
    console.log('[API] fetchHotelById error:', error.message);
    const found = HOTELS.find((h) => h.id === id);
    return found || HOTELS[0];
  }
};

export const fetchRoomsByHotel = async (hotelId) => {
  try {
    const res = await api.get(`/rooms/hotel/${hotelId}`);
    const rawRooms = res.data?.data?.rooms || res.data?.rooms || res.data;
    if (Array.isArray(rawRooms) && rawRooms.length > 0) {
      return rawRooms.map(normalizeRoom);
    }
    return [];
  } catch (error) {
    console.log('[API] fetchRoomsByHotel error:', error.message);
    return [];
  }
};

// --- BOOKING & PAYMENT REAL BACKEND APIS ---
export const createBookingApi = async (bookingPayload, token) => {
  try {
    const resBooking = await api.post('/bookings', bookingPayload, token ? authHeader(token) : {});
    const booking = resBooking.data?.data?.booking || resBooking.data?.booking || resBooking.data;

    let paymentData = null;

    if (booking && booking._id) {
      try {
        const method = bookingPayload.paymentMethod === 'card' 
          ? 'credit_card' 
          : bookingPayload.paymentMethod === 'momo' 
          ? 'momo' 
          : bookingPayload.paymentMethod === 'vnpay' 
          ? 'vnpay' 
          : 'cash';

        const resIntent = await api.post(
          '/payments/create-intent',
          { bookingId: booking._id, method, platform: 'mobile' },
          token ? authHeader(token) : {}
        );
        paymentData = resIntent.data?.data;
        const intentId = paymentData?.intentId;

        // Nếu là cash, tự động xác nhận đơn (đối với credit_card sẽ xác nhận khi nhập thẻ)
        if (intentId && method === 'cash') {
          await api.post('/payments/confirm', { intentId }, token ? authHeader(token) : {});
        }
      } catch (payErr) {
        console.log('[API] Payment intent error:', payErr.message);
      }
    }

    return {
      success: true,
      bookingId: booking?.bookingCode || booking?._id || `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      data: booking,
      paymentData,
    };
  } catch (error) {
    console.log('[API] Create booking error:', error.message);
    throw new Error(error.response?.data?.message || 'Đặt phòng không thành công');
  }
};

export const confirmPaymentApi = async (intentId, token) => {
  try {
    const res = await api.post('/payments/confirm', { intentId }, token ? authHeader(token) : {});
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Xác nhận thanh toán thất bại');
  }
};

export const checkPaymentStatusApi = async (bookingId, token) => {
  try {
    const res = await api.get(`/payments/booking/${bookingId}`, authHeader(token));
    return res.data?.data?.payment;
  } catch (error) {
    console.log('[API] checkPaymentStatusApi error:', error.message);
    return null;
  }
};

export const fetchMyBookings = async (token, statusFilter) => {
  try {
    const params = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
    const res = await api.get('/bookings/my-bookings', { ...authHeader(token), params });
    const rawList = res.data?.data?.bookings || res.data?.bookings || res.data;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((raw) => {
        const base = normalizeBooking(raw);
        // Giữ lại trạng thái gốc từ backend để filter chính xác
        return {
          ...base,
          rawStatus: raw.status,
          paymentStatus: raw.paymentStatus,
          _id: raw._id,
          bookingCode: raw.bookingCode,
          hotel: raw.hotel,
          room: raw.room,
          cancellationReason: raw.cancellationReason,
        };
      });
    }
    return MOCK_BOOKINGS;
  } catch (error) {
    return MOCK_BOOKINGS;
  }
};

export const fetchMyInvoices = async (token) => {
  try {
    const res = await api.get('/payments/my-invoices', authHeader(token));
    const rawList = res.data?.data?.invoices || res.data?.invoices || res.data;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((inv) => ({
        invoiceId: inv.invoiceNumber || inv._id,
        _id: inv._id,
        bookingId: inv.booking?.bookingCode || inv.bookingId,
        date: inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : '2026-07-30',
        hotelName: inv.booking?.hotel?.name || 'Khách sạn 2T Hotel',
        amount: inv.totalAmount || inv.amount || 0,
        paymentMethod: inv.method || inv.paymentMethod || 'cash',
        paymentStatus: inv.status || 'paid',
        breakdown: inv.breakdown || null,
      }));
    }
    // Fallback: nếu không có endpoint invoices riêng, tạo từ bookings
    const bookings = await fetchMyBookings(token);
    if (Array.isArray(bookings) && bookings.length > 0) {
      return bookings.filter(b => b.paymentStatus === 'paid' || b.rawStatus === 'paid').map((booking, idx) => ({
        invoiceId: `INV-${booking.bookingCode || booking.id || idx + 101}`,
        bookingId: booking.id,
        date: booking.checkIn || '2026-07-30',
        hotelName: booking.hotelName || 'Khách sạn 2T Hotel',
        amount: booking.totalPrice || 0,
        paymentMethod: 'online',
        paymentStatus: 'paid',
      }));
    }
    return [];
  } catch (error) {
    // Fallback: tạo invoices từ bookings
    try {
      const bookings = await fetchMyBookings(token);
      return bookings.filter(b => b.paymentStatus === 'paid' || b.rawStatus === 'paid').map((booking, idx) => ({
        invoiceId: `INV-${booking.bookingCode || booking.id || idx + 101}`,
        bookingId: booking.id,
        date: booking.checkIn || '2026-07-30',
        hotelName: booking.hotelName || 'Khách sạn 2T Hotel',
        amount: booking.totalPrice || 0,
        paymentMethod: 'online',
        paymentStatus: 'paid',
      }));
    } catch {
      return [];
    }
  }
};

// CHATBOT AI DÙNG CHUNG ENDPOINT TRỰC TIẾP VỚI BẢN WEB (`POST /api/v1/chatbot`)
export const queryChatbot = async (message, history = []) => {
  try {
    const res = await api.post('/chatbot', { message, history });
    return res.data?.data?.reply || res.data?.reply;
  } catch (error) {
    console.log('[API] queryChatbot error:', error.message);
    return 'Xin chào! Tôi là trợ lý AI Assistant của 2T Hotel Group. Tôi có thể giúp bạn chọn phòng nghỉ, tư vấn giá phòng hoặc gợi ý điểm đến du lịch!';
  }
};

// --- FORGOT PASSWORD & RESET PASSWORD ---
export const forgotPassword = async (email) => {
  try {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không thể gửi email khôi phục mật khẩu');
  }
};

export const resetPassword = async (email, code, newPassword) => {
  try {
    const res = await api.post('/auth/reset-password', { email, code, newPassword });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Đặt lại mật khẩu thất bại');
  }
};

export const changePassword = async (token, currentPassword, newPassword) => {
  try {
    const res = await api.put('/auth/change-password', { currentPassword, newPassword }, authHeader(token));
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
  }
};

// --- BOOKING LOOKUP ---
export const lookupBookingByCode = async (code) => {
  try {
    const res = await api.get(`/bookings/code/${code}`);
    const raw = res.data?.data?.booking || res.data?.booking || res.data;
    return normalizeBooking(raw);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không tìm thấy đơn đặt phòng');
  }
};

// --- CANCEL BOOKING ---
export const cancelBooking = async (token, bookingId, reason) => {
  try {
    const res = await api.put(`/bookings/${bookingId}/cancel`, { cancellationReason: reason }, authHeader(token));
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Hủy đặt phòng thất bại');
  }
};

// --- ARTICLES ---
export const fetchArticles = async () => {
  try {
    const res = await api.get('/articles');
    const rawList = res.data?.data?.articles || res.data?.articles || res.data;
    if (Array.isArray(rawList)) {
      const BASE = API_BASE_URL.replace('/api/v1', '');
      return rawList.map((a) => {
        let coverImage = a.coverImage?.url || a.coverImage || '';
        // Nếu là đường dẫn tương đối (/uploads/...) thì thêm server URL
        if (coverImage && coverImage.startsWith('/')) {
          coverImage = `${BASE}${coverImage}`;
        }
        if (!coverImage) {
          coverImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80';
        }
        return {
          id: a._id,
          slug: a.slug,
          title: a.title,
          summary: a.summary,
          content: a.content,
          image: coverImage,
          coverImage,
          views: a.views || 0,
          isPublished: a.isPublished,
          couponCode: a.couponCode,
          createdAt: a.createdAt,
          date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '',
        };
      });
    }
    return [];
  } catch (error) {
    console.log('[API] fetchArticles error:', error.message);
    return [];
  }
};

export const fetchArticleBySlug = async (slug) => {
  try {
    const res = await api.get(`/articles/${slug}`);
    const a = res.data?.data?.article || res.data?.article || res.data;
    const BASE = API_BASE_URL.replace('/api/v1', '');
    let coverImage = a.coverImage?.url || a.coverImage || '';
    if (coverImage && coverImage.startsWith('/')) {
      coverImage = `${BASE}${coverImage}`;
    }
    return {
      id: a._id,
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      content: a.content,
      image: coverImage,
      coverImage,
      views: a.views || 0,
      couponCode: a.couponCode,
      createdAt: a.createdAt,
      date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '',
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không tìm thấy bài viết');
  }
};

// --- WISHLIST ---
export const getWishlist = async (token) => {
  try {
    const res = await api.get('/wishlist', authHeader(token));
    const rawList = res.data?.data?.hotels || res.data?.data?.wishlist || res.data?.wishlist || res.data;
    if (Array.isArray(rawList)) {
      return rawList.map((item) => {
        const hotel = item.hotel || item;
        return normalizeHotel(hotel);
      }).filter(Boolean);
    }
    return [];
  } catch (error) {
    console.log('[API] getWishlist error:', error.message);
    return [];
  }
};

export const toggleWishlist = async (token, hotelId) => {
  try {
    const res = await api.post('/wishlist/toggle', { hotelId }, authHeader(token));
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Cập nhật danh sách yêu thích thất bại');
  }
};

// --- REVIEWS ---
export const fetchHotelReviews = async (hotelId) => {
  try {
    const res = await api.get(`/reviews/hotel/${hotelId}`);
    const rawList = res.data?.data?.reviews || res.data?.reviews || res.data;
    if (Array.isArray(rawList)) {
      return rawList.map((r) => ({
        id: r._id,
        userName: r.user?.name || 'Khách hàng',
        userAvatar: r.user?.avatar || null,
        rating: r.rating || 5,
        title: r.title || '',
        comment: r.comment || '',
        images: r.images || [],
        createdAt: r.createdAt,
      }));
    }
    return [];
  } catch (error) {
    console.log('[API] fetchHotelReviews error:', error.message);
    return [];
  }
};

export const createReview = async (token, reviewData) => {
  try {
    const res = await api.post('/reviews', reviewData, authHeader(token));
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gửi đánh giá thất bại');
  }
};

// --- COUPON ---
export const validateCoupon = async (token, code, hotelId) => {
  try {
    const res = await api.post('/coupons/validate', { code, hotelId }, token ? authHeader(token) : {});
    return res.data?.data || res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
  }
};

// --- CONTACT ---
export const submitContact = async (data) => {
  try {
    const res = await api.post('/contacts', data);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gửi liên hệ thất bại');
  }
};

// --- SIMILAR HOTELS ---
export const getSimilarHotels = async (hotelId) => {
  try {
    const res = await api.get(`/hotels/${hotelId}/similar`);
    const rawList = res.data?.data?.hotels || res.data?.hotels || res.data;
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeHotel).filter(Boolean);
    }
    return [];
  } catch (error) {
    console.log('[API] getSimilarHotels error:', error.message);
    return [];
  }
};

// --- BANNERS ---
export const fetchBanners = async () => {
  try {
    const res = await api.get('/banners');
    const banners = res.data?.data?.banners || res.data?.banners || res.data || [];
    return banners.map((b) => {
      if (b.image) {
        b.image = normalizeMediaUrl(b.image);
      }
      return b;
    });
  } catch (error) {
    console.log('[API] fetchBanners error:', error.message);
    return [];
  }
};

export default api;


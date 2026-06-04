import dayjs from 'dayjs';

export const formatCurrency = (n, currency = 'VND') =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(n || 0);

export const formatDate = (d, fmt = 'DD/MM/YYYY') => (d ? dayjs(d).format(fmt) : '');
export const formatDateTime = (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '');

export const nightsBetween = (a, b) => {
  if (!a || !b) return 0;
  return Math.max(0, dayjs(b).startOf('day').diff(dayjs(a).startOf('day'), 'day'));
};

export const statusColor = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    paid: 'bg-emerald-100 text-emerald-800',
    checked_in: 'bg-indigo-100 text-indigo-800',
    checked_out: 'bg-gray-200 text-gray-800',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-purple-100 text-purple-700',
    no_show: 'bg-orange-100 text-orange-700',
    available: 'bg-emerald-100 text-emerald-700',
    occupied: 'bg-rose-100 text-rose-700',
    cleaning: 'bg-amber-100 text-amber-700',
    maintenance: 'bg-slate-200 text-slate-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

// ----- Vietnamese label dictionaries -----
const STATUS_LABELS = {
  // Booking statuses
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  paid: 'Đã thanh toán',
  checked_in: 'Đã nhận phòng',
  checked_out: 'Đã trả phòng',
  cancelled: 'Đã huỷ',
  refunded: 'Đã hoàn tiền',
  no_show: 'Không đến',
  // Room statuses
  available: 'Trống',
  occupied: 'Có khách',
  cleaning: 'Đang dọn',
  maintenance: 'Bảo trì',
};

const PAYMENT_STATUS_LABELS = {
  unpaid: 'Chưa thanh toán',
  partially_paid: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
};

const ROLE_LABELS = {
  customer: 'Khách hàng',
  staff: 'Nhân viên',
  manager: 'Quản lý',
  admin: 'Quản trị viên',
};

const ROOM_TYPE_LABELS = {
  basic: 'Phòng thường',
  standard: 'Tiêu chuẩn',
  vip: 'VIP',
  // Legacy fallbacks
  deluxe: 'VIP',
  suite: 'VIP',
  presidential: 'VIP',
  double: 'Tiêu chuẩn',
  triple: 'VIP',
};

export const tStatus = (s) => STATUS_LABELS[s] || s || '';
export const tPaymentStatus = (s) => PAYMENT_STATUS_LABELS[s] || s || '';
export const tRole = (r) => ROLE_LABELS[r] || r || '';
export const tRoomType = (t) => ROOM_TYPE_LABELS[t] || t || '';

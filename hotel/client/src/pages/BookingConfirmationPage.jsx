import { useParams, Link } from 'react-router-dom';
import { useGetBookingQuery } from '../features/bookings/bookingsApi';
import Spinner from '../components/Spinner';
import { formatCurrency, formatDate, statusColor, tStatus, tRoomType } from '../utils/format';

export default function BookingConfirmationPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetBookingQuery(id);
  const booking = data?.data?.booking;
  if (isLoading) return <Spinner className="py-16" />;
  if (!booking) return <div className="p-8 text-center">Không tìm thấy đặt phòng.</div>;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(booking.bookingCode)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card p-8 text-center">
        <div className="text-5xl mb-2">🎉</div>
        <h1 className="text-2xl font-bold mb-1">Đặt phòng thành công!</h1>
        <p className="text-gray-600 mb-4">Vui lòng lưu lại mã đặt phòng để check-in nhanh chóng.</p>
        <div className="bg-brand-50 inline-block px-6 py-3 rounded-lg">
          <p className="text-xs text-gray-500">Mã đặt phòng</p>
          <p className="text-3xl font-mono font-bold text-brand-700">{booking.bookingCode}</p>
        </div>
        <div className="mt-6 flex justify-center">
          <img src={qrSrc} alt="QR" className="rounded-lg border" />
        </div>
      </div>

      <div className="card p-6 mt-6 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Khách sạn</p>
          <p className="font-semibold">{booking.hotel?.name}</p>
        </div>
        <div>
          <p className="text-gray-500">Phòng</p>
          <p className="font-semibold">{tRoomType(booking.room?.type)} · {booking.room?.roomNumber}</p>
        </div>
        <div>
          <p className="text-gray-500">Check-in</p>
          <p className="font-semibold">{formatDate(booking.checkIn)}</p>
        </div>
        <div>
          <p className="text-gray-500">Check-out</p>
          <p className="font-semibold">{formatDate(booking.checkOut)}</p>
        </div>
        <div>
          <p className="text-gray-500">Trạng thái</p>
          <span className={`badge ${statusColor(booking.status)}`}>{tStatus(booking.status)}</span>
        </div>
        <div>
          <p className="text-gray-500">Tổng tiền</p>
          <p className="font-bold text-brand-700">{formatCurrency(booking.pricing?.total)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-6">
        <Link to="/my-bookings" className="btn-primary">Đặt phòng của tôi</Link>
        <Link to="/" className="btn-outline">Về trang chủ</Link>
      </div>
    </div>
  );
}

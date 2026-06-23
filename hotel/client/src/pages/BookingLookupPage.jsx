import { useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi, useMyBookingsQuery } from '../features/bookings/bookingsApi';
import { useAuth } from '../hooks/useAuth';
import { formatDate, statusColor, formatCurrency, tStatus, tRoomType } from '../utils/format';

export default function BookingLookupPage() {
  const { isAuthenticated } = useAuth();
  const [code, setCode] = useState('');
  const [trigger, { data, isFetching, isError }] = bookingsApi.useLazyGetBookingByCodeQuery();
  const booking = data?.data?.booking;

  
  const { data: myData, isLoading: myLoading } = useMyBookingsQuery(undefined, { skip: !isAuthenticated });
  const myBookings = myData?.data?.bookings || [];

  if (isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in-up">
        <h1 className="text-2xl font-bold mb-6">Đặt phòng của tôi</h1>
        {myLoading ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : myBookings.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">Chưa có đặt phòng nào.</div>
        ) : (
          <div className="space-y-3">
            {myBookings.map((b) => (
              <Link key={b._id} to={`/booking-confirmation/${b._id}`} className="card p-4 flex flex-wrap items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <img src={b.hotel?.images?.[0]?.url} alt="" className="w-24 h-20 rounded-lg object-cover" />
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold">{b.hotel?.name}</p>
                  <p className="text-sm text-gray-500">
                    {b.rooms && b.rooms.length > 0
                      ? `${tRoomType(b.rooms[0].room?.type || b.room?.type)} · ${b.rooms.map(r => `Phòng ${r.room?.roomNumber || b.room?.roomNumber}`).join(', ')}`
                      : `${tRoomType(b.room?.type)} · Phòng ${b.room?.roomNumber}`}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.nights} đêm</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-700">{formatCurrency(b.pricing?.total)}</p>
                  <span className={`badge ${statusColor(b.status)}`}>{tStatus(b.status)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 animate-fade-in-up">
      <h1 className="text-2xl font-bold mb-4">Tra cứu đặt phòng</h1>
      <div className="card p-6 space-y-4">
        <input
          className="input" placeholder="Nhập mã đặt phòng (vd: BK-XXXXXX)"
          value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button onClick={() => trigger(code)} disabled={!code || isFetching} className="btn-primary w-full">
          {isFetching ? 'Đang tìm...' : 'Tra cứu'}
        </button>
      </div>
      {isError && <p className="text-red-600 mt-4 text-center">Không tìm thấy đặt phòng với mã này.</p>}
      {booking && (
        <div className="card p-6 mt-6">
          <h2 className="font-bold text-lg">{booking.hotel?.name}</h2>
          <p className="text-sm text-gray-500">
            {booking.rooms && booking.rooms.length > 0
              ? `${tRoomType(booking.rooms[0].room?.type || booking.room?.type)} · ${booking.rooms.map(r => `Phòng ${r.room?.roomNumber || booking.room?.roomNumber}`).join(', ')}`
              : `Phòng ${booking.room?.roomNumber} · ${tRoomType(booking.room?.type)}`}
          </p>
          <p className="mt-2">Check-in: {formatDate(booking.checkIn)}</p>
          <p>Check-out: {formatDate(booking.checkOut)}</p>
          <p className="mt-2">Tổng: <b>{formatCurrency(booking.pricing?.total)}</b></p>
          <span className={`badge mt-2 ${statusColor(booking.status)}`}>{tStatus(booking.status)}</span>
          <div className="mt-4">
            <Link to="/login" className="text-brand-700 text-sm">Đăng nhập để xem chi tiết →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

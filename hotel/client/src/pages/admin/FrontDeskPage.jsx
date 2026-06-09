import { useState } from 'react';
import { toast } from 'react-toastify';
import { bookingsApi } from '../../features/bookings/bookingsApi';
import { useUpdateBookingStatusMutation } from '../../features/bookings/bookingsApi';
import { formatDate, formatCurrency, tStatus } from '../../utils/format';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xử lý' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'checked_in', label: 'Đã check-in' },
  { value: 'checked_out', label: 'Đã check-out' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'no_show', label: 'Không đến' },
];

export default function FrontDeskPage() {
  const [code, setCode] = useState('');
  const [trigger, { data, isFetching }] = bookingsApi.useLazyGetBookingByCodeQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateBookingStatusMutation();
  const booking = data?.data?.booking;

  const action = async (status) => {
    try {
      await updateStatus({ id: booking._id, status }).unwrap();
      const label = STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
      toast.success(`Đã cập nhật: ${label}`);
      trigger(code);
    } catch (e) { toast.error(e?.data?.message || 'Lỗi cập nhật'); }
  };

  const STATUS_META = {
    pending:     { bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' },
    confirmed:   { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    paid:        { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
    checked_in:  { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    checked_out: { bg: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
    cancelled:   { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    no_show:     { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">🏨 Lễ tân</h1>
          <p className="text-lime-100/80 text-sm mt-1">Tra cứu và xử lý check-in / check-out</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 max-w-xl">
        <label className="label text-base font-semibold">🔍 Tìm booking theo mã đặt phòng</label>
        <div className="flex gap-2 mt-2">
          <input className="input flex-1 font-mono uppercase tracking-widest text-base" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BK-XXXXXX" />
          <button onClick={() => trigger(code)} disabled={!code || isFetching}
            className="btn-primary px-6 font-semibold">{isFetching ? '...' : 'Tìm'}</button>
        </div>
      </div>

      {booking && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-xl space-y-5">
          {/* Hotel & Room */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center text-2xl flex-shrink-0">🏨</div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{booking.hotel?.name}</p>
              <p className="text-sm text-gray-500">
                {booking.rooms && booking.rooms.length > 0
                  ? booking.rooms.map((r) => `Phòng ${r.room?.roomNumber || booking.room?.roomNumber}`).join(', ')
                  : `Phòng ${booking.room?.roomNumber}`}
              </p>
            </div>
            <div className="ml-auto">
              {(() => { const m = STATUS_META[booking.status] || STATUS_META.pending; return (
                <span className={`text-sm font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${m.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                  {tStatus(booking.status)}
                </span>
              ); })()}
            </div>
          </div>

          {/* Guest info */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Khách hàng</p>
              <p className="font-semibold text-gray-900 mt-0.5">{booking.guestInfo?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Điện thoại</p>
              <p className="font-medium text-gray-900 mt-0.5">{booking.guestInfo?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Check-in</p>
              <p className="font-semibold text-emerald-700 mt-0.5">{formatDate(booking.checkIn)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Check-out</p>
              <p className="font-semibold text-rose-600 mt-0.5">{formatDate(booking.checkOut)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Tổng thanh toán</p>
              <p className="font-bold text-indigo-700 text-lg mt-0.5">{formatCurrency(booking.pricing?.total)}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {booking.status === 'paid' && (
              <button onClick={() => action('checked_in')} disabled={updating}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:opacity-90 transition">
                ✅ Check-in
              </button>
            )}
            {booking.status === 'checked_in' && (
              <button onClick={() => action('checked_out')} disabled={updating}
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition">
                🚪 Check-out
              </button>
            )}
            {!['cancelled', 'checked_out', 'no_show'].includes(booking.status) && (
              <button onClick={() => confirm('Huỷ booking này?') && action('cancelled')} disabled={updating}
                className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 font-semibold rounded-xl hover:bg-red-100 transition">
                Huỷ đặt phòng
              </button>
            )}
          </div>

          {/* Manual status */}
          <div className="pt-4 border-t border-gray-100">
            <label className="label font-semibold">Đổi trạng thái thủ công</label>
            <select className="input mt-1" value={booking.status} disabled={updating}
              onChange={(e) => { if (e.target.value !== booking.status) action(e.target.value); }}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

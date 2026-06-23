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
      {}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h1 className="text-2xl font-serif-display font-medium text-primary">Lễ tân</h1>
        <p className="text-slate-400 text-xs mt-1 font-light">Tra cứu và xử lý check-in / check-out</p>
      </div>

      {}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6 max-w-xl">
        <label className="label text-sm font-bold uppercase tracking-wider text-slate-500">Tìm booking theo mã đặt phòng</label>
        <div className="flex gap-2 mt-2">
          <input className="input flex-1 font-mono uppercase tracking-widest text-base" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BK-XXXXXX" />
          <button onClick={() => trigger(code)} disabled={!code || isFetching}
            className="btn-accent px-6 text-xs font-semibold">{isFetching ? '...' : 'Tìm'}</button>
        </div>
      </div>

      {booking && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 max-w-xl space-y-5">
          {/* Hotel & Room */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#FAF9F6] border border-border flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">2T</div>
            <div>
              <p className="font-bold text-primary text-base">{booking.hotel?.name}</p>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                {booking.rooms && booking.rooms.length > 0
                  ? booking.rooms.map((r) => `Phòng ${r.room?.roomNumber || booking.room?.roomNumber}`).join(', ')
                  : `Phòng ${booking.room?.roomNumber}`}
              </p>
            </div>
            <div className="ml-auto">
              {(() => { const m = STATUS_META[booking.status] || STATUS_META.pending; return (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${m.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                  {tStatus(booking.status)}
                </span>
              ); })()}
            </div>
          </div>

          {/* Guest info */}
          <div className="grid grid-cols-2 gap-3 bg-[#FAF9F6] rounded-xl p-5 border border-border">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Khách hàng</p>
              <p className="font-semibold text-primary mt-0.5">{booking.guestInfo?.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Điện thoại</p>
              <p className="font-medium text-primary mt-0.5">{booking.guestInfo?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Check-in</p>
              <p className="font-semibold text-emerald-700 mt-0.5">{formatDate(booking.checkIn)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Check-out</p>
              <p className="font-semibold text-rose-600 mt-0.5">{formatDate(booking.checkOut)}</p>
            </div>
            <div className="col-span-2 border-t border-border pt-3.5 mt-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Tổng thanh toán</p>
              <p className="font-bold text-accent text-lg mt-0.5">{formatCurrency(booking.pricing?.total)}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {booking.status === 'paid' && (
              <button onClick={() => action('checked_in')} disabled={updating}
                className="flex-1 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition">
                Check-in
              </button>
            )}
            {booking.status === 'checked_in' && (
              <button onClick={() => action('checked_out')} disabled={updating}
                className="flex-1 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition">
                Check-out
              </button>
            )}
            {!['cancelled', 'checked_out', 'no_show'].includes(booking.status) && (
              <button onClick={() => confirm('Huỷ booking này?') && action('cancelled')} disabled={updating}
                className="px-5 py-2.5 bg-red-50 text-red-650 border border-red-200 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-red-100 transition">
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

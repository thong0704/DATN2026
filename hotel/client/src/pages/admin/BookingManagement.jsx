import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  useAllBookingsQuery,
  useUpdateBookingStatusMutation,
} from '../../features/bookings/bookingsApi';
import Spinner from '../../components/Spinner';
import { formatCurrency, formatDate, statusColor, tStatus } from '../../utils/format';

const STATUSES = ['pending', 'confirmed', 'paid', 'checked_in', 'checked_out', 'cancelled', 'refunded'];

const STATUS_META = {
  pending:     { bg: 'bg-amber-100 text-amber-800 border border-amber-200',    dot: 'bg-amber-500' },
  confirmed:   { bg: 'bg-blue-100 text-blue-800 border border-blue-200',       dot: 'bg-blue-500' },
  paid:        { bg: 'bg-emerald-100 text-emerald-800 border border-emerald-200', dot: 'bg-emerald-500' },
  checked_in:  { bg: 'bg-indigo-100 text-indigo-800 border border-indigo-200', dot: 'bg-indigo-500' },
  checked_out: { bg: 'bg-slate-100 text-slate-700 border border-slate-200',    dot: 'bg-slate-400' },
  cancelled:   { bg: 'bg-red-100 text-red-700 border border-red-200',          dot: 'bg-red-500' },
  refunded:    { bg: 'bg-purple-100 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { bg: 'bg-gray-100 text-gray-700 border border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {tStatus(status)}
    </span>
  );
}

export default function BookingManagement() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const accessToken = useSelector((s) => s.auth.accessToken);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const base = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${base}/admin/reports/export?type=excel`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export thất bại');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Không thể xuất file. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };
  const { data, isLoading, refetch } = useAllBookingsQuery({
    q: q || undefined, status: status || undefined, page, limit: 20,
  });
  const [updateStatus] = useUpdateBookingStatusMutation();
  const bookings = data?.data?.bookings || [];
  const total = data?.meta?.total ?? bookings.length;

  const onUpdateStatus = async (id, st) => {
    try {
      await updateStatus({ id, status: st }).unwrap();
      toast.success('Cập nhật trạng thái thành công');
      refetch();
    } catch (e) { toast.error(e?.data?.message || 'Thất bại'); }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-brand-700 px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                📅 Quản lý đặt phòng
              </h1>
              <p className="text-blue-100/80 text-sm mt-1">
                {total > 0 ? `${total} đặt phòng` : 'Quản lý toàn bộ đặt phòng của hệ thống'}
              </p>
            </div>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-xl border border-white/20 transition-all duration-200 backdrop-blur-sm disabled:opacity-60"
            >
              {exporting ? '⏳ Đang xuất...' : '⬇ Export Excel'}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border-x border-b border-gray-200 px-6 py-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="input pl-9"
              placeholder="Tìm theo mã / tên khách..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input max-w-[200px]"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUSES.map((s) => <option key={s} value={s}>{tStatus(s)}</option>)}
          </select>
          <button
            onClick={() => refetch()}
            className="btn-outline text-sm px-4 py-2"
          >
            ↻ Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner className="py-16" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Mã đặt phòng</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Khách</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Khách sạn</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Phòng</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Check-in</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Check-out</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Tổng tiền</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Trạng thái</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b, i) => (
                  <tr key={b._id} className={`transition-colors hover:bg-blue-50/40 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 font-semibold">
                        {b.bookingCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {b.customer?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-800 text-sm">{b.customer?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">{b.hotel?.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                        {b.rooms && b.rooms.length > 0
                          ? b.rooms.map((r) => r.room?.roomNumber || b.room?.roomNumber).join(', ')
                          : b.room?.roomNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      <span className="text-emerald-700 font-medium">{formatDate(b.checkIn)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      <span className="text-rose-600 font-medium">{formatDate(b.checkOut)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-gray-900">{formatCurrency(b.pricing?.total)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:border-brand-400 focus:ring-1 focus:ring-brand-100 focus:outline-none cursor-pointer"
                        value={b.status}
                        onChange={(e) => onUpdateStatus(b._id, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{tStatus(s)}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <span className="text-4xl">📋</span>
                        <p className="font-medium text-gray-500">Không có đặt phòng nào</p>
                        <p className="text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.meta?.hasNext && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <p className="text-sm text-gray-500">Trang {page}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <button
                    className="btn-outline text-sm px-4 py-1.5"
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Trước
                  </button>
                )}
                <button
                  className="btn-primary text-sm px-4 py-1.5"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Tiếp theo →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

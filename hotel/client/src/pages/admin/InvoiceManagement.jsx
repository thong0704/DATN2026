import { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  useListInvoicesQuery,
  useGetInvoiceQuery,
  useMarkInvoicePaidMutation,
  useRefundMutation,
} from '../../features/payments/paymentsApi';
import Spinner from '../../components/Spinner';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

const STATUSES = ['pending', 'succeeded', 'failed', 'refunded'];
const METHODS = ['credit_card', 'bank_transfer', 'cash', 'momo', 'vnpay'];

const STATUS_META = {
  pending:   { label: 'Chờ thanh toán', bg: 'bg-amber-100 text-amber-800 border border-amber-200',     dot: 'bg-amber-500' },
  succeeded: { label: 'Đã thanh toán',  bg: 'bg-emerald-100 text-emerald-800 border border-emerald-200', dot: 'bg-emerald-500' },
  failed:    { label: 'Thất bại',        bg: 'bg-red-100 text-red-700 border border-red-200',          dot: 'bg-red-500' },
  refunded:  { label: 'Đã hoàn tiền',   bg: 'bg-purple-100 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
};

const METHOD_LABELS = {
  credit_card: 'Thẻ tín dụng',
  bank_transfer: 'Chuyển khoản',
  cash: 'Tiền mặt',
  momo: 'MoMo',
  vnpay: 'VNPay',
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, bg: 'bg-gray-100 text-gray-700 border border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function InvoiceDetailModal({ id, onClose }) {
  const { data, isLoading } = useGetInvoiceQuery(id, { skip: !id });
  const inv = data?.data?.invoice;

  const handlePrint = () => {
    window.print();
  };

  if (!id) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:bg-white print:p-0" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:rounded-none print:shadow-none print:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !inv ? (
          <Spinner className="py-16" />
        ) : (
          <div className="p-8" id="invoice-printable">
            <div className="flex items-start justify-between mb-6 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">HÓA ĐƠN</h2>
                <p className="text-sm text-gray-500 font-mono mt-1">#{inv._id}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={inv.status} />
                <p className="text-xs text-gray-500 mt-2">{formatDateTime(inv.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Khách hàng</p>
                <p className="font-semibold text-gray-900">{inv.user?.name}</p>
                <p className="text-sm text-gray-600">{inv.user?.email}</p>
                {inv.user?.phone && <p className="text-sm text-gray-600">{inv.user.phone}</p>}
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Khách sạn</p>
                <p className="font-semibold text-gray-900">{inv.booking?.hotel?.name}</p>
                {inv.booking?.hotel?.phone && <p className="text-sm text-gray-600">{inv.booking.hotel.phone}</p>}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-xs uppercase font-semibold text-gray-500 mb-2">Thông tin đặt phòng</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Mã booking:</span> <span className="font-mono font-semibold">{inv.booking?.bookingCode}</span></div>
                <div><span className="text-gray-500">Phòng:</span> <span className="font-semibold">
                  {inv.booking?.rooms && inv.booking?.rooms.length > 0
                    ? inv.booking.rooms.map(r => r.room?.roomNumber || inv.booking.room?.roomNumber).join(', ')
                    : inv.booking?.room?.roomNumber}
                </span></div>
                <div><span className="text-gray-500">Check-in:</span> <span className="font-semibold">{formatDate(inv.booking?.checkIn)}</span></div>
                <div><span className="text-gray-500">Check-out:</span> <span className="font-semibold">{formatDate(inv.booking?.checkOut)}</span></div>
                <div><span className="text-gray-500">Số đêm:</span> <span className="font-semibold">{inv.booking?.nights}</span></div>
                <div><span className="text-gray-500">Phương thức:</span> <span className="font-semibold">{METHOD_LABELS[inv.method] || inv.method}</span></div>
              </div>
            </div>

            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-gray-600 font-semibold">Khoản mục</th>
                  <th className="text-right py-2 text-gray-600 font-semibold">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Tiền phòng</td>
                  <td className="py-2 text-right">{formatCurrency(inv.booking?.pricing?.roomTotal)}</td>
                </tr>
                {inv.booking?.pricing?.servicesTotal > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2">Dịch vụ</td>
                    <td className="py-2 text-right">{formatCurrency(inv.booking.pricing.servicesTotal)}</td>
                  </tr>
                )}
                {inv.booking?.pricing?.tax > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2">Thuế</td>
                    <td className="py-2 text-right">{formatCurrency(inv.booking.pricing.tax)}</td>
                  </tr>
                )}
                {inv.booking?.pricing?.discount > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-emerald-700">Giảm giá</td>
                    <td className="py-2 text-right text-emerald-700">-{formatCurrency(inv.booking.pricing.discount)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-300">
                  <td className="py-3 font-bold text-lg">TỔNG CỘNG</td>
                  <td className="py-3 text-right font-bold text-lg text-brand-700">{formatCurrency(inv.amount)}</td>
                </tr>
                {inv.refundAmount > 0 && (
                  <tr>
                    <td className="py-1 text-purple-700">Đã hoàn</td>
                    <td className="py-1 text-right text-purple-700">-{formatCurrency(inv.refundAmount)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {inv.paidAt && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Ngày thanh toán:</span> {formatDateTime(inv.paidAt)}
              </p>
            )}
            {inv.refundReason && (
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">Lý do hoàn tiền:</span> {inv.refundReason}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 print:hidden">
              <button onClick={onClose} className="btn-outline">Đóng</button>
              <button onClick={handlePrint} className="btn-primary">🖨️ In hóa đơn</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoiceManagement() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);

  const params = useMemo(() => ({
    q: q || undefined,
    status: status || undefined,
    method: method || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: 20,
  }), [q, status, method, dateFrom, dateTo, page]);

  const { data, isLoading, refetch } = useListInvoicesQuery(params);
  const [markPaid, { isLoading: marking }] = useMarkInvoicePaidMutation();
  const [refund, { isLoading: refunding }] = useRefundMutation();

  const invoices = data?.data?.invoices || [];
  const stats = data?.data?.stats || { totalAmount: 0, succeededAmount: 0, refundedAmount: 0, count: 0 };
  const total = data?.meta?.total ?? invoices.length;
  const pages = data?.meta?.pages ?? 1;

  const onMarkPaid = async (id) => {
    if (!confirm('Xác nhận hóa đơn này đã được thanh toán?')) return;
    try {
      await markPaid(id).unwrap();
      toast.success('Đã đánh dấu hóa đơn là đã thanh toán');
    } catch (e) {
      toast.error(e?.data?.message || 'Thao tác thất bại');
    }
  };

  const onRefund = async (bookingId) => {
    const reason = prompt('Lý do hoàn tiền:');
    if (!reason) return;
    try {
      await refund({ bookingId, reason }).unwrap();
      toast.success('Đã hoàn tiền');
    } catch (e) {
      toast.error(e?.data?.message || 'Hoàn tiền thất bại');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-700 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">🧾 Quản lý hóa đơn</h1>
            <p className="text-emerald-100/80 text-sm mt-1">
              {total > 0 ? `${total} hóa đơn` : 'Theo dõi và quản lý toàn bộ hóa đơn thanh toán'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white border-x border-gray-200 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold">Tổng hóa đơn</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.count}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-700 uppercase font-semibold">Tổng giá trị</p>
            <p className="text-xl font-bold text-blue-900 mt-1">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-xs text-emerald-700 uppercase font-semibold">Đã thu</p>
            <p className="text-xl font-bold text-emerald-900 mt-1">{formatCurrency(stats.succeededAmount)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-xs text-purple-700 uppercase font-semibold">Đã hoàn</p>
            <p className="text-xl font-bold text-purple-900 mt-1">{formatCurrency(stats.refundedAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-x border-b border-gray-200 px-6 py-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="input pl-9"
              placeholder="Mã booking / tên / email khách..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <select className="input max-w-[180px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
          </select>
          <select className="input max-w-[180px]" value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }}>
            <option value="">Tất cả phương thức</option>
            {METHODS.map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
          <input type="date" className="input max-w-[160px]" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <input type="date" className="input max-w-[160px]" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          <button onClick={() => refetch()} className="btn-outline text-sm px-4 py-2">↻ Làm mới</button>
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
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Mã HĐ</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Booking</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Khách</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Khách sạn</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Phương thức</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold tracking-wide uppercase">Số tiền</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Trạng thái</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Ngày tạo</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv, i) => (
                  <tr key={inv._id} className={`transition-colors hover:bg-emerald-50/40 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] text-gray-700">{String(inv._id).slice(-8).toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 font-semibold">
                        {inv.booking?.bookingCode || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-800">{inv.user?.name}</div>
                      <div className="text-xs text-gray-500">{inv.user?.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">{inv.booking?.hotel?.name || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                        {METHOD_LABELS[inv.method] || inv.method}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(inv.amount)}</span>
                      {inv.refundAmount > 0 && (
                        <div className="text-xs text-purple-600">-{formatCurrency(inv.refundAmount)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">{formatDateTime(inv.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setDetailId(inv._id)}
                          className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                        >
                          Xem
                        </button>
                        {inv.status === 'pending' && inv.method === 'cash' && (
                          <button
                            onClick={() => onMarkPaid(inv._id)}
                            disabled={marking}
                            className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium disabled:opacity-50"
                          >
                            ✓ Đã thu
                          </button>
                        )}
                        {isAdmin && inv.status === 'succeeded' && (
                          <button
                            onClick={() => onRefund(inv.booking?._id)}
                            disabled={refunding}
                            className="text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium disabled:opacity-50"
                          >
                            ↩ Hoàn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <span className="text-4xl">🧾</span>
                        <p className="font-medium text-gray-500">Không có hóa đơn nào</p>
                        <p className="text-sm">Thử thay đổi bộ lọc</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm">
              <span className="text-gray-600">Trang {page} / {pages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-outline text-xs px-3 py-1 disabled:opacity-40"
                >← Trước</button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="btn-outline text-xs px-3 py-1 disabled:opacity-40"
                >Sau →</button>
              </div>
            </div>
          )}
        </div>
      )}

      <InvoiceDetailModal id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

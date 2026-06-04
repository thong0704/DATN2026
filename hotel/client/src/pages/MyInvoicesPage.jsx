import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyInvoicesQuery, useGetInvoiceQuery } from '../features/payments/paymentsApi';
import Spinner from '../components/Spinner';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';

const STATUS_META = {
  pending:   { label: 'Chờ thanh toán', cls: 'bg-amber-100 text-amber-800' },
  succeeded: { label: 'Đã thanh toán',  cls: 'bg-emerald-100 text-emerald-800' },
  failed:    { label: 'Thất bại',        cls: 'bg-red-100 text-red-700' },
  refunded:  { label: 'Đã hoàn tiền',   cls: 'bg-purple-100 text-purple-700' },
};

const METHOD_LABELS = {
  credit_card: 'Thẻ tín dụng',
  bank_transfer: 'Chuyển khoản',
  cash: 'Tiền mặt',
  momo: 'MoMo',
  vnpay: 'VNPay',
};

function InvoiceModal({ id, onClose }) {
  const { data, isLoading } = useGetInvoiceQuery(id, { skip: !id });
  const inv = data?.data?.invoice;

  if (!id) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:bg-white print:p-0" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:rounded-none print:shadow-none" onClick={(e) => e.stopPropagation()}>
        {isLoading || !inv ? <Spinner className="py-16" /> : (
          <div className="p-8">
            <div className="flex items-start justify-between mb-6 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">HÓA ĐƠN</h2>
                <p className="text-sm text-gray-500 font-mono mt-1">#{inv._id}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_META[inv.status]?.cls || 'bg-gray-100'}`}>
                  {STATUS_META[inv.status]?.label || inv.status}
                </span>
                <p className="text-xs text-gray-500 mt-2">{formatDateTime(inv.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Khách hàng</p>
                <p className="font-semibold">{inv.user?.name}</p>
                <p className="text-sm text-gray-600">{inv.user?.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Khách sạn</p>
                <p className="font-semibold">{inv.booking?.hotel?.name}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">Mã booking:</span> <span className="font-mono font-semibold">{inv.booking?.bookingCode}</span></div>
              <div><span className="text-gray-500">Phòng:</span> <span className="font-semibold">{inv.booking?.room?.roomNumber}</span></div>
              <div><span className="text-gray-500">Check-in:</span> {formatDate(inv.booking?.checkIn)}</div>
              <div><span className="text-gray-500">Check-out:</span> {formatDate(inv.booking?.checkOut)}</div>
              <div><span className="text-gray-500">Số đêm:</span> {inv.booking?.nights}</div>
              <div><span className="text-gray-500">Phương thức:</span> {METHOD_LABELS[inv.method] || inv.method}</div>
            </div>

            <table className="w-full text-sm mb-6">
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
              </tbody>
            </table>

            {inv.paidAt && <p className="text-sm text-gray-600 mb-2"><span className="font-semibold">Ngày thanh toán:</span> {formatDateTime(inv.paidAt)}</p>}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 print:hidden">
              <button onClick={onClose} className="btn-outline">Đóng</button>
              <button onClick={() => window.print()} className="btn-primary">🖨️ In hóa đơn</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyInvoicesPage() {
  const { data, isLoading } = useMyInvoicesQuery();
  const invoices = data?.data?.invoices || [];
  const [detailId, setDetailId] = useState(null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🧾 Hóa đơn của tôi</h1>
        <Link to="/my-bookings" className="btn-outline text-sm">← Đặt phòng</Link>
      </div>

      {isLoading ? (
        <Spinner className="py-16" />
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">Chưa có hóa đơn nào.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Mã HĐ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Booking</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Khách sạn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Phương thức</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Số tiền</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ngày</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-emerald-50/40">
                  <td className="px-4 py-3 font-mono text-xs">{String(inv._id).slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-semibold">
                      {inv.booking?.bookingCode || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{inv.booking?.hotel?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{METHOD_LABELS[inv.method] || inv.method}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_META[inv.status]?.cls || 'bg-gray-100'}`}>
                      {STATUS_META[inv.status]?.label || inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDateTime(inv.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailId(inv._id)} className="text-xs px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">
                      Xem / In
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceModal id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

import { useState } from 'react';
import {
  useDashboardRichQuery,
  useTopHotelsQuery,
} from '../../features/admin/adminApi';
import { useListHotelsQuery } from '../../features/hotels/hotelsApi';
import { useAllBookingsQuery } from '../../features/bookings/bookingsApi';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  ComposedChart, Line,
} from 'recharts';
import Spinner from '../../components/Spinner';
import { formatCurrency } from '../../utils/format';
import { tRoomType } from '../../utils/format';

const PERIODS = [
  { value: 'day', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'year', label: 'Năm nay' },
];

const ROOM_TYPE_COLORS = {
  basic: '#94a3b8',
  standard: '#8b5cf6',
  vip: '#ef4444',
};

const StatCard = ({ title, value, icon, subtitle, color = 'text-teal-600 bg-teal-50' }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
    </div>
    {subtitle && <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2">{subtitle}</p>}
  </div>
);

export default function DashboardOverview() {
  const [period, setPeriod] = useState('month');
  const [hotelId, setHotelId] = useState('');
  const today = new Date();
  const [pickDate, setPickDate] = useState(() => today.toISOString().slice(0, 10));
  const [pickMonth, setPickMonth] = useState(() => today.toISOString().slice(0, 7));
  const [pickYear, setPickYear] = useState(() => today.getFullYear());

  const range = (() => {
    if (period === 'day') {
      const s = new Date(pickDate + 'T00:00:00');
      const e = new Date(s); e.setDate(e.getDate() + 1);
      return { start: s.toISOString(), end: e.toISOString() };
    }
    if (period === 'week') {
      const s = new Date(pickDate + 'T00:00:00');
      const day = s.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      s.setDate(s.getDate() + diff);
      const e = new Date(s); e.setDate(e.getDate() + 7);
      return { start: s.toISOString(), end: e.toISOString() };
    }
    if (period === 'month') {
      const [y, m] = pickMonth.split('-').map(Number);
      const s = new Date(y, m - 1, 1);
      const e = new Date(y, m, 1);
      return { start: s.toISOString(), end: e.toISOString() };
    }
    const y = Number(pickYear);
    return { start: new Date(y, 0, 1).toISOString(), end: new Date(y + 1, 0, 1).toISOString() };
  })();

  const queryParams = { period, ...range, ...(hotelId ? { hotelId } : {}) };
  const { data, isLoading, refetch, isFetching } = useDashboardRichQuery(queryParams);
  const { data: top } = useTopHotelsQuery();
  const { data: hotelsData } = useListHotelsQuery({ limit: 100, mine: true });
  const { data: recentBookingsData } = useAllBookingsQuery({ limit: 5, sort: '-createdAt' });

  const hotels = hotelsData?.data?.hotels || [];
  const recentBookings = recentBookingsData?.data?.bookings || recentBookingsData?.data || [];
  const d = data?.data;
  const summary = d?.summary || {};
  const roomStats = d?.roomStats || { total: 0, available: 0, occupied: 0, maintenance: 0, cleaning: 0 };
  const trend = d?.trend || [];
  const reviewStats = d?.reviewStats || { avg: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const roomTypeDist = (d?.roomTypeDist || []).map((r) => ({
    name: tRoomType(r.type),
    value: r.count,
    type: r.type,
  }));
  const topData = (top?.data?.top || []).slice(0, 5).map((t) => ({
    name: t.hotel.name,
    revenue: t.revenue,
    bookings: t.bookings,
  }));

  const totalReviews = reviewStats.total || 0;
  const maxReviewCount = Math.max(1, ...Object.values(reviewStats.breakdown));

  // Smart Y-axis formatter: auto K/M/B based on value
  const moneyTick = (v) => {
    if (!v) return '0';
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
    return String(v);
  };

  const exportCSV = () => {
    const rows = [
      ['BÁO CÁO TỔNG QUAN', '', ''],
      ['Kỳ', PERIODS.find((p) => p.value === period)?.label || period, ''],
      [''],
      ['CHỈ SỐ', 'GIÁ TRỊ', ''],
      ['Doanh thu', formatCurrency(summary.revenue || 0), ''],
      ['Đặt phòng', summary.bookings || 0, ''],
      ['Khách hàng mới', summary.newCustomers || 0, ''],
      ['Đánh giá trung bình', (reviewStats.avg || 0).toFixed(1), ''],
      [''],
      ['XU HƯỚNG', '', ''],
      ['Kỳ', 'Doanh thu (VND)', 'Số đặt phòng'],
      ...trend.map((t) => [t.label, t.revenue || 0, t.bookings || 0]),
    ];
    const csv = '\uFEFF' + rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a8a7d, #1b6b6b)' }}>
          <h1 className="text-2xl font-bold text-white">📊 Dashboard Quản Lý</h1>
          <p className="text-white/70 text-sm mt-1">Tổng quan hoạt động khách sạn và thống kê chi tiết</p>
        </div>
        <div className="bg-white border-x border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {PERIODS.map((p) => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${period === p.value ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={period === p.value ? { background: 'linear-gradient(135deg, #1a8a7d, #1b6b6b)' } : {}}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(period === 'day' || period === 'week') && (
              <input type="date" className="input !py-1.5 !w-auto" value={pickDate} onChange={(e) => setPickDate(e.target.value)} />
            )}
            {period === 'month' && (
              <input type="month" className="input !py-1.5 !w-auto" value={pickMonth} onChange={(e) => setPickMonth(e.target.value)} />
            )}
            {period === 'year' && (
              <input type="number" min="2000" max="2100" className="input !py-1.5 !w-24" value={pickYear} onChange={(e) => setPickYear(e.target.value)} />
            )}
            <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className="input !py-1.5 !w-auto">
              <option value="">Tất cả khách sạn</option>
              {hotels.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
            <button onClick={() => refetch()} className="btn-outline text-sm flex items-center gap-1" disabled={isFetching}>
              <span className={isFetching ? 'animate-spin' : ''}>↻</span> Làm mới
            </button>
            <button onClick={exportCSV} className="text-sm flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 hover:bg-teal-100 transition font-semibold">
              ⬇ Xuất CSV
            </button>
          </div>
        </div>
      </div>

      {isLoading ? <Spinner className="py-16" /> : (
        <>
          {/* Summary cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Doanh Thu"
              value={formatCurrency(summary.periodRevenue || 0)}
              icon="💰"
              subtitle="So với kỳ trước"
              color="text-teal-600 bg-teal-50"
            />
            <StatCard
              title="Đặt Phòng"
              value={summary.periodBookings || 0}
              icon="🛒"
              subtitle="Đơn đặt phòng mới"
              color="text-blue-600 bg-blue-50"
            />
            <StatCard
              title="Khách Hàng"
              value={summary.newCustomersInRange || 0}
              icon="👥"
              subtitle="Khách hàng mới"
              color="text-purple-600 bg-purple-50"
            />
            <StatCard
              title="Tỷ Lệ Lấp Đầy"
              value={`${summary.occupancyPercent || 0} %`}
              icon="🏠"
              subtitle={`${roomStats.occupied}/${roomStats.total} phòng đang dùng`}
              color="text-amber-600 bg-amber-50"
            />
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Khách hàng</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mã số</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Khách sạn</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(recentBookings) ? recentBookings : []).slice(0, 5).map((booking) => {
                    const customerName = booking.user?.name || booking.contactInfo?.name || 'Khách';
                    const nameInitials = customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    const colors = ['#1a8a7d', '#2563eb', '#7c3aed', '#dc2626', '#ea580c'];
                    const colorIdx = (customerName.charCodeAt(0) || 0) % colors.length;
                    return (
                      <tr key={booking._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: colors[colorIdx] }}>
                              {nameInitials}
                            </div>
                            <span className="font-medium text-gray-900">{customerName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-600">{booking.bookingCode || booking._id?.slice(-6).toUpperCase()}</td>
                        <td className="py-3 px-2 text-gray-600">{booking.hotel?.name || '—'}</td>
                        <td className="py-3 px-2 text-gray-500">{booking.createdAt ? new Date(booking.createdAt).toLocaleString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      </tr>
                    );
                  })}
                  {(!Array.isArray(recentBookings) || recentBookings.length === 0) && (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-400">Chưa có hoạt động</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Main combined chart */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">📈 Biểu Đồ Doanh Thu &amp; Đặt Phòng</h2>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <ComposedChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="left" orientation="left" tickFormatter={moneyTick} />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                  <Tooltip formatter={(v, name) => name === 'Doanh thu' ? formatCurrency(v) : v} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" name="Đặt phòng" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Three small panels: room type / occupancy / room stats */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Room type distribution */}
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">🏨 Phân Bổ Loại Phòng</h3>
              {roomTypeDist.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Chưa có dữ liệu</p>
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={roomTypeDist}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        label={(entry) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                      >
                        {roomTypeDist.map((e, i) => (
                          <Cell key={i} fill={ROOM_TYPE_COLORS[e.type] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Occupancy trend (uses bookings count from trend as proxy) */}
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">📊 Tỷ Lệ Lấp Đầy Theo Thời Gian</h3>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="bookings" stroke="#f97316" fill="url(#occ)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Room stats */}
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">🛏️ Thống Kê Phòng</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-600">{roomStats.total}</p>
                  <p className="text-xs text-gray-500">Tổng phòng</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-500">{roomStats.occupied}</p>
                  <p className="text-xs text-gray-500">Đang sử dụng</p>
                </div>
              </div>
              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex justify-between"><span>Phòng trống</span><span className="badge bg-emerald-100 text-emerald-700">{roomStats.available}</span></div>
                <div className="flex justify-between"><span>Đang dọn</span><span className="badge bg-blue-100 text-blue-700">{roomStats.cleaning}</span></div>
                <div className="flex justify-between"><span>Bảo trì</span><span className="badge bg-gray-200 text-gray-700">{roomStats.maintenance}</span></div>
              </div>
            </div>
          </div>

          {/* Reviews + top hotels */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">⭐ Đánh Giá Khách Hàng</h3>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold flex items-center justify-center gap-2">
                  ☆ <span className="text-amber-500">{reviewStats.avg}</span>
                  <span className="text-gray-400 text-lg">/5</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">Từ {totalReviews} đánh giá</p>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const cnt = reviewStats.breakdown[star] || 0;
                  const pct = totalReviews ? (cnt / maxReviewCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-6 text-gray-600">{star} ☆</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-gray-500">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">📈 Xu Hướng Doanh Thu</h3>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={topData} margin={{ left: 10, right: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" interval={0} height={60} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={moneyTick} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

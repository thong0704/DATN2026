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
  basic: '#A89E92',     // Clay muted
  standard: '#10B981',  // Bright emerald green
  vip: '#F59E0B',       // Bright amber gold
};

const THEMES = {
  emerald: {
    border: 'hover:border-emerald-500/40 hover:bg-emerald-50/10',
    icon: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white'
  },
  amber: {
    border: 'hover:border-amber-500/40 hover:bg-amber-50/10',
    icon: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white'
  },
  sky: {
    border: 'hover:border-sky-500/40 hover:bg-sky-50/10',
    icon: 'text-sky-600 bg-sky-50 group-hover:bg-sky-600 group-hover:text-white'
  },
  indigo: {
    border: 'hover:border-indigo-500/40 hover:bg-indigo-50/10',
    icon: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white'
  }
};

const StatCard = ({ title, value, icon, subtitle, theme = 'amber' }) => {
  const styles = THEMES[theme] || THEMES.amber;
  return (
    <div className={`bg-surface rounded-xl border border-border p-6 transition-all duration-300 group shadow-sm ${styles.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.08em] font-bold mb-1">{title}</p>
          <p className="text-3xl font-serif-display font-medium text-primary">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-350 ${styles.icon}`}>
          {icon}
        </div>
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-4 border-t border-border pt-3 font-light">{subtitle}</p>}
    </div>
  );
};

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

  const [isComparing, setIsComparing] = useState(false);
  const [compareTab, setCompareTab] = useState('revenue');
  const [compareDate, setCompareDate] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [compareMonth, setCompareMonth] = useState(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });
  const [compareYear, setCompareYear] = useState(() => today.getFullYear() - 1);

  const compareRange = (() => {
    if (period === 'day') {
      const s = new Date(compareDate + 'T00:00:00');
      const e = new Date(s); e.setDate(e.getDate() + 1);
      return { start: s.toISOString(), end: e.toISOString() };
    }
    if (period === 'week') {
      const s = new Date(compareDate + 'T00:00:00');
      const day = s.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      s.setDate(s.getDate() + diff);
      const e = new Date(s); e.setDate(e.getDate() + 7);
      return { start: s.toISOString(), end: e.toISOString() };
    }
    if (period === 'month') {
      const [y, m] = compareMonth.split('-').map(Number);
      const s = new Date(y, m - 1, 1);
      const e = new Date(y, m, 1);
      return { start: s.toISOString(), end: e.toISOString() };
    }
    const y = Number(compareYear);
    return { start: new Date(y, 0, 1).toISOString(), end: new Date(y + 1, 0, 1).toISOString() };
  })();

  const queryParams = { period, ...range, ...(hotelId ? { hotelId } : {}) };
  const { data, isLoading, refetch, isFetching } = useDashboardRichQuery(queryParams);

  const compareQueryParams = { period, ...compareRange, ...(hotelId ? { hotelId } : {}) };
  const { data: compareData, isLoading: isCompareLoading } = useDashboardRichQuery(
    compareQueryParams,
    { skip: !isComparing }
  );

  const { data: top } = useTopHotelsQuery();
  const { data: hotelsData } = useListHotelsQuery({ limit: 100, mine: true });
  const { data: recentBookingsData } = useAllBookingsQuery({ limit: 5, sort: '-createdAt' });

  const hotels = hotelsData?.data?.hotels || [];
  const recentBookings = recentBookingsData?.data?.bookings || recentBookingsData?.data || [];
  const d = data?.data;
  const summary = d?.summary || {};
  const roomStats = d?.roomStats || { total: 0, available: 0, occupied: 0, maintenance: 0, cleaning: 0 };
  const trend = d?.trend || [];

  const getDiffPercent = (curr, prev) => {
    if (!prev) return curr ? '+100%' : '0%';
    const pct = ((curr - prev) / prev) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

  const formatPeriodLabel = (pVal, dateStr, monthStr, yearVal) => {
    if (pVal === 'year') return String(yearVal);
    if (pVal === 'month') {
      const [y, m] = monthStr.split('-');
      return `${m}/${y}`;
    }
    if (pVal === 'day') {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}`;
    }
    if (pVal === 'week') {
      const [y, m, d] = dateStr.split('-');
      return `Tuần ${d}/${m}`;
    }
    return '';
  };

  const mainLabel = formatPeriodLabel(period, pickDate, pickMonth, pickYear);
  const compareLabel = formatPeriodLabel(period, compareDate, compareMonth, compareYear);

  const getComparisonData = () => {
    if (!isComparing || !compareData?.data?.trend) return [];
    
    const mainTrend = trend;
    const compTrend = compareData.data.trend;
    
    const getRelativeKeyAndName = (item) => {
      if (period === 'year') {
        const parts = item.label.split('/');
        const m = parseInt(parts[0]);
        return { key: m, displayLabel: `Thg ${m}` };
      }
      if (period === 'month' || period === 'week') {
        const parts = item.label.split('/');
        const d = parseInt(parts[0]);
        return { key: d, displayLabel: `Ngày ${d}` };
      }
      if (period === 'day') {
        const h = parseInt(item.label.replace('h', ''));
        return { key: h, displayLabel: `${h}h` };
      }
      return { key: item.label, displayLabel: item.label };
    };

    const mergedMap = new Map();

    mainTrend.forEach((item) => {
      const { key, displayLabel } = getRelativeKeyAndName(item);
      mergedMap.set(key, {
        key,
        label: displayLabel,
        revenueMain: item.revenue || 0,
        bookingsMain: item.bookings || 0,
        revenueCompare: 0,
        bookingsCompare: 0,
      });
    });

    compTrend.forEach((item) => {
      const { key, displayLabel } = getRelativeKeyAndName(item);
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        existing.revenueCompare = item.revenue || 0;
        existing.bookingsCompare = item.bookings || 0;
      } else {
        mergedMap.set(key, {
          key,
          label: displayLabel,
          revenueMain: 0,
          bookingsMain: 0,
          revenueCompare: item.revenue || 0,
          bookingsCompare: item.bookings || 0,
        });
      }
    });

    return Array.from(mergedMap.values()).sort((a, b) => {
      if (typeof a.key === 'number' && typeof b.key === 'number') {
        return a.key - b.key;
      }
      return String(a.key).localeCompare(String(b.key));
    });
  };
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
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-xl overflow-hidden border border-border bg-surface shadow-sm">
        <div className="px-6 py-6 border-b border-border bg-surface text-left">
          <h1 className="text-2xl font-medium text-primary font-serif-display">
            Dashboard <span className="font-serif-display italic text-accent font-normal">Quản Lý</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-light">Thống kê dữ liệu hoạt động chuỗi khách sạn 2T Hotel</p>
        </div>
        <div className="bg-surface px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* Period Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {PERIODS.map((p) => (
              <button 
                key={p.value} 
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                  period === p.value 
                    ? 'bg-accent text-white border-accent shadow-sm' 
                    : 'bg-transparent text-slate-650 border-border hover:bg-[#FDF6E2] hover:text-accent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Custom Date Pickers & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {(period === 'day' || period === 'week') && (
              <input type="date" className="input !py-1.5 !px-3 !w-auto bg-surface" value={pickDate} onChange={(e) => setPickDate(e.target.value)} />
            )}
            {period === 'month' && (
              <input type="month" className="input !py-1.5 !px-3 !w-auto bg-surface" value={pickMonth} onChange={(e) => setPickMonth(e.target.value)} />
            )}
            {period === 'year' && (
              <input type="number" min="2000" max="2100" className="input !py-1.5 !px-3 !w-20 bg-surface" value={pickYear} onChange={(e) => setPickYear(e.target.value)} />
            )}
            
            <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className="input !py-1.5 !px-3 !w-auto bg-surface cursor-pointer">
              <option value="">Tất cả khách sạn</option>
              {hotels.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
            
            <button 
              onClick={() => refetch()} 
              className="px-4 py-2 border border-border hover:bg-slate-50 hover:text-primary text-slate-800 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
              disabled={isFetching}
            >
              <span className={isFetching ? 'animate-spin' : ''}>↻</span> Làm mới
            </button>
            
            <button 
              onClick={exportCSV} 
              className="px-4 py-2 border border-border bg-transparent text-slate-800 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
            >
              ⬇ Xuất CSV
            </button>
          </div>
        </div>

        <div className="bg-[#F8FAFC] px-6 py-3 border-t border-border flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isComparing}
              onChange={(e) => setIsComparing(e.target.checked)}
              className="rounded border-gray-300 text-accent focus:ring-accent w-4 h-4 cursor-pointer"
            />
            So sánh với kỳ khác
          </label>

          {isComparing && (
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="text-slate-400 font-light">Kỳ so sánh:</span>
              {(period === 'day' || period === 'week') && (
                <input
                  type="date"
                  className="input !py-1 !px-2 !w-auto bg-surface text-xs"
                  value={compareDate}
                  onChange={(e) => setCompareDate(e.target.value)}
                />
              )}
              {period === 'month' && (
                <input
                  type="month"
                  className="input !py-1 !px-2 !w-auto bg-surface text-xs"
                  value={compareMonth}
                  onChange={(e) => setCompareMonth(e.target.value)}
                />
              )}
              {period === 'year' && (
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  className="input !py-1 !px-2 !w-16 bg-surface text-xs"
                  value={compareYear}
                  onChange={(e) => setCompareYear(e.target.value)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading ? <Spinner className="py-16" /> : (
        <>
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
             <StatCard
              title="Doanh Thu"
              value={formatCurrency(summary.periodRevenue || 0)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              subtitle={
                isComparing ? (
                  <span className="flex flex-wrap items-center gap-x-1">
                    Kỳ so sánh: <span className="font-semibold">{formatCurrency(compareData?.data?.summary?.periodRevenue || 0)}</span> 
                    <span className={`font-bold ${(summary.periodRevenue || 0) >= (compareData?.data?.summary?.periodRevenue || 0) ? 'text-emerald-600' : 'text-red-500'}`}>
                      ({getDiffPercent(summary.periodRevenue || 0, compareData?.data?.summary?.periodRevenue || 0)})
                    </span>
                  </span>
                ) : (
                  "So với kỳ trước"
                )
              }
              theme="emerald"
            />
            <StatCard
              title="Đặt Phòng"
              value={summary.periodBookings || 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              }
              subtitle={
                isComparing ? (
                  <span className="flex flex-wrap items-center gap-x-1">
                    Kỳ so sánh: <span className="font-semibold">{compareData?.data?.summary?.periodBookings || 0}</span> 
                    <span className={`font-bold ${(summary.periodBookings || 0) >= (compareData?.data?.summary?.periodBookings || 0) ? 'text-emerald-600' : 'text-red-500'}`}>
                      ({getDiffPercent(summary.periodBookings || 0, compareData?.data?.summary?.periodBookings || 0)})
                    </span>
                  </span>
                ) : (
                  "Đơn đặt phòng mới"
                )
              }
              theme="amber"
            />
            <StatCard
              title="Khách Hàng"
              value={summary.newCustomersInRange || 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.97 5.97 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              }
              subtitle={
                isComparing ? (
                  <span className="flex flex-wrap items-center gap-x-1">
                    Kỳ so sánh: <span className="font-semibold">{compareData?.data?.summary?.newCustomersInRange || 0}</span> 
                    <span className={`font-bold ${(summary.newCustomersInRange || 0) >= (compareData?.data?.summary?.newCustomersInRange || 0) ? 'text-emerald-600' : 'text-red-500'}`}>
                      ({getDiffPercent(summary.newCustomersInRange || 0, compareData?.data?.summary?.newCustomersInRange || 0)})
                    </span>
                  </span>
                ) : (
                  "Khách hàng mới tuyển"
                )
              }
              theme="sky"
            />
            <StatCard
              title="Tỷ Lệ Lấp Đầy"
              value={`${summary.occupancyPercent || 0} %`}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              }
              subtitle={
                isComparing ? (
                  <span className="flex flex-wrap items-center gap-x-1">
                    Kỳ so sánh: <span className="font-semibold">{compareData?.data?.summary?.occupancyPercent || 0}%</span> 
                    <span className={`font-bold ${(summary.occupancyPercent || 0) >= (compareData?.data?.summary?.occupancyPercent || 0) ? 'text-emerald-600' : 'text-red-500'}`}>
                      ({getDiffPercent(summary.occupancyPercent || 0, compareData?.data?.summary?.occupancyPercent || 0)})
                    </span>
                  </span>
                ) : (
                  `${roomStats.occupied}/${roomStats.total} phòng hoạt động`
                )
              }
              theme="indigo"
            />
          </div>

          {/* Recent Activity Table */}
          <div className="bg-surface rounded-xl border border-border p-6 text-left shadow-sm">
            <h2 className="text-lg font-serif-display font-medium text-primary mb-4">Hoạt động gần đây</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-slate-50">
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-405 uppercase tracking-[0.08em]">Khách hàng</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-405 uppercase tracking-[0.08em]">Mã số</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-405 uppercase tracking-[0.08em]">Khách sạn</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-405 uppercase tracking-[0.08em]">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(recentBookings) ? recentBookings : []).slice(0, 5).map((booking) => {
                    const customerName = booking.user?.name || booking.contactInfo?.name || 'Khách';
                    const nameInitials = customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <tr key={booking._id} className="border-b border-border hover:bg-slate-50/80 transition duration-200 h-[52px]">
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-accent">
                              {nameInitials}
                            </div>
                            <span className="font-semibold text-primary">{customerName}</span>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-slate-600 font-mono text-[13px]">{booking.bookingCode || booking._id?.slice(-6).toUpperCase()}</td>
                        <td className="py-2 px-4 text-primary font-medium text-[13px]">{booking.hotel?.name || '—'}</td>
                        <td className="py-2 px-4 text-slate-500">{booking.createdAt ? new Date(booking.createdAt).toLocaleString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      </tr>
                    );
                  })}
                  {(!Array.isArray(recentBookings) || recentBookings.length === 0) && (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400">Chưa có hoạt động</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Main Chart */}
          <div className="bg-surface rounded-xl border border-border p-6 text-left shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <h2 className="text-lg font-serif-display font-medium text-primary">
                📈 {isComparing ? 'Biểu Đồ So Sánh Doanh Thu & Đặt Phòng' : 'Biểu Đồ Doanh Thu & Đặt Phòng'}
              </h2>
              {isComparing && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setCompareTab('revenue')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      compareTab === 'revenue'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-600 hover:text-primary'
                    }`}
                  >
                    Doanh thu
                  </button>
                  <button
                    onClick={() => setCompareTab('bookings')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      compareTab === 'bookings'
                        ? 'bg-white text-amber-500 shadow-sm'
                        : 'text-slate-600 hover:text-primary'
                    }`}
                  >
                    Đặt phòng
                  </button>
                </div>
              )}
            </div>

            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                {isComparing ? (
                  <ComposedChart data={getComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.6} />
                    <XAxis dataKey="label" tick={{ fill: '#5E6672', fontSize: 11 }} />
                    {compareTab === 'revenue' ? (
                      <>
                        <YAxis tickFormatter={moneyTick} tick={{ fill: '#5E6672', fontSize: 11 }} />
                        <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="revenueMain" name={`Doanh thu (${mainLabel})`} stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="revenueCompare" name={`Doanh thu (${compareLabel})`} stroke="#94A3B8" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3, fill: '#94A3B8' }} />
                      </>
                    ) : (
                      <>
                        <YAxis allowDecimals={false} tick={{ fill: '#5E6672', fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="bookingsMain" name={`Đặt phòng (${mainLabel})`} stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="bookingsCompare" name={`Đặt phòng (${compareLabel})`} stroke="#94A3B8" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3, fill: '#94A3B8' }} />
                      </>
                    )}
                  </ComposedChart>
                ) : (
                  <ComposedChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.6} />
                    <XAxis dataKey="label" tick={{ fill: '#5E6672', fontSize: 11 }} />
                    <YAxis yAxisId="left" orientation="left" tickFormatter={moneyTick} tick={{ fill: '#5E6672', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fill: '#5E6672', fontSize: 11 }} />
                    <Tooltip formatter={(v, name) => name === 'Doanh thu' ? formatCurrency(v) : v} contentStyle={{ background: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 8 }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="bookings" name="Đặt phòng" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: '#F59E0B' }} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid lg:grid-cols-3 gap-6 text-left">
            {/* Room Type */}
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-md font-serif-display font-medium text-primary mb-4">🏨 Phân Bổ Loại Phòng</h3>
              {roomTypeDist.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Chưa có dữ liệu</p>
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
                        labelLine={false}
                      >
                        {roomTypeDist.map((e, i) => (
                          <Cell key={i} fill={ROOM_TYPE_COLORS[e.type] || '#9CA3AF'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#FFFFFF', borderColor: '#E5E7EB' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Occupancy Trend */}
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-md font-serif-display font-medium text-primary mb-4">📊 Tỷ Lệ Lấp Đầy Theo Thời Gian</h3>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                    <XAxis dataKey="label" tick={{ fill: '#5E6672', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#5E6672', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#FFFFFF', borderColor: '#E5E7EB' }} />
                    <Area type="monotone" dataKey="bookings" stroke="#10B981" fill="url(#occ)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Room Stats breakdown */}
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-md font-serif-display font-medium text-primary mb-4">🛏️ Thống Kê Phòng</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="text-center bg-slate-50 py-3 rounded-lg border border-border">
                  <p className="text-3xl font-serif-display font-medium text-primary">{roomStats.total}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Tổng phòng</p>
                </div>
                <div className="text-center bg-[#FDF6E2]/40 py-3 rounded-lg border border-border/60">
                  <p className="text-3xl font-serif-display font-medium text-accent">{roomStats.occupied}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Đang dùng</p>
                </div>
              </div>
              <div className="space-y-3 text-xs border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Phòng trống</span>
                  <span className="badge bg-[#FDF6E2] text-accent border border-border">{roomStats.available}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Đang dọn dẹp</span>
                  <span className="badge bg-slate-100 text-slate-600 border border-border">{roomStats.cleaning}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Đang bảo trì</span>
                  <span className="badge bg-red-50 text-red-700 border border-border">{roomStats.maintenance}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews & Top Performance hotels */}
          <div className="grid lg:grid-cols-2 gap-6 text-left">
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-md font-serif-display font-medium text-primary mb-4">⭐ Đánh Giá Khách Hàng</h3>
              <div className="text-center mb-6">
                <p className="text-4xl font-serif-display font-medium flex items-center justify-center gap-1.5 text-primary">
                  <span className="text-accent">★</span> {reviewStats.avg}
                  <span className="text-[#9CA3AF] text-sm font-sans font-light">/5</span>
                </p>
                <p className="text-xs text-slate-500 mt-1 font-light">Dựa trên {totalReviews} lượt phản hồi</p>
              </div>
              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const cnt = reviewStats.breakdown[star] || 0;
                  const pct = totalReviews ? (cnt / maxReviewCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-8 text-slate-605 font-semibold">{star} ★</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-slate-400 font-mono">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-md font-serif-display font-medium text-primary mb-5">Xu hướng doanh thu</h3>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={topData} margin={{ left: 10, right: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.6} />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" interval={0} height={60} tick={{ fontSize: 10, fill: '#5E6672' }} />
                    <YAxis tickFormatter={moneyTick} tick={{ fill: '#5E6672', fontSize: 10 }} />
                    <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: '#FFFFFF', borderColor: '#E5E7EB' }} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
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

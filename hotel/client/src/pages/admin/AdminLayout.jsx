import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutMutation } from '../../features/auth/authApi';
import { logout } from '../../features/auth/authSlice';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true, roles: ['admin', 'manager'] },
  { to: '/admin/bookings', label: 'Quản lý đặt phòng', roles: ['admin', 'manager', 'staff'] },
  { to: '/admin/invoices', label: 'Quản lý hóa đơn', roles: ['admin', 'manager', 'staff'] },
  { to: '/admin/hotels', label: 'Quản lý khách sạn', roles: ['admin', 'manager'] },
  { to: '/admin/rooms', label: 'Quản lý phòng', roles: ['admin', 'manager'] },
  { to: '/admin/coupons', label: 'Mã giảm giá', roles: ['admin', 'manager'] },
  { to: '/admin/dynamic-pricing', label: 'Quản lý giá', roles: ['admin', 'manager'] },
  { to: '/admin/banners', label: 'Banner & Điểm đến', roles: ['admin', 'manager'] },
  { to: '/admin/articles', label: 'Bài viết', roles: ['admin', 'manager'] },
  { to: '/admin/contacts', label: 'Liên hệ', roles: ['admin', 'manager', 'staff'] },
  { to: '/admin/users', label: 'Người dùng', roles: ['admin'] },
  { to: '/admin/front-desk', label: 'Lễ tân', roles: ['admin', 'manager', 'staff'] },
];

const getIcon = (to, isActive) => {
  let colorCls = "text-slate-400 group-hover:text-primary";
  if (isActive) {
    colorCls = "text-accent";
  } else {
    switch (to) {
      case '/admin': colorCls = "text-sky-500"; break;
      case '/admin/bookings': colorCls = "text-amber-500"; break;
      case '/admin/invoices': colorCls = "text-emerald-500"; break;
      case '/admin/hotels': colorCls = "text-indigo-500"; break;
      case '/admin/rooms': colorCls = "text-purple-500"; break;
      case '/admin/coupons': colorCls = "text-rose-500"; break;
      case '/admin/dynamic-pricing': colorCls = "text-orange-500"; break;
      case '/admin/banners': colorCls = "text-cyan-500"; break;
      case '/admin/articles': colorCls = "text-teal-500"; break;
      case '/admin/contacts': colorCls = "text-red-500"; break;
      case '/admin/users': colorCls = "text-fuchsia-500"; break;
      case '/admin/front-desk': colorCls = "text-lime-500"; break;
    }
  }
  const cls = `w-4 h-4 shrink-0 transition-colors duration-200 ${colorCls}`;
  switch (to) {
    case '/admin':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      );
    case '/admin/bookings':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zM16.5 15h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" />
        </svg>
      );
    case '/admin/invoices':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case '/admin/hotels':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 0l-5.25 1.91m5.25-.545v13.305" />
        </svg>
      );
    case '/admin/rooms':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    case '/admin/coupons':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      );
    case '/admin/dynamic-pricing':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case '/admin/banners':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    case '/admin/articles':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7C5.047 9.548 5 10.768 5 12s.047 2.452.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.092-1.209.138-2.43.138-3.662zM9.75 9.75h4.5m-4.5 4.5h4.5" />
        </svg>
      );
    case '/admin/contacts':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      );
    case '/admin/users':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0112.75 21.5h-1.5a2.25 2.25 0 01-2.25-2.263V19.13m4.72-4.072a3.75 3.75 0 00-3.66 0M9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      );
    case '/admin/front-desk':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      );
    default:
      return null;
  }
};

export default function AdminLayout() {
  const { user, isAdmin } = useAuth();
  const [logoutApi] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const items = NAV.filter((n) => n.roles.includes(user?.role));

  useEffect(() => {
    if (user?.role === 'staff' && (location.pathname === '/admin' || location.pathname === '/admin/')) {
      navigate('/admin/front-desk', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const avatarUrl = typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url;

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  const handleLogout = async () => {
    await logoutApi();
    dispatch(logout());
    navigate('/admin/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="admin-theme min-h-screen flex bg-surface-bg">
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 sticky top-0 h-screen flex flex-col bg-white border-r border-border">
        {/* Logo */}
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-accent">
              II
            </div>
            <div>
              <p className="text-primary font-serif-display font-medium text-base tracking-widest uppercase">2T HOTEL</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold -mt-0.5">ADMIN PANEL</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hidden">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border-l-[3px] ${
                  isActive
                    ? 'text-accent bg-[#FDF6E2] border-accent'
                    : 'text-slate-600 border-transparent hover:text-primary hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="shrink-0">{getIcon(n.to, isActive)}</span>
                  <span className="truncate">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile info */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0 border border-border">
              {avatarUrl && !avatarLoadFailed ? (
                <img
                  src={avatarUrl}
                  alt={user?.name || 'Admin avatar'}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-primary text-xs font-bold uppercase tracking-wider truncate leading-tight">{user?.name}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold capitalize mt-0.5">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-border hover:border-red-600 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-red-50 hover:text-red-650 transition-all duration-200"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main Layout View ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-surface-bg">
        {/* Top Header */}
        <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-surface-bg">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 tracking-widest uppercase font-bold">Hệ thống quản lý / 2T Hotel</span>
            <h2 className="text-lg font-serif-display font-medium text-primary">Bảng Điều Khiển</h2>
          </div>
          
          <div className="flex items-center gap-5 text-slate-600">
            <button className="hover:text-accent transition-colors" title="Tìm kiếm">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="hover:text-accent transition-colors relative" title="Thông báo">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full" />
            </button>
            
            <div className="h-4 w-[1px] bg-border" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-605">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

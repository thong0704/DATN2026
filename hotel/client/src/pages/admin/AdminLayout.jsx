import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutMutation } from '../../features/auth/authApi';
import { logout } from '../../features/auth/authSlice';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true, icon: '📊' },
  { to: '/admin/bookings', label: 'Quản lý đặt phòng', icon: '📅' },
  { to: '/admin/invoices', label: 'Quản lý hóa đơn', icon: '🧾' },
  { to: '/admin/hotels', label: 'Quản lý khách sạn', icon: '🏨' },
  { to: '/admin/rooms', label: 'Quản lý phòng', icon: '🛏️' },
  { to: '/admin/coupons', label: 'Mã giảm giá', icon: '🎟️' },
  { to: '/admin/dynamic-pricing', label: 'Giá động', icon: '⚡' },
  { to: '/admin/banners', label: 'Banner & Điểm đến', icon: '🖼️' },
  { to: '/admin/articles', label: 'Bài viết', icon: '📝' },
  { to: '/admin/contacts', label: 'Liên hệ', icon: '📬' },
  { to: '/admin/users', label: 'Người dùng', icon: '👥', adminOnly: true },
  { to: '/admin/front-desk', label: 'Lễ tân', icon: '🛎️' },
];

export default function AdminLayout() {
  const { user, isAdmin } = useAuth();
  const [logoutApi] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);
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
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Sidebar ── */}
      <aside
        className="w-64 shrink-0 sticky top-0 h-screen flex flex-col shadow-xl"
        style={{ background: '#1e2a3a' }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #1a8a7d, #1b6b6b)' }}>
              2T
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight uppercase tracking-wide">Quản lý khách sạn</p>
              <p className="text-gray-400 text-[11px] mt-0.5">Hiện đại</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hidden">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg, #1a8a7d, #1b6b6b)' } : {}}
            >
              <span className="text-base shrink-0">{n.icon}</span>
              <span className="truncate">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #1a8a7d, #1b6b6b)' }}>
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
              <p className="text-white text-sm font-semibold truncate leading-tight">{user?.name}</p>
              <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <span className="text-base">🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useLogoutMutation } from '../features/auth/authApi';

export default function Navbar() {
  const { user, isAuthenticated, isStaff } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [doLogout] = useLogoutMutation();
  const avatarUrl = typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url;

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  const onLogout = async () => {
    try { await doLogout().unwrap(); } catch (e) { /* ignore */ }
    dispatch(logout());
    navigate('/');
    setMobileOpen(false);
  };

  const linkCls = ({ isActive }) =>
    `px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
      isActive ? 'text-brand-700 bg-brand-50 shadow-sm' : 'text-slate-600 hover:text-brand-700 hover:bg-slate-50'
    }`;

  const mobileLinkCls = ({ isActive }) =>
    `block rounded-xl px-3 py-2 text-sm font-semibold ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 text-sm font-black text-white shadow-lg">2T</span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">Hotel</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={linkCls}>Trang chủ</NavLink>
          <NavLink to="/hotels" className={linkCls}>Khách sạn</NavLink>
          <NavLink to="/articles" className={linkCls}>Bài viết</NavLink>
          <NavLink to="/booking-lookup" className={linkCls}>Tra cứu</NavLink>
          <NavLink to="/contact" className={linkCls}>Liên hệ</NavLink>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hidden text-sm font-semibold text-slate-600 transition hover:text-brand-700 sm:block">Đăng nhập</Link>
              <Link to="/register" className="rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-brand-700 hover:to-cyan-700">Đăng ký</Link>
            </>
          ) : (
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-2 py-1.5 text-sm font-medium transition hover:shadow-md">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-cyan-600 text-xs font-bold text-white ring-2 ring-white">
                  {avatarUrl && !avatarLoadFailed ? (
                    <img
                      src={avatarUrl}
                      alt={user?.name || 'User avatar'}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || 'U'
                  )}
                </span>
                <span className="hidden text-slate-700 sm:block">{user?.name}</span>
              </Menu.Button>
              <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl focus:outline-none">
                  <Menu.Item>{({ active }) => <Link to="/profile" className={`block rounded-xl px-3 py-2 text-sm ${active ? 'bg-slate-50' : ''}`}>Hồ sơ</Link>}</Menu.Item>
                  <Menu.Item>{({ active }) => <Link to="/my-bookings" className={`block rounded-xl px-3 py-2 text-sm ${active ? 'bg-slate-50' : ''}`}>Đặt phòng của tôi</Link>}</Menu.Item>
                  {isStaff && (
                    <Menu.Item>{({ active }) => <Link to="/admin" className={`block rounded-xl px-3 py-2 text-sm ${active ? 'bg-slate-50' : ''}`}>Trang quản trị</Link>}</Menu.Item>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <Menu.Item>{({ active }) => <button onClick={onLogout} className={`w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 ${active ? 'bg-red-50' : ''}`}>Đăng xuất</button>}</Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3 md:hidden">
          <div className="space-y-1">
            <NavLink to="/" end className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Trang chủ</NavLink>
            <NavLink to="/hotels" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Khách sạn</NavLink>
            <NavLink to="/articles" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Bài viết</NavLink>
            <NavLink to="/booking-lookup" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Tra cứu đặt phòng</NavLink>
            <NavLink to="/contact" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Liên hệ</NavLink>
            {!isAuthenticated && (
              <>
                <NavLink to="/login" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Đăng nhập</NavLink>
                <Link to="/register" className="mt-2 block rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 px-3 py-2 text-center text-sm font-semibold text-white" onClick={() => setMobileOpen(false)}>Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

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
    try { await doLogout().unwrap(); } catch (e) {  }
    dispatch(logout());
    navigate('/');
    setMobileOpen(false);
  };

  const linkCls = ({ isActive }) =>
    `relative py-2 text-xs font-semibold uppercase tracking-widest transition-all duration-300 flex items-center ${
      isActive 
        ? 'text-accent font-bold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-accent' 
        : 'text-slate-600 hover:text-primary after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-[1px] after:bg-accent hover:after:w-full hover:after:left-0 after:transition-all after:duration-300'
    }`;

  const mobileLinkCls = ({ isActive }) =>
    `block rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all ${
      isActive ? 'bg-brand-50 text-accent font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-white/80 backdrop-blur-md anim-load-nav">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-accent border border-accent/20 shadow-md group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all duration-500">
            II
          </span>
          <span className="text-xl font-medium tracking-widest text-primary font-serif-display group-hover:text-accent transition-colors duration-500">
            2T HOTEL
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-8 md:flex">
          <NavLink to="/" end className={linkCls}>Trang chủ</NavLink>
          <NavLink to="/hotels" className={linkCls}>Khách sạn</NavLink>
          <NavLink to="/articles" className={linkCls}>Bài viết</NavLink>
          <NavLink to="/booking-lookup" className={linkCls}>Tra cứu</NavLink>
          <NavLink to="/contact" className={linkCls}>Liên hệ</NavLink>
        </div>

        {/* User Menu / CTA */}
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <Link 
                to="/login" 
                className="hidden text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-primary transition-colors duration-300 sm:block"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/register" 
                className="rounded-full bg-accent text-white hover:bg-primary border border-accent hover:border-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                Đăng ký
              </Link>
            </>
          ) : (
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2.5 rounded-full border border-border bg-white px-2.5 py-1.5 text-sm font-medium transition hover:shadow-md hover:border-accent/30">
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-accent ring-1 ring-border">
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
                <span className="hidden text-xs font-semibold uppercase tracking-wider text-slate-700 sm:block">{user?.name}</span>
              </Menu.Button>
              <Transition 
                as={Fragment} 
                enter="transition ease-out duration-100" 
                enterFrom="opacity-0 scale-95" 
                enterTo="opacity-100 scale-100" 
                leave="transition ease-in duration-75" 
                leaveFrom="opacity-100 scale-100" 
                leaveTo="opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2.5 w-56 origin-top-right rounded-2xl border border-border bg-white p-2 shadow-xl focus:outline-none z-50">
                  <Menu.Item>{({ active }) => <Link to="/profile" className={`block rounded-xl px-4 py-2.5 text-xs font-medium uppercase tracking-wider ${active ? 'bg-slate-50 text-accent' : 'text-slate-700'}`}>Hồ sơ</Link>}</Menu.Item>
                  <Menu.Item>{({ active }) => <Link to="/my-bookings" className={`block rounded-xl px-4 py-2.5 text-xs font-medium uppercase tracking-wider ${active ? 'bg-slate-50 text-accent' : 'text-slate-700'}`}>Đặt phòng của tôi</Link>}</Menu.Item>
                  <Menu.Item>{({ active }) => <Link to="/wishlist" className={`block rounded-xl px-4 py-2.5 text-xs font-medium uppercase tracking-wider ${active ? 'bg-slate-50 text-accent' : 'text-slate-700'}`}>Danh sách yêu thích</Link>}</Menu.Item>
                  {isStaff && (
                    <Menu.Item>{({ active }) => <Link to="/admin" className={`block rounded-xl px-4 py-2.5 text-xs font-medium uppercase tracking-wider ${active ? 'bg-slate-50 text-accent' : 'text-slate-700'}`}>Trang quản trị</Link>}</Menu.Item>
                  )}
                  <div className="my-1 border-t border-border" />
                  <Menu.Item>{({ active }) => <button onClick={onLogout} className={`w-full rounded-xl px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-red-600 ${active ? 'bg-red-50' : ''}`}>Đăng xuất</button>}</Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          {/* Mobile Menu Toggle (Morphing Hamburger) */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex flex-col h-9 w-9 items-center justify-center gap-1 rounded-lg border border-border text-slate-700 hover:border-accent hover:text-accent transition-colors duration-300 md:hidden relative focus:outline-none"
            aria-label="Toggle menu"
          >
            <span className={`h-[1.5px] w-4.5 bg-current rounded-full transition-transform duration-300 ${mobileOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
            <span className={`h-[1.5px] w-4.5 bg-current rounded-full transition-opacity duration-300 ${mobileOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`h-[1.5px] w-4.5 bg-current rounded-full transition-transform duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-white/95 px-6 pb-6 pt-4 md:hidden animate-fade-in">
          <div className="space-y-1">
            <NavLink to="/" end className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Trang chủ</NavLink>
            <NavLink to="/hotels" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Khách sạn</NavLink>
            <NavLink to="/articles" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Bài viết</NavLink>
            <NavLink to="/booking-lookup" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Tra cứu đặt phòng</NavLink>
            <NavLink to="/contact" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Liên hệ</NavLink>
            {isAuthenticated && (
              <NavLink to="/wishlist" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Khách sạn yêu thích</NavLink>
            )}
            {!isAuthenticated && (
              <>
                <div className="my-2 border-t border-border" />
                <NavLink to="/login" className={mobileLinkCls} onClick={() => setMobileOpen(false)}>Đăng nhập</NavLink>
                <Link 
                  to="/register" 
                  className="mt-2 block rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-wider text-white shadow-md"
                  onClick={() => setMobileOpen(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

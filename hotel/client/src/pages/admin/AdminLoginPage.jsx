import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useLoginMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';

export default function AdminLoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await login(data).unwrap();
      const user = res.data.user;
      if (!['admin', 'manager', 'staff'].includes(user.role)) {
        toast.error('Tài khoản không có quyền truy cập quản trị');
        return;
      }
      dispatch(setCredentials({ user, accessToken: res.data.accessToken }));
      toast.success('Đăng nhập thành công');
      navigate('/admin', { replace: true });
    } catch (e) {
      toast.error(e?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="admin-theme min-h-screen flex items-center justify-center p-4 bg-[#EDE8DF]">
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-xl border border-[#E2D9CC]">
        {/* Left branding panel */}
        <div className="relative flex flex-col items-center justify-center px-8 py-12 text-center bg-[#C4972A]">
          <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 0l-5.25 1.91m5.25-.545v13.305" />
            </svg>
          </div>
          <h2 className="text-3xl font-serif-display font-medium text-white tracking-widest uppercase mb-1">2T HOTEL</h2>
          <p className="text-white/80 text-xs tracking-wider uppercase font-semibold">Hệ thống quản lý</p>
          
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/25 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              Đặt phòng
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/25 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              Khách sạn
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/25 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              Thống kê
            </span>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-col justify-center px-8 py-12 bg-[#FDFAF5]">
          <h1 className="text-2xl font-serif-display font-medium text-[#1C1C1A] mb-1">Chào mừng trở lại</h1>
          <p className="text-[#6B6357] text-xs font-light mb-8">Đăng nhập để tiếp cận bảng điều khiển 2T Hotel</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A89E92] mb-1.5">Email đăng nhập</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6B6357]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input
                  type="email"
                  className="w-full bg-transparent border-b border-[#E2D9CC] text-[#1C1C1A] pl-8 pr-4 py-2.5 focus:border-[#C4972A] focus:outline-none transition-all placeholder-slate-400 text-sm"
                  placeholder="admin@2thotel.vn"
                  {...register('email', { required: 'Vui lòng nhập email' })}
                />
              </div>
              {errors.email && <p className="text-red-650 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A89E92] mb-1.5">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6B6357]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-transparent border-b border-[#E2D9CC] text-[#1C1C1A] pl-8 pr-10 py-2.5 focus:border-[#C4972A] focus:outline-none transition-all placeholder-slate-400 text-sm"
                  placeholder="••••••••"
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A89E92] hover:text-[#6B6357] transition"
                >
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-650 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-xs font-semibold uppercase tracking-wider text-[#C4972A] hover:text-[#A07A1E] transition">
                Quên mật khẩu?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-[#C4972A] hover:bg-[#A07A1E] text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

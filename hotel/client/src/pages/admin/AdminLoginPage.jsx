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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#e8f4f8' }}>
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">
        {/* Left branding panel */}
        <div className="relative flex flex-col items-center justify-center px-8 py-12 text-center"
          style={{ background: 'linear-gradient(160deg, #1a8a7d 0%, #1b6b6b 50%, #164e5c 100%)' }}>
          <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Hotel Admin</h2>
          <p className="text-teal-100/80 text-sm tracking-wide uppercase">Hệ thống quản lý</p>
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-medium backdrop-blur-sm">
              📅 Đặt phòng
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-medium backdrop-blur-sm">
              🏨 Khách sạn
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-medium backdrop-blur-sm">
              📊 Báo cáo
            </span>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-col justify-center px-8 py-12" style={{ background: '#1e2a3a' }}>
          <h1 className="text-2xl font-bold text-white mb-1">Chào mừng trở lại</h1>
          <p className="text-gray-400 text-sm mb-8">Đăng nhập để quản lý hệ thống khách sạn</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Tên đăng nhập</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="email"
                  className="w-full bg-transparent border-b border-gray-600 text-white pl-10 pr-4 py-3 focus:border-teal-400 focus:outline-none transition placeholder-gray-500"
                  placeholder="admin@example.com"
                  {...register('email', { required: 'Vui lòng nhập email' })}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-transparent border-b border-gray-600 text-white pl-10 pr-10 py-3 focus:border-teal-400 focus:outline-none transition placeholder-gray-500"
                  placeholder="••••••••"
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-teal-400 hover:text-teal-300 transition">Quên mật khẩu?</Link>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #1a8a7d, #1b6b6b)' }}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

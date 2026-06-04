import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useLoginMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data) => {
    try {
      const res = await login(data).unwrap();
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      toast.success('Đăng nhập thành công');
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(e?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl bg-white animate-fade-in-up">
        {/* LEFT — Brand panel */}
        <div className="relative hidden md:flex flex-col justify-between p-10 text-white bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold">
              <span className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl">
                🏨
              </span>
              2T Hotel
            </Link>
            <p className="mt-2 text-white/80 text-sm">Chuỗi khách sạn cao cấp</p>
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-extrabold leading-snug">Chào mừng quay trở lại!</h2>
            <p className="text-white/90 leading-relaxed">
              Đăng nhập để quản lý đặt phòng, xem ưu đãi độc quyền và tận hưởng trải nghiệm nghỉ dưỡng đẳng cấp.
            </p>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-3"><CheckIcon /> Đặt phòng nhanh chóng, an toàn</li>
              <li className="flex items-start gap-3"><CheckIcon /> Ưu đãi và mã giảm giá riêng cho thành viên</li>
              <li className="flex items-start gap-3"><CheckIcon /> Hỗ trợ chatbot AI 24/7</li>
            </ul>
          </div>

          <p className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} 2T Hotel. All rights reserved.</p>
        </div>

        {/* RIGHT — Form */}
        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Đăng nhập</h1>
            <p className="text-gray-500 mt-1.5 text-sm">Nhập thông tin tài khoản của bạn để tiếp tục</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MailIcon /></span>
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' },
                  })}
                />
              </div>
              {errors.email && <p className="text-red-600 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LockIcon /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  {...register('remember')}
                />
                <span className="text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="text-brand-600 font-semibold hover:text-brand-700 transition">
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full !py-3 text-base">
              {isLoading ? (<><Spinner /> Đang đăng nhập...</>) : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700 transition">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Icons ----------
function MailIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 11c.83 0 1.5.67 1.5 1.5S12.83 14 12 14s-1.5-.67-1.5-1.5S11.17 11 12 11zm6-3h-1V6a5 5 0 10-10 0v2H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7z" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M13.87 18.82A10.05 10.05 0 0112 19c-4.48 0-8.27-2.94-9.54-7a9.97 9.97 0 011.56-3.03m5.86.9a3 3 0 014.24 4.24M9.88 9.88l4.24 4.24M9.88 9.88L3 3m6.88 6.88L21 21" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <span className="mt-0.5 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}
function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

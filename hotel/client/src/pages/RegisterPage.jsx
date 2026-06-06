import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useRegisterMutation, useVerifyRegistrationMutation, useResendVerificationCodeMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [doRegister, { isLoading }] = useRegisterMutation();
  const [doVerify, { isLoading: isVerifying }] = useVerifyRegistrationMutation();
  const [doResend, { isLoading: isResending }] = useResendVerificationCodeMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const password = watch('password', '');

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, agree, ...payload } = data;
      await doRegister(payload).unwrap();
      setRegisteredEmail(payload.email);
      setStep('verify');
      setCountdown(60);
      toast.success('Mã xác thực đã được gửi đến email của bạn!');
    } catch (e) {
      toast.error(e?.data?.message || 'Đăng ký thất bại');
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 số');
      return;
    }
    try {
      const res = await doVerify({ email: registeredEmail, code }).unwrap();
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (e) {
      toast.error(e?.data?.message || 'Mã xác thực không đúng');
    }
  };

  const handleResend = async () => {
    try {
      await doResend({ email: registeredEmail }).unwrap();
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      toast.success('Mã xác thực mới đã được gửi!');
    } catch (e) {
      toast.error(e?.data?.message || 'Gửi lại mã thất bại');
    }
  };

  const strength = (() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'][strength];
  const strengthColor = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl bg-white animate-fade-in-up">
        {/* LEFT — Brand panel */}
        <div className="relative hidden md:flex flex-col justify-between p-10 text-white bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold">
              <span className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl">🏨</span>
              2T Hotel
            </Link>
            <p className="mt-2 text-white/80 text-sm">Chuỗi khách sạn cao cấp</p>
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-extrabold leading-snug">Bắt đầu hành trình của bạn</h2>
            <p className="text-white/90 leading-relaxed">
              Tạo tài khoản miễn phí để đặt phòng, nhận ưu đãi độc quyền và quản lý kỳ nghỉ một cách dễ dàng.
            </p>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-3"><CheckIcon /> Miễn phí, đăng ký chỉ trong 30 giây</li>
              <li className="flex items-start gap-3"><CheckIcon /> Tích điểm thành viên, đổi ưu đãi</li>
              <li className="flex items-start gap-3"><CheckIcon /> Thanh toán an toàn qua Stripe, MoMo, VNPay</li>
              <li className="flex items-start gap-3"><CheckIcon /> Lịch sử đặt phòng & hóa đơn điện tử</li>
            </ul>
          </div>

          <p className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} 2T Hotel. All rights reserved.</p>
        </div>

        {/* RIGHT — Form */}
        <div className="p-8 sm:p-10">
          {step === 'form' ? (
          <>
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Tạo tài khoản</h1>
            <p className="text-gray-500 mt-1.5 text-sm">Điền thông tin bên dưới để bắt đầu sử dụng 2T Hotel</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Họ và tên</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserIcon /></span>
                <input
                  className="input pl-10"
                  placeholder="Nguyễn Văn A"
                  {...register('name', {
                    required: 'Vui lòng nhập họ tên',
                    minLength: { value: 2, message: 'Họ tên quá ngắn' },
                  })}
                />
              </div>
              {errors.name && <p className="text-red-600 text-xs mt-1.5">{errors.name.message}</p>}
            </div>

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
              <label className="label">Số điện thoại <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><PhoneIcon /></span>
                <input
                  className="input pl-10"
                  placeholder="0901 234 567"
                  {...register('phone', {
                    pattern: { value: /^[0-9+\-\s]{8,15}$/, message: 'Số điện thoại không hợp lệ' },
                  })}
                />
              </div>
              {errors.phone && <p className="text-red-600 text-xs mt-1.5">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="label">Mật khẩu</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LockIcon /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Tối thiểu 6 ký tự"
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                  })}
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

              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${i < strength ? strengthColor : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Độ mạnh: <span className="font-semibold text-gray-700">{strengthLabel}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Xác nhận mật khẩu</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LockIcon /></span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Nhập lại mật khẩu"
                  {...register('confirmPassword', {
                    required: 'Vui lòng xác nhận mật khẩu',
                    validate: (v) => v === password || 'Mật khẩu không khớp',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-600 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                {...register('agree', { required: 'Vui lòng đồng ý với điều khoản' })}
              />
              <span className="text-gray-600">
                Tôi đồng ý với{' '}
                <a href="#" className="text-brand-600 font-semibold hover:underline">Điều khoản dịch vụ</a>{' '}
                và{' '}
                <a href="#" className="text-brand-600 font-semibold hover:underline">Chính sách bảo mật</a>
              </span>
            </label>
            {errors.agree && <p className="text-red-600 text-xs -mt-2">{errors.agree.message}</p>}

            <button type="submit" disabled={isLoading} className="btn-primary w-full !py-3 text-base">
              {isLoading ? (<><Spinner /> Đang tạo tài khoản...</>) : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700 transition">
              Đăng nhập
            </Link>
          </p>
          </>
          ) : (
          /* OTP Verification Step */
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Xác thực email</h2>
            <p className="text-gray-500 text-sm text-center mb-1">
              Chúng tôi đã gửi mã xác thực 6 số đến
            </p>
            <p className="text-brand-600 font-semibold text-sm mb-6">{registeredEmail}</p>

            <div className="flex gap-2 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition"
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || otp.join('').length !== 6}
              className="btn-primary w-full max-w-xs !py-3 text-base mb-4"
            >
              {isVerifying ? (<><Spinner /> Đang xác thực...</>) : 'Xác nhận'}
            </button>

            <p className="text-sm text-gray-500">
              Không nhận được mã?{' '}
              {countdown > 0 ? (
                <span className="text-gray-400">Gửi lại sau {countdown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-brand-600 font-semibold hover:text-brand-700 transition"
                >
                  {isResending ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
              )}
            </p>

            <button
              onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); }}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              ← Quay lại đăng ký
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Icons ----------
function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 5a2 2 0 012-2h2.3a2 2 0 011.94 1.5l.7 2.8a2 2 0 01-.5 1.94L8.2 10.8a14 14 0 005 5l1.56-1.24a2 2 0 011.94-.5l2.8.7A2 2 0 0121 16.7V19a2 2 0 01-2 2h-1C9.6 21 3 14.4 3 6V5z" />
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

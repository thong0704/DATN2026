import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../features/auth/authApi';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm();
  const [doForgot, { isLoading }] = useForgotPasswordMutation();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await doForgot(data).unwrap();
      toast.success('Mã xác thực đã được gửi đến email của bạn.');
      navigate('/reset-password', { state: { email: data.email } });
    } catch (e) {
      toast.error(e?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in-up">
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-2">Quên mật khẩu</h1>
        <p className="text-sm text-gray-600 mb-4">
          Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input className="input" placeholder="Email" type="email" {...register('email', { required: true })} />
          <button disabled={isLoading} className="btn-primary w-full">Gửi mã xác nhận</button>
        </form>
        <Link to="/login" className="text-sm text-brand-700 mt-3 inline-block">← Quay lại đăng nhập</Link>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: location.state?.email || '',
      code: '',
      password: '',
    }
  });
  const [doReset, { isLoading }] = useResetPasswordMutation();

  const onSubmit = async (data) => {
    try {
      await doReset(data).unwrap();
      toast.success('Đặt lại mật khẩu thành công, hãy đăng nhập');
      navigate('/login');
    } catch (e) {
      toast.error(e?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in-up">
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-2">Đặt lại mật khẩu</h1>
        <p className="text-sm text-gray-600 mb-4">
          Nhập mã xác thực đã được gửi đến email của bạn và mật khẩu mới.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Email</label>
            <input
              className="input"
              placeholder="Email"
              type="email"
              {...register('email', { required: true })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Mã xác thực</label>
            <input
              className="input"
              placeholder="Mã xác thực (6 chữ số)"
              type="text"
              maxLength={6}
              {...register('code', { required: true, minLength: 6, maxLength: 6 })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Mật khẩu mới</label>
            <input
              className="input"
              placeholder="Mật khẩu mới"
              type="password"
              {...register('password', { required: true, minLength: 6 })}
            />
          </div>
          <button disabled={isLoading} className="btn-primary w-full mt-2">Đặt lại mật khẩu</button>
        </form>
        <Link to="/forgot-password" className="text-sm text-brand-700 mt-4 inline-block">← Gửi lại mã xác nhận</Link>
      </div>
    </div>
  );
}

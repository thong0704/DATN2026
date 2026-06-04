import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../features/auth/authApi';
import { useParams, useNavigate, Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm();
  const [doForgot, { isLoading }] = useForgotPasswordMutation();
  const [sent, setSent] = useState(false);
  const onSubmit = async (data) => {
    try { await doForgot(data).unwrap(); setSent(true); } catch (e) { toast.error(e?.data?.message); }
  };
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-2">Quên mật khẩu</h1>
        {sent ? (
          <p className="text-green-700">Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <input className="input" placeholder="Email" type="email" {...register('email', { required: true })} />
            <button disabled={isLoading} className="btn-primary w-full">Gửi link đặt lại</button>
          </form>
        )}
        <Link to="/login" className="text-sm text-brand-700 mt-3 inline-block">← Quay lại đăng nhập</Link>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [doReset, { isLoading }] = useResetPasswordMutation();
  const onSubmit = async ({ password }) => {
    try {
      await doReset({ token, password }).unwrap();
      toast.success('Đổi mật khẩu thành công, hãy đăng nhập');
      navigate('/login');
    } catch (e) { toast.error(e?.data?.message); }
  };
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-2">Đặt lại mật khẩu</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input className="input" placeholder="Mật khẩu mới" type="password" {...register('password', { required: true, minLength: 6 })} />
          <button disabled={isLoading} className="btn-primary w-full">Đặt lại mật khẩu</button>
        </form>
      </div>
    </div>
  );
}

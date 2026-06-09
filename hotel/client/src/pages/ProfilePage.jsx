import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
} from '../features/auth/authApi';
import { setUser } from '../features/auth/authSlice';

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: ch }] = useChangePasswordMutation();
  const [uploadAvatar] = useUploadAvatarMutation();

  const avatarUrl = typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url;

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  const { register, handleSubmit } = useForm({ defaultValues: { name: user?.name, phone: user?.phone } });
  const { register: rPwd, handleSubmit: hPwd, reset } = useForm();

  const onSave = async (data) => {
    try {
      const res = await updateProfile(data).unwrap();
      dispatch(setUser(res.data.user));
      toast.success('Cập nhật thành công');
    } catch (e) { toast.error(e?.data?.message || 'Thất bại'); }
  };
  const onChangePassword = async (data) => {
    try {
      await changePassword(data).unwrap();
      toast.success('Đổi mật khẩu thành công');
      reset();
    } catch (e) { toast.error(e?.data?.message || 'Thất bại'); }
  };
  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await uploadAvatar(fd).unwrap();
      dispatch(setUser(res.data.user));
      toast.success('Cập nhật ảnh đại diện');
    } catch (err) { toast.error('Không thể tải lên'); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
      <h1 className="text-2xl font-bold mb-6">Hồ sơ cá nhân</h1>

      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-brand-600 text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
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
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-xs text-brand-700 mt-1">Loyalty: {user?.loyaltyPoints || 0} điểm</p>
        </div>
        <label className="btn-outline cursor-pointer">
          Đổi ảnh
          <input type="file" accept="image/*" hidden onChange={onAvatar} />
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form className="card p-6 space-y-3" onSubmit={handleSubmit(onSave)}>
          <h2 className="font-semibold">Thông tin cá nhân</h2>
          <div><label className="label">Họ tên</label><input className="input" {...register('name')} /></div>
          <div><label className="label">Số điện thoại</label><input className="input" {...register('phone')} /></div>
          <button disabled={isLoading} className="btn-primary">Lưu thay đổi</button>
        </form>

        <form className="card p-6 space-y-3" onSubmit={hPwd(onChangePassword)}>
          <h2 className="font-semibold">Đổi mật khẩu</h2>
          <div><label className="label">Mật khẩu hiện tại</label><input type="password" className="input" {...rPwd('currentPassword', { required: true })} /></div>
          <div><label className="label">Mật khẩu mới</label><input type="password" className="input" {...rPwd('newPassword', { required: true, minLength: 6 })} /></div>
          <button disabled={ch} className="btn-primary">Đổi mật khẩu</button>
        </form>
      </div>
    </div>
  );
}

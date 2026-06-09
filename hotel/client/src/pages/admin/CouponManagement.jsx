import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import {
  useListMyCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from '../../features/coupons/couponsApi';
import Spinner from '../../components/Spinner';
import { formatCurrency, formatDate } from '../../utils/format';

export default function CouponManagement() {
  const { data, isLoading, refetch } = useListMyCouponsQuery();
  const [create] = useCreateCouponMutation();
  const [update] = useUpdateCouponMutation();
  const [del] = useDeleteCouponMutation();
  const coupons = data?.data?.coupons || [];
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const onEdit = (c) => {
    setEditing(c);
    reset({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType || 'percent',
      discountValue: c.discountValue,
      maxDiscount: c.maxDiscount || 0,
      minOrderAmount: c.minOrderAmount || 0,
      maxUses: c.maxUses || 0,
      validFrom: c.validFrom ? dayjs(c.validFrom).format('YYYY-MM-DD') : '',
      validTo: c.validTo ? dayjs(c.validTo).format('YYYY-MM-DD') : '',
      isActive: c.isActive !== false,
    });
  };

  const onSave = async (form) => {
    const payload = {
      code: form.code,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount: Number(form.maxDiscount || 0),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxUses: Number(form.maxUses || 0),
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      isActive: form.isActive !== false,
    };
    try {
      if (editing) await update({ id: editing._id, ...payload }).unwrap();
      else await create(payload).unwrap();
      toast.success('Đã lưu');
      reset();
      setEditing(null);
      refetch();
    } catch (e) { toast.error(e?.data?.message || 'Lỗi'); }
  };

  const onDelete = async (id) => {
    if (!confirm('Xoá mã giảm giá này?')) return;
    try { await del(id).unwrap(); toast.success('Đã xoá'); }
    catch (e) { toast.error(e?.data?.message); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">🎟️ Quản lý mã giảm giá</h1>
          <p className="text-pink-100/80 text-sm mt-1">{coupons.length} mã giảm giá trong hệ thống</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3 h-fit">
          <h2 className="font-bold text-base flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs bg-gradient-to-br ${editing ? 'from-amber-400 to-orange-500' : 'from-pink-400 to-rose-600'}`}>
              {editing ? '✏' : '+'}
            </span>
            {editing ? 'Sửa' : 'Tạo'} mã giảm giá
          </h2>

          <div><label className="label">Mã *</label><input className="input uppercase font-mono" {...register('code', { required: true })} /></div>
          <div><label className="label">Mô tả</label><input className="input" {...register('description')} /></div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Loại giảm giá</label>
              <select className="input" {...register('discountType')}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </div>
            <div><label className="label">Giá trị *</label><input type="number" className="input" {...register('discountValue', { required: true })} /></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Giảm tối đa</label><input type="number" className="input" {...register('maxDiscount')} /></div>
            <div><label className="label">Đơn tối thiểu</label><input type="number" className="input" {...register('minOrderAmount')} /></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Từ ngày</label><input type="date" className="input" {...register('validFrom')} /></div>
            <div><label className="label">Đến ngày</label><input type="date" className="input" {...register('validTo')} /></div>
          </div>

          <div><label className="label">Số lượt tối đa (0 = không giới hạn)</label><input type="number" className="input" {...register('maxUses')} /></div>

          <label className="flex items-center gap-2.5 text-sm cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-200">
            <input type="checkbox" className="w-4 h-4 accent-pink-500" {...register('isActive')} />
            <span className="font-medium">Đang kích hoạt</span>
          </label>

          <button className="btn-primary w-full">{editing ? '💾 Cập nhật' : '✚ Tạo mới'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); reset(); }} className="btn-outline w-full">Huỷ</button>}
        </form>

        {/* Coupon list */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? <Spinner className="py-12" /> : coupons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <p className="text-4xl mb-2">🎟️</p>
              <p className="text-gray-500 font-medium">Chưa có mã giảm giá nào</p>
            </div>
          ) : coupons.map((c) => (
            <div key={c._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-mono font-black text-xl text-pink-600 tracking-wider">{c.code}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {c.isActive ? '✅ Hoạt động' : '⏸ Tắt'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.discountType === 'percent' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                      {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `–${formatCurrency(c.discountValue)}`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {c.maxDiscount > 0 && <p>Giảm tối đa: <span className="font-semibold text-gray-700">{formatCurrency(c.maxDiscount)}</span></p>}
                    {c.minOrderAmount > 0 && <p>Đơn tối thiểu: <span className="font-semibold text-gray-700">{formatCurrency(c.minOrderAmount)}</span></p>}
                    {(c.validFrom || c.validTo) && (
                      <p>🗓 {c.validFrom && formatDate(c.validFrom)}{c.validTo && ` → ${formatDate(c.validTo)}`}</p>
                    )}
                    <p>Đã dùng: <span className="font-semibold text-gray-700">{c.usedCount}</span> / {c.maxUses || '∞'}</p>
                    {c.description && <p className="text-gray-600 mt-1">{c.description}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => onEdit(c)} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition">✏️ Sửa</button>
                  <button onClick={() => onDelete(c._id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition">🗑 Xoá</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

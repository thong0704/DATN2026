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
import { useAuth } from '../../hooks/useAuth';
import { useListHotelsQuery } from '../../features/hotels/hotelsApi';

export default function CouponManagement() {
  const { user, isAdmin } = useAuth();
  const { data: hotelsData } = useListHotelsQuery({ limit: 100 });
  const hotels = hotelsData?.data?.hotels || [];
  const { data, isLoading, refetch } = useListMyCouponsQuery();
  const [create] = useCreateCouponMutation();
  const [update] = useUpdateCouponMutation();
  const [del] = useDeleteCouponMutation();
  const coupons = data?.data?.coupons || [];
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
      targetHotel: c.hotels?.[0]?._id || c.hotels?.[0] || '',
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
      hotels: form.targetHotel ? [form.targetHotel] : [],
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
      {}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h1 className="text-2xl font-serif-display font-medium text-primary">Quản lý mã giảm giá</h1>
        <p className="text-slate-400 text-xs mt-1 font-light">{coupons.length} mã giảm giá trong hệ thống</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4 h-fit">
          <h2 className="font-serif-display font-medium text-lg text-primary flex items-center gap-2 mb-2">
            <span className="w-1.5 h-6 bg-accent rounded-full" />
            {editing ? 'Sửa' : 'Tạo'} mã giảm giá
          </h2>

          <div>
            <label className="label">Mã *</label>
            <input className="input uppercase font-mono" {...register('code', { required: 'Vui lòng nhập mã giảm giá' })} />
            {errors.code && <p className="text-red-600 text-xs mt-1">{errors.code.message}</p>}
          </div>
          <div><label className="label">Mô tả</label><input className="input" {...register('description')} /></div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Loại giảm giá</label>
              <select className="input" {...register('discountType')}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định</option>
              </select>
            </div>
            <div>
              <label className="label">Giá trị *</label>
              <input type="number" className="input" {...register('discountValue', { required: 'Vui lòng nhập giá trị giảm giá' })} />
              {errors.discountValue && <p className="text-red-600 text-xs mt-1">{errors.discountValue.message}</p>}
            </div>
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

          {isAdmin ? (
            <div>
              <label className="label">Áp dụng cho khách sạn</label>
              <select className="input text-sm" {...register('targetHotel')}>
                <option value="">— Tất cả khách sạn (Toàn hệ thống) —</option>
                {hotels.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>
          ) : (
            user?.assignedHotel && (
              <div className="p-3 bg-slate-50 border border-border rounded-xl text-xs text-slate-500 font-semibold">
                🏨 Chỉ áp dụng cho: {user.assignedHotel.name}
              </div>
            )
          )}

          <label className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer p-3.5 rounded-xl bg-[#FAF9F6] border border-border">
            <input type="checkbox" className="w-4 h-4 accent-accent" {...register('isActive')} />
            <span>Đang kích hoạt</span>
          </label>

          <button className="btn-primary w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); reset(); }} className="btn-outline w-full mt-2">Huỷ</button>}
        </form>

        <div className="lg:col-span-2 space-y-3">
          {isLoading ? <Spinner className="py-12" /> : coupons.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-16 text-center shadow-sm">
              <p className="text-slate-400 font-medium">Chưa có mã giảm giá nào</p>
            </div>
          ) : coupons.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="font-mono font-bold text-xl text-accent tracking-wider">{c.code}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${c.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {c.isActive ? 'Hoạt động' : 'Tắt'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${c.discountType === 'percent' ? 'bg-[#FDF6E2] text-accent border-accent/25' : 'bg-slate-50 text-slate-700 border-border'}`}>
                      {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `–${formatCurrency(c.discountValue)}`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1 font-light">
                    {c.hotels && c.hotels.length > 0 && (
                      <p>Áp dụng tại: <span className="font-semibold text-indigo-650">🏨 {c.hotels.map(h => h.name || 'Khách sạn').join(', ')}</span></p>
                    )}
                    {(!c.hotels || c.hotels.length === 0) && (
                      <p>Áp dụng tại: <span className="font-semibold text-emerald-600">🌍 Toàn hệ thống (Tất cả KS)</span></p>
                    )}
                    {c.maxDiscount > 0 && <p>Giảm tối đa: <span className="font-semibold text-slate-700">{formatCurrency(c.maxDiscount)}</span></p>}
                    {c.minOrderAmount > 0 && <p>Đơn tối thiểu: <span className="font-semibold text-slate-700">{formatCurrency(c.minOrderAmount)}</span></p>}
                    {(c.validFrom || c.validTo) && (
                      <p>Hạn dùng: {c.validFrom && formatDate(c.validFrom)}{c.validTo && ` → ${formatDate(c.validTo)}`}</p>
                    )}
                    <p>Đã dùng: <span className="font-semibold text-slate-700">{c.usedCount}</span> / {c.maxUses || '∞'}</p>
                    {c.description && <p className="text-slate-600 mt-2 font-normal">{c.description}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => onEdit(c)} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition">Sửa</button>
                  <button onClick={() => onDelete(c._id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-650 rounded-lg border border-red-200 hover:bg-red-100 transition">Xoá</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

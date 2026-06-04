import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useListHotelsQuery,
  useCreateHotelMutation,
  useUpdateHotelMutation,
  useDeleteHotelMutation,
  useUploadHotelImagesMutation,
} from '../../features/hotels/hotelsApi';
import Spinner from '../../components/Spinner';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

export default function HotelManagement() {
  const { isAdmin, isManager } = useAuth();
  const { data, isLoading, refetch } = useListHotelsQuery({ limit: 100 });
  const [create, { isLoading: creating }] = useCreateHotelMutation();
  const [update] = useUpdateHotelMutation();
  const [del] = useDeleteHotelMutation();
  const [uploadImages] = useUploadHotelImagesMutation();
  const [editing, setEditing] = useState(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const hotels = data?.data?.hotels || [];
  const { register, handleSubmit, reset } = useForm();

  const onFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const uploadFilesTo = async (hotelId, fileList) => {
    if (!fileList?.length) return;
    const fd = new FormData();
    fileList.forEach((f) => fd.append('images', f));
    await uploadImages({ id: hotelId, formData: fd }).unwrap();
  };

  const onSave = async (form) => {
    const payload = {
      ...form,
      stars: Number(form.stars),
      basePrice: Number(form.basePrice || 0),
      address: { city: form.city, street: form.street, country: 'Vietnam' },
    };
    delete payload.city; delete payload.street;
    try {
      let hotelId;
      if (editing) {
        await update({ id: editing._id, ...payload }).unwrap();
        hotelId = editing._id;
      } else {
        const res = await create(payload).unwrap();
        hotelId = res?.data?.hotel?._id;
      }
      if (files.length && hotelId) await uploadFilesTo(hotelId, files);
      toast.success('Da luu');
      reset(); setEditing(null); setFiles([]); setPreviews([]); refetch();
    } catch (e) { toast.error(e?.data?.message || 'Loi'); }
  };

  const onDelete = async (id) => {
    if (!confirm('Xoa khach san nay?')) return;
    try { await del(id).unwrap(); toast.success('Da xoa'); }
    catch (e) { toast.error(e?.data?.message); }
  };

  const onUpload = async (id, fl) => {
    if (!fl?.length) return;
    try { await uploadFilesTo(id, Array.from(fl)); toast.success('Da upload'); refetch(); }
    catch (e) { toast.error(e?.data?.message); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">🏨 Quản lý khách sạn</h1>
          <p className="text-amber-100/80 text-sm mt-1">{hotels.length} khách sạn trong hệ thống</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        {isManager && (
        <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3 h-fit">
          <h2 className="font-bold text-base">{editing ? 'Sửa' : 'Tạo'} khách sạn</h2>
          <div><label className="label">Tên khách sạn *</label><input className="input" defaultValue={editing?.name} {...register('name', { required: true })} /></div>
          <div><label className="label">Mô tả</label><textarea className="input" rows={3} defaultValue={editing?.description} {...register('description')} /></div>
          <div><label className="label">Số sao</label>
            <select className="input" defaultValue={editing?.stars || 3} {...register('stars')}>
              {[1,2,3,4,5].map((s) => <option key={s} value={s}>{s} sao</option>)}
            </select>
          </div>
          <div><label className="label">Giá cơ bản (VND/đêm)</label><input type="number" className="input" defaultValue={editing?.basePrice} {...register('basePrice')} /></div>
          <div><label className="label">Thành phố *</label><input className="input" defaultValue={editing?.address?.city} {...register('city', { required: true })} /></div>
          <div><label className="label">Địa chỉ</label><input className="input" defaultValue={editing?.address?.street} {...register('street')} /></div>
          <div>
            <label className="label">Hình ảnh khách sạn</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-amber-400 transition cursor-pointer bg-gray-50/50">
              <input type="file" multiple accept="image/*" id="hotel-images" hidden onChange={onFilesChange} />
              <label htmlFor="hotel-images" className="cursor-pointer">
                <p className="text-sm text-gray-500">{files.length ? `Đã chọn ${files.length} ảnh` : 'Bấm để chọn ảnh'}</p>
              </label>
            </div>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button type="button" onClick={() => { setFiles(files.filter((_, idx) => idx !== i)); setPreviews(previews.filter((_, idx) => idx !== i)); }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">x</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {(isAdmin || editing) && (
            <button className="btn-primary w-full" disabled={creating}>{editing ? 'Cập nhật' : 'Tạo mới'}</button>
          )}
          {editing && <button type="button" onClick={() => { setEditing(null); reset(); setFiles([]); setPreviews([]); }} className="btn-outline w-full">Huỷ</button>}
        </form>
        )}
        <div className={`${isManager ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3`}>
          {isLoading ? <Spinner className="py-12" /> : hotels.map((h) => (
            <div key={h._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <img src={h.images?.[0]?.url || 'https://picsum.photos/100'} className="w-20 h-16 object-cover rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{h.name}</p>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">{h.address?.city}</span>
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">{h.stars} ⭐</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{formatCurrency(h.basePrice)}/đêm</span>
                  <span className="text-xs text-gray-400">{h.images?.length || 0} ảnh</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {isManager && (
                  <label className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition">
                    📷 Thêm ảnh<input type="file" multiple accept="image/*" hidden onChange={(e) => onUpload(h._id, e.target.files)} />
                  </label>
                )}
                {isManager && (
                  <button onClick={() => setEditing(h)} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition">✏️ Sửa</button>
                )}
                {isAdmin && (
                  <button onClick={() => onDelete(h._id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition">🗑️ Xoá</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
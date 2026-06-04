import { useState } from 'react';
import { toast } from 'react-toastify';
import { useListHotelsQuery } from '../../features/hotels/hotelsApi';
import {
  useRoomsByHotelQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useUpdateRoomStatusMutation,
  useUploadRoomImagesMutation,
} from '../../features/rooms/roomsApi';
import { useForm } from 'react-hook-form';
import { formatCurrency, statusColor, tStatus, tRoomType } from '../../utils/format';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../hooks/useAuth';

const ROOM_TYPES = ['basic', 'standard', 'vip'];
const STATUSES = ['available', 'occupied', 'cleaning', 'maintenance'];
const BED_TYPES = ['Single', 'Twin', 'Double', 'Queen', 'King'];
const AMENITIES_OPTIONS = [
  'WiFi', 'Điều hòa', 'TV', 'Tủ lạnh', 'Két sắt', 'Máy sấy tóc',
  'Bồn tắm', 'Ban công', 'Bếp nhỏ', 'Máy giặt', 'Bàn làm việc', 'Minibar',
];

export default function RoomManagement() {
  const { isAdmin, isManager } = useAuth();
  const { data: hotelsData } = useListHotelsQuery({ limit: 100 });
  const hotels = hotelsData?.data?.hotels || [];
  const [hotelId, setHotelId] = useState('');

  const { data, isLoading, refetch } = useRoomsByHotelQuery(hotelId, { skip: !hotelId });
  const rooms = data?.data?.rooms || [];
  const [create] = useCreateRoomMutation();
  const [update] = useUpdateRoomMutation();
  const [del] = useDeleteRoomMutation();
  const [updateStatus] = useUpdateRoomStatusMutation();
  const [uploadImages] = useUploadRoomImagesMutation();
  const [editing, setEditing] = useState(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const { register, handleSubmit, reset } = useForm();

  const onFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const uploadFilesTo = async (roomId, fileList) => {
    if (!fileList?.length) return;
    const fd = new FormData();
    fileList.forEach((f) => fd.append('images', f));
    await uploadImages({ id: roomId, formData: fd }).unwrap();
  };

  const onSave = async (form) => {
    const payload = {
      hotel: hotelId,
      roomNumber: form.roomNumber,
      type: form.type,
      pricePerNight: Number(form.pricePerNight),
      capacity: { adults: Number(form.adults), children: Number(form.children || 0) },
      bedType: form.bedType,
      size: Number(form.size || 25),
      amenities,
    };
    try {
      let roomId;
      if (editing) {
        await update({ id: editing._id, ...payload }).unwrap();
        roomId = editing._id;
      } else {
        const res = await create(payload).unwrap();
        roomId = res?.data?.room?._id;
      }
      if (files.length && roomId) {
        await uploadFilesTo(roomId, files);
      }
      toast.success('Đã lưu');
      reset();
      setEditing(null);
      setFiles([]);
      setPreviews([]);
      setAmenities([]);
      refetch();
    } catch (e) { toast.error(e?.data?.message || 'Lỗi'); }
  };

  const onUploadExisting = async (id, fl) => {
    if (!fl?.length) return;
    try { await uploadFilesTo(id, Array.from(fl)); toast.success('Đã upload'); refetch(); }
    catch (e) { toast.error(e?.data?.message); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">🛏️ Quản lý phòng</h1>
          <p className="text-violet-100/80 text-sm mt-1">Quản lý phòng theo khách sạn</p>
        </div>
        <div className="bg-white border-x border-b border-gray-200 px-6 py-4">
          <select
            className="input max-w-md"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
          >
            <option value="">— Chọn khách sạn —</option>
            {hotels.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      {hotelId && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          {isManager && (
          <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3 h-fit">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs bg-gradient-to-br ${editing ? 'from-violet-400 to-purple-600' : 'from-emerald-400 to-teal-500'}`}>
                {editing ? '✏' : '+'}
              </span>
              {editing ? 'Sửa' : 'Tạo'} phòng
            </h2>

            <div><label className="label">Số phòng</label><input className="input" defaultValue={editing?.roomNumber} {...register('roomNumber', { required: true })} /></div>
            <div>
              <label className="label">Loại phòng</label>
              <select className="input" defaultValue={editing?.type || 'standard'} {...register('type')}>
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{tRoomType(t)}</option>)}
              </select>
            </div>
            <div><label className="label">Giá / đêm (VND)</label><input type="number" className="input" defaultValue={editing?.pricePerNight} {...register('pricePerNight', { required: true })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Người lớn</label><input type="number" className="input" defaultValue={editing?.capacity?.adults ?? 2} min={1} {...register('adults')} /></div>
              <div><label className="label">Trẻ em</label><input type="number" className="input" defaultValue={editing?.capacity?.children ?? 0} min={0} {...register('children')} /></div>
            </div>
            <div>
              <label className="label">Loại giường</label>
              <select className="input" defaultValue={editing?.bedType || 'Double'} {...register('bedType')}>
                {BED_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div><label className="label">Diện tích (m²)</label><input type="number" className="input" defaultValue={editing?.size || 25} {...register('size')} /></div>
            <div>
              <label className="label">Tiện ích</label>
              <div className="grid grid-cols-2 gap-1 border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                {AMENITIES_OPTIONS.map((a) => (
                  <label key={a} className="flex items-center gap-1.5 text-xs cursor-pointer py-0.5">
                    <input type="checkbox" className="rounded" checked={amenities.includes(a)}
                      onChange={(e) => { if (e.target.checked) setAmenities([...amenities, a]); else setAmenities(amenities.filter((x) => x !== a)); }} />
                    {a}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Hình ảnh phòng</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-violet-400 transition cursor-pointer bg-gray-50/50">
                <input type="file" multiple accept="image/*" id="room-images" hidden onChange={onFilesChange} />
                <label htmlFor="room-images" className="cursor-pointer text-sm text-gray-500">
                  {files.length ? `Đã chọn ${files.length} ảnh` : '📷 Bấm để chọn ảnh'}
                </label>
              </div>
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={() => { setFiles(files.filter((_, idx) => idx !== i)); setPreviews(previews.filter((_, idx) => idx !== i)); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {(isAdmin || editing) && (
              <button className="btn-primary w-full">{editing ? '💾 Cập nhật' : '✚ Tạo mới'}</button>
            )}
            {editing && <button type="button" onClick={() => { setEditing(null); reset(); setFiles([]); setPreviews([]); setAmenities([]); }} className="btn-outline w-full">Huỷ</button>}
          </form>
          )}

          {/* Room cards */}
          <div className={`${isManager ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {isLoading ? <Spinner className="py-12" /> : (
              <div className="grid sm:grid-cols-2 gap-4">
                {rooms.map((r) => (
                  <div key={r._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {r.images?.[0]?.url ? (
                      <img src={r.images[0].url} alt="" className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center text-4xl">🛏️</div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-900">{tRoomType(r.type)} · #{r.roomNumber}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          r.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          r.status === 'occupied' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{tStatus(r.status)}</span>
                      </div>
                      <p className="text-sm text-gray-500">{r.bedType} · {r.size}m² · {r.images?.length || 0} ảnh</p>
                      <p className="font-bold text-violet-700 mt-1 text-base">{formatCurrency(r.pricePerNight)}<span className="text-xs font-normal text-gray-400">/đêm</span></p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:border-violet-400 focus:ring-1 focus:ring-violet-100 focus:outline-none flex-1 min-w-[100px]"
                          value={r.status}
                          onChange={(e) => updateStatus({ id: r._id, status: e.target.value }).unwrap().then(() => refetch())}>
                          {STATUSES.map((s) => <option key={s} value={s}>{tStatus(s)}</option>)}
                        </select>
                        {isManager && (
                          <label className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition">
                            + Ảnh<input type="file" multiple accept="image/*" hidden onChange={(e) => onUploadExisting(r._id, e.target.files)} />
                          </label>
                        )}
                        {isManager && (
                          <button onClick={() => { setEditing(r); setAmenities(r.amenities || []); }} className="text-xs px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition">Sửa</button>
                        )}
                        {isAdmin && (
                          <button onClick={() => confirm('Xoá?') && del(r._id).unwrap().then(refetch)} className="text-xs px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition">Xoá</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <div className="sm:col-span-2 py-16 text-center bg-white rounded-2xl border border-gray-200">
                    <p className="text-4xl mb-2">🛏️</p>
                    <p className="text-gray-500 font-medium">Chưa có phòng nào</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

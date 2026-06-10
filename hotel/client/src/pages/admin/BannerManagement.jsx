import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useListBannersAdminQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useUploadBannerImageMutation,
} from '../../features/content/contentApi';

const TYPES = [
  { id: 'hero', label: 'Ảnh Poster (Hero Banner)' },
  { id: 'destination', label: 'Điểm đến phổ biến' },
];

export default function BannerManagement() {
  const { data, isLoading } = useListBannersAdminQuery();
  const banners = data?.data?.banners || [];
  const [createBanner] = useCreateBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();
  const [uploadImage] = useUploadBannerImageMutation();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: 'destination', title: '', subtitle: '', image: '', link: '', order: 0, isActive: true });
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState('');

  const resetForm = () => {
    setForm({ type: 'destination', title: '', subtitle: '', image: '', link: '', order: 0, isActive: true });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (banner) => {
    setEditing(banner._id);
    setForm({
      type: banner.type,
      title: banner.title,
      subtitle: banner.subtitle || '',
      image: banner.image,
      link: banner.link || '',
      order: banner.order || 0,
      isActive: banner.isActive,
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await uploadImage(fd).unwrap();
      setForm((f) => ({ ...f, image: res.data.url }));
      toast.success('Upload ảnh thành công');
    } catch {
      toast.error('Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateBanner({ id: editing, ...form }).unwrap();
        toast.success('Đã cập nhật');
      } else {
        await createBanner(form).unwrap();
        toast.success('Đã tạo mới');
      }
      resetForm();
    } catch (err) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Xoá banner này?')) return;
    try {
      await deleteBanner(id).unwrap();
      toast.success('Đã xoá');
    } catch {
      toast.error('Xoá thất bại');
    }
  };

  const toggleActive = async (banner) => {
    try {
      await updateBanner({ id: banner._id, isActive: !banner.isActive }).unwrap();
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const filtered = filterType ? banners.filter((b) => b.type === filterType) : banners;

  if (isLoading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif-display font-medium text-primary">Quản lý Banner & Điểm đến</h1>
          <p className="text-slate-400 text-xs mt-1 font-light">{banners.length} banner · {banners.filter((b) => b.isActive).length} đang hiển thị</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            {[{ id: '', label: 'Tất cả' }, ...TYPES.map((t) => ({ id: t.id, label: t.id === 'hero' ? 'Poster' : 'Điểm đến' }))].map((btn) => (
              <button key={btn.id} onClick={() => setFilterType(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${filterType === btn.id ? 'bg-[#FDF6E2] text-accent border border-accent/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {btn.label}
              </button>
            ))}
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-accent text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5">
            + Thêm mới
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <h2 className="font-serif-display font-medium text-lg text-primary mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-accent rounded-full" />
            {editing ? 'Chỉnh sửa' : 'Thêm mới'} Banner
          </h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Loại</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div><label className="label">Thứ tự hiển thị</label><input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
              <div className="md:col-span-2"><label className="label">Tiêu đề *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="md:col-span-2"><label className="label">Phụ đề</label><input className="input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div className="md:col-span-2">
                <label className="label">Ảnh</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="URL ảnh hoặc upload" required />
                    <div className="mt-2 border-2 border-dashed border-border rounded-xl p-4 hover:border-accent transition">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs text-slate-500 w-full" disabled={uploading} />
                      {uploading && <p className="text-xs text-accent mt-1">Đang upload...</p>}
                    </div>
                  </div>
                  {form.image && <img src={form.image} alt="preview" className="w-28 h-20 object-cover rounded-xl border border-border flex-shrink-0" />}
                </div>
              </div>
              <div><label className="label">Link (tuỳ chọn)</label><input className="input" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/hotels?city=Hà Nội" /></div>
              <div className="flex items-center">
                <label className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer p-3.5 rounded-xl bg-[#FAF9F6] border border-border w-full">
                  <input type="checkbox" className="w-4 h-4 accent-accent" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <span>Hiển thị</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
              <button type="button" onClick={resetForm} className="btn-outline">Huỷ</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-border p-16 text-center shadow-sm">
            <p className="text-slate-400 font-medium">Chưa có banner nào</p>
          </div>
        )}
        {filtered.map((b) => (
          <div key={b._id} className={`bg-white rounded-xl border border-border shadow-sm p-5 flex gap-5 items-center hover:shadow-md transition-shadow ${!b.isActive ? 'opacity-60' : ''}`}>
            <img src={b.image} alt={b.title} className="w-32 h-24 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${b.type === 'hero' ? 'bg-[#FDF6E2] text-accent border-accent/25' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  {b.type === 'hero' ? 'Poster' : 'Điểm đến'}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-mono">Thứ tự {b.order}</span>
                {!b.isActive && <span className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-200 px-2.5 py-0.5 rounded-full">Ẩn</span>}
              </div>
              <h3 className="font-bold text-primary text-base truncate">{b.title}</h3>
              {b.subtitle && <p className="text-sm text-slate-400 font-light truncate mt-0.5">{b.subtitle}</p>}
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={() => toggleActive(b)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${b.isActive ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                {b.isActive ? 'Ẩn' : 'Hiện'}
              </button>
              <button onClick={() => openEdit(b)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition">Sửa</button>
              <button onClick={() => onDelete(b._id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-650 rounded-lg border border-red-200 hover:bg-red-100 transition">Xoá</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  useListAllArticlesAdminQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useUploadArticleCoverMutation,
} from '../../features/content/contentApi';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/format';

export default function ArticleManagement() {
  const { data, isLoading, refetch } = useListAllArticlesAdminQuery();
  const [create] = useCreateArticleMutation();
  const [update] = useUpdateArticleMutation();
  const [del] = useDeleteArticleMutation();
  const [uploadCover, { isLoading: uploading }] = useUploadArticleCoverMutation();
  const articles = data?.data?.articles || [];
  const [editing, setEditing] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');
  const { register, handleSubmit, reset } = useForm();

  const startEdit = (a) => {
    setEditing(a);
    setCoverUrl(a.coverImage || '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setCoverUrl('');
    reset();
  };

  const onPickCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('cover', file);
    try {
      const res = await uploadCover(fd).unwrap();
      setCoverUrl(res.data.url);
      toast.success('Đã tải ảnh');
    } catch (err) {
      toast.error(err?.data?.message || 'Không thể tải ảnh');
    }
  };

  const onSave = async (form) => {
    const payload = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      coverImage: coverUrl,
      isPublished: form.isPublished !== false,
    };
    try {
      if (editing) await update({ id: editing._id, ...payload }).unwrap();
      else await create(payload).unwrap();
      toast.success('Đã lưu');
      reset();
      setEditing(null);
      setCoverUrl('');
      refetch();
    } catch (e) { toast.error(e?.data?.message || 'Lỗi'); }
  };

  const onDelete = async (id) => {
    if (!confirm('Xoá bài viết này?')) return;
    try { await del(id).unwrap(); toast.success('Đã xoá'); }
    catch (e) { toast.error(e?.data?.message); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h1 className="text-2xl font-serif-display font-medium text-primary">Quản lý bài viết</h1>
        <p className="text-slate-400 text-xs mt-1 font-light">{articles.length} bài viết · {articles.filter((a) => a.isPublished).length} đã đăng</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4 h-fit">
          <h2 className="font-serif-display font-medium text-lg text-primary flex items-center gap-2 mb-2">
            <span className="w-1.5 h-6 bg-accent rounded-full" />
            {editing ? 'Sửa' : 'Tạo'} bài viết
          </h2>

          <div><label className="label">Tiêu đề *</label><input className="input" defaultValue={editing?.title} {...register('title', { required: true })} /></div>
          <div><label className="label">Tóm tắt</label><textarea rows={2} className="input" defaultValue={editing?.summary} {...register('summary')} /></div>
          <div><label className="label">Nội dung</label><textarea rows={8} className="input" defaultValue={editing?.content} {...register('content')} /></div>

          <div>
            <label className="label">Ảnh bìa</label>
            {coverUrl && <img src={coverUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-2 border border-border" />}
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-accent transition">
              <input type="file" accept="image/*" onChange={onPickCover} disabled={uploading} className="text-xs text-slate-500 w-full" />
              {uploading && <p className="text-xs text-accent mt-1">Đang tải...</p>}
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer p-3.5 rounded-xl bg-[#FAF9F6] border border-border">
            <input type="checkbox" className="w-4 h-4 accent-accent" defaultChecked={editing?.isPublished !== false} {...register('isPublished')} />
            <span>Đăng công khai</span>
          </label>

          <button className="btn-primary w-full">{editing ? '💾 Cập nhật' : '✚ Tạo mới'}</button>
          {editing && <button type="button" onClick={cancelEdit} className="btn-outline w-full">Huỷ</button>}
        </form>

        {/* Article list */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? <Spinner className="py-12" /> : articles.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-16 text-center shadow-sm">
              <p className="text-slate-400 font-medium">Chưa có bài viết nào</p>
            </div>
          ) : articles.map((a) => (
            <div key={a._id} className="bg-white rounded-xl border border-border shadow-sm p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
              {a.coverImage ? (
                <img src={a.coverImage} alt="" className="w-24 h-20 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-24 h-20 bg-[#FAF9F6] border border-border rounded-lg flex items-center justify-center text-xs text-slate-400 font-bold flex-shrink-0 uppercase">Không có ảnh</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-primary text-base truncate">{a.title}</p>
                <p className="text-sm text-slate-500 font-light line-clamp-1 mt-1">{a.summary}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400 font-light">{formatDate(a.createdAt)}</span>
                  <span className="text-xs bg-[#FAF9F6] text-slate-500 px-2 py-0.5 rounded border border-border">Lượt xem: {a.views || 0}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${a.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {a.isPublished ? 'Công khai' : 'Ẩn'}
                </span>
                <button onClick={() => startEdit(a)} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition">Sửa</button>
                <button onClick={() => onDelete(a._id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition">Xoá</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


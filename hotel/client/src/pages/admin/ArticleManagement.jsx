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
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">📝 Quản lý bài viết</h1>
          <p className="text-orange-100/80 text-sm mt-1">{articles.length} bài viết · {articles.filter((a) => a.isPublished).length} đã đăng</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit(onSave)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3 h-fit">
          <h2 className="font-bold text-base flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs bg-gradient-to-br ${editing ? 'from-amber-400 to-orange-500' : 'from-orange-400 to-yellow-500'}`}>
              {editing ? '✏' : '+'}
            </span>
            {editing ? 'Sửa' : 'Tạo'} bài viết
          </h2>

          <div><label className="label">Tiêu đề *</label><input className="input" defaultValue={editing?.title} {...register('title', { required: true })} /></div>
          <div><label className="label">Tóm tắt</label><textarea rows={2} className="input" defaultValue={editing?.summary} {...register('summary')} /></div>
          <div><label className="label">Nội dung</label><textarea rows={8} className="input" defaultValue={editing?.content} {...register('content')} /></div>

          <div>
            <label className="label">Ảnh bìa</label>
            {coverUrl && <img src={coverUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-2 border border-gray-200" />}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-orange-400 transition">
              <input type="file" accept="image/*" onChange={onPickCover} disabled={uploading} className="text-sm text-gray-500 w-full" />
              {uploading && <p className="text-xs text-orange-500 mt-1">Đang tải...</p>}
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-200">
            <input type="checkbox" className="w-4 h-4 accent-orange-500" defaultChecked={editing?.isPublished !== false} {...register('isPublished')} />
            <span className="font-medium">Đăng công khai</span>
          </label>

          <button className="btn-primary w-full">{editing ? '💾 Cập nhật' : '✚ Tạo mới'}</button>
          {editing && <button type="button" onClick={cancelEdit} className="btn-outline w-full">Huỷ</button>}
        </form>

        {/* Article list */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? <Spinner className="py-12" /> : articles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <p className="text-4xl mb-2">📰</p>
              <p className="text-gray-500 font-medium">Chưa có bài viết nào</p>
            </div>
          ) : articles.map((a) => (
            <div key={a._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              {a.coverImage ? (
                <img src={a.coverImage} alt="" className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
              ) : (
                <div className="w-24 h-20 bg-orange-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📄</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{a.title}</p>
                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{a.summary}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">👁 {a.views || 0}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${a.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {a.isPublished ? '🌍 Công khai' : '🔒 Ẩn'}
                </span>
                <button onClick={() => startEdit(a)} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition">✏️ Sửa</button>
                <button onClick={() => onDelete(a._id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition">🗑 Xoá</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


import { useState } from 'react';
import { toast } from 'react-toastify';
import { useListUsersQuery, useUpdateUserRoleMutation, useUpdateUserMutation, useCreateUserMutation } from '../../features/admin/adminApi';
import { useDebounce } from '../../hooks/useDebounce';
import Spinner from '../../components/Spinner';
import { tRole } from '../../utils/format';

const ROLES = ['customer', 'staff', 'manager', 'admin'];

export default function UserManagement() {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 400);
  const { data, isLoading, refetch } = useListUsersQuery({ q: debounced || undefined });
  const [updateRole] = useUpdateUserRoleMutation();
  const [updateUser] = useUpdateUserMutation();
  const [createUser] = useCreateUserMutation();
  const users = data?.data?.users || [];

  const [editingUser, setEditingUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });

  const onChangeRole = async (id, role) => {
    try { await updateRole({ id, role }).unwrap(); toast.success('Đã cập nhật'); refetch(); }
    catch (e) { toast.error(e?.data?.message); }
  };
  const onToggleBlock = async (id, isBlocked) => {
    try { await updateRole({ id, isBlocked: !isBlocked }).unwrap(); refetch(); }
    catch (e) { toast.error(e?.data?.message); }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setShowCreateForm(false);
    setForm({ name: user.name, email: user.email, phone: user.phone || '', password: '', role: user.role });
  };

  const openCreate = () => {
    setEditingUser(null);
    setShowCreateForm(true);
    setForm({ name: '', email: '', phone: '', password: '', role: 'customer' });
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    const body = { name: form.name, email: form.email, phone: form.phone, role: form.role };
    if (form.password) body.password = form.password;
    try {
      await updateUser({ id: editingUser._id, ...body }).unwrap();
      toast.success('Đã cập nhật người dùng');
      setEditingUser(null);
      refetch();
    } catch (err) { toast.error(err?.data?.message || 'Lỗi'); }
  };

  const onSaveCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return toast.error('Tên, email và mật khẩu là bắt buộc');
    }
    try {
      await createUser({ name: form.name, email: form.email, password: form.password, phone: form.phone, role: form.role }).unwrap();
      toast.success('Đã tạo người dùng');
      setShowCreateForm(false);
      setForm({ name: '', email: '', phone: '', password: '', role: 'customer' });
      refetch();
    } catch (err) { toast.error(err?.data?.message || 'Lỗi'); }
  };

  return (
    <div className="space-y-6">
      {}
      {}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif-display font-medium text-primary">Quản lý người dùng</h1>
          <p className="text-slate-400 text-xs mt-1 font-light">{users.length} người dùng trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input className="input max-w-xs" placeholder="Tìm tên / email..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={openCreate} className="btn-accent text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5">
            + Tạo người dùng
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {(showCreateForm || editingUser) && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <h2 className="font-serif-display font-medium text-lg text-primary mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-accent rounded-full" />
            {editingUser ? 'Sửa người dùng' : 'Tạo người dùng mới'}
          </h2>
          <form onSubmit={editingUser ? onSaveEdit : onSaveCreate} className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <div><label className="label">Tên *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><label className="label">Số điện thoại</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div>
              <label className="label">{editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}</label>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} {...(!editingUser && { required: true, minLength: 6 })} />
            </div>
            <div>
              <label className="label">Vai trò</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{tRole(r)}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary px-5">💾 Lưu</button>
              <button type="button" onClick={() => { setEditingUser(null); setShowCreateForm(false); }} className="btn-outline px-5">Huỷ</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {isLoading ? <Spinner className="py-12" /> : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-border text-primary">
                  <th className="p-3.5 text-left font-bold text-xs uppercase tracking-wider">Người dùng</th>
                  <th className="p-3.5 text-left font-bold text-xs uppercase tracking-wider">Email</th>
                  <th className="p-3.5 text-left font-bold text-xs uppercase tracking-wider">Vai trò</th>
                  <th className="p-3.5 text-left font-bold text-xs uppercase tracking-wider">Trạng thái</th>
                  <th className="p-3.5 text-left font-bold text-xs uppercase tracking-wider">Điểm</th>
                  <th className="p-3.5 text-center font-bold text-xs uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id} className={`border-b border-border hover:bg-[#FAF9F6]/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]/20'}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-accent">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{u.email}</td>
                    <td className="p-3">
                      <select className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-accent" value={u.role}
                        onChange={(e) => onChangeRole(u._id, e.target.value)}>
                        {ROLES.map((r) => <option key={r} value={r}>{tRole(r)}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${u.isBlocked ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {u.isBlocked ? 'Bị chặn' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">⭐ {u.loyaltyPoints || 0}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(u)} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition">Sửa</button>
                        <button onClick={() => onToggleBlock(u._id, u.isBlocked)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition ${u.isBlocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
                          {u.isBlocked ? 'Bỏ chặn' : 'Chặn'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


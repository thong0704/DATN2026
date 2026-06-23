import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useListContactsQuery,
  useMarkContactReadMutation,
  useDeleteContactMutation,
} from '../../features/content/contentApi';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/format';
import SupportChat from './SupportChat';

export default function ContactInbox() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const { data, isLoading, refetch } = useListContactsQuery();
  const [markRead] = useMarkContactReadMutation();
  const [del] = useDeleteContactMutation();
  const messages = data?.data?.messages || [];

  const onDelete = async (id) => {
    if (!confirm('Xoá tin nhắn này?')) return;
    try { await del(id).unwrap(); toast.success('Đã xoá'); refetch(); }
    catch (e) { toast.error(e?.data?.message); }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-serif-display font-medium text-primary">Liên hệ & Hỗ trợ</h1>
          <p className="text-slate-400 text-xs mt-1 font-light">
            Quản lý hộp thư góp ý và hỗ trợ trực tuyến khách hàng
          </p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
              activeTab === 'inbox' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
            }`}
          >
            ✉️ Thư liên hệ ({messages.filter((m) => !m.isRead).length})
          </button>
          <button
            onClick={() => {
              setChatSearchQuery('');
              setActiveTab('chat');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
              activeTab === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
            }`}
          >
            💬 Chat trực tiếp
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <SupportChat initialSearch={chatSearchQuery} />
      ) : isLoading ? (
        <Spinner className="py-12" />
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center shadow-sm">
          <p className="text-slate-400 font-medium">Hộp thư trống</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m._id} className={`bg-white rounded-xl border shadow-sm p-5 transition-shadow hover:shadow-md ${!m.isRead ? 'border-l-4 border-l-accent border-r-border border-y-border' : 'border-border'}`}>
              <div className="flex flex-wrap justify-between items-start gap-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 bg-accent">
                    {m.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-primary">{m.name} <span className="text-slate-400 font-normal font-light">· {m.email}</span></p>
                    {m.phone && <p className="text-xs text-slate-400 font-light mt-0.5">SĐT: {m.phone}</p>}
                    {m.subject && <p className="text-xs font-bold uppercase tracking-wider text-accent mt-1">{m.subject}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">{formatDateTime(m.createdAt)}</p>
                  {!m.isRead && (
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FDF6E2] text-accent border border-accent/25">Mới</span>
                  )}
                </div>
              </div>
              <p className="mt-3 text-slate-600 whitespace-pre-wrap text-sm leading-relaxed bg-[#FAF9F6] border border-border rounded-lg p-4 font-light text-left">{m.message}</p>
              <div className="flex gap-2 mt-4">
                {!m.isRead && (
                  <button onClick={() => markRead(m._id).unwrap().then(refetch)}
                    className="text-xs px-3 py-1.5 bg-accent/10 text-accent rounded-lg border border-accent/20 hover:bg-accent hover:text-white transition">
                    Đã đọc
                  </button>
                )}
                <button
                  onClick={() => {
                    setChatSearchQuery(m.email || m.name);
                    setActiveTab('chat');
                  }}
                  className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-205 hover:bg-emerald-100 transition"
                >
                  Chat trực tiếp
                </button>
                <a href={`mailto:${m.email}`}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                  Trả lời email
                </a>
                <button onClick={() => onDelete(m._id)}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-650 rounded-lg border border-red-200 hover:bg-red-100 transition">
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


import { toast } from 'react-toastify';
import {
  useListContactsQuery,
  useMarkContactReadMutation,
  useDeleteContactMutation,
} from '../../features/content/contentApi';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/format';

export default function ContactInbox() {
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
      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 px-6 py-5">
          <h1 className="text-2xl font-bold text-white">📬 Hộp thư liên hệ</h1>
          <p className="text-teal-100/80 text-sm mt-1">
            {messages.filter((m) => !m.isRead).length} tin chưa đọc · {messages.length} tổng cộng
          </p>
        </div>
      </div>

      {isLoading ? <Spinner className="py-12" /> : messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-gray-500 font-medium">Hộp thư trống</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m._id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md ${!m.isRead ? 'border-l-4 border-l-teal-500 border-r-gray-200 border-y-gray-200' : 'border-gray-200'}`}>
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 bg-teal-500">
                    {m.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{m.name} <span className="text-gray-400 font-normal">· {m.email}</span></p>
                    {m.phone && <p className="text-sm text-gray-500">📞 {m.phone}</p>}
                    {m.subject && <p className="text-sm font-semibold text-teal-700 mt-0.5">{m.subject}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{formatDateTime(m.createdAt)}</p>
                  {!m.isRead && (
                    <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">🔵 Mới</span>
                  )}
                </div>
              </div>
              <p className="mt-3 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50/70 rounded-xl p-3">{m.message}</p>
              <div className="flex gap-2 mt-3">
                {!m.isRead && (
                  <button onClick={() => markRead(m._id).unwrap().then(refetch)}
                    className="text-xs px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 hover:bg-teal-100 transition">
                    ✓ Đánh dấu đã đọc
                  </button>
                )}
                <a href={`mailto:${m.email}`}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                  ✉ Trả lời email
                </a>
                <button onClick={() => onDelete(m._id)}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition">
                  🗑 Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


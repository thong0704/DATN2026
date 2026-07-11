import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { useGetChatSessionsQuery, useLazyGetChatMessagesQuery } from '../../features/chat/chatApi';
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function SupportChat({ initialSearch = '' }) {
  const { token } = useAuth();
  const { data: sessionsData, isLoading: sessionsLoading, refetch: refetchSessions } = useGetChatSessionsQuery();
  const [triggerGetMessages] = useLazyGetChatMessagesQuery();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  
  useEffect(() => {
    if (sessionsData?.data?.sessions) {
      setSessions(sessionsData.data.sessions);
    }
  }, [sessionsData]);

  
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[admin chat socket] connected', socket.id);
    });

    
    socket.on('staff_receive_message', ({ room, message }) => {
      
      setSessions((prev) => {
        const index = prev.findIndex((s) => s.room === room);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            senderName: message.senderName,
            senderType: message.senderType,
          };
          
          const item = updated.splice(index, 1)[0];
          return [item, ...updated];
        } else {
          
          refetchSessions();
          return prev;
        }
      });

      
      if (selectedSession && selectedSession.room === room) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    });

    socket.on('new_chat_message', (message) => {
      
      if (selectedSession) {
        const targetRoom = selectedSession.room;
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, selectedSession, refetchSessions]);

  
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const queryParam = selectedSession.type === 'user'
          ? { userId: selectedSession.id }
          : { guestId: selectedSession.id };
        const res = await triggerGetMessages(queryParam).unwrap();
        if (res.status === 'success') {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        toast.error('Lỗi khi tải lịch sử nhắn tin');
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();

    
    if (socketRef.current) {
      socketRef.current.emit('staff_join_chat', { room: selectedSession.room });
    }
  }, [selectedSession, token]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedSession || !socketRef.current) return;

    socketRef.current.emit('staff_send_chat_message', {
      room: selectedSession.room,
      content: input.trim(),
    });
    setInput('');
  };

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex rounded-xl border border-border bg-surface overflow-hidden h-[72vh] shadow-sm">
      {}
      <div className="w-[300px] border-r border-border flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-border bg-surface text-left">
          <h2 className="text-md font-serif-display font-bold text-primary mb-3">💬 Trò chuyện hỗ trợ</h2>
          <input
            type="text"
            className="input !py-1.5 !px-3 text-xs w-full bg-surface"
            placeholder="Tìm khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {sessionsLoading && <Spinner className="py-8" />}
          {!sessionsLoading && filteredSessions.length === 0 && (
            <div className="text-center text-xs text-slate-400 py-12">Chưa có hội thoại nào</div>
          )}
          {filteredSessions.map((s) => {
            const isSelected = selectedSession && selectedSession.room === s.room;
            const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <button
                key={s.room}
                onClick={() => setSelectedSession(s)}
                className={`w-full p-4 flex items-start gap-3 transition-colors text-left ${
                  isSelected ? 'bg-[#FDF6E2] border-l-4 border-accent' : 'bg-surface hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm ${
                  s.type === 'user' ? 'bg-emerald-600' : 'bg-slate-500'
                }`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold text-xs text-primary truncate">{s.name}</span>
                    <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                      {new Date(s.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {s.hotel && (
                    <span className="inline-block text-[9px] text-indigo-600 font-semibold mb-1">
                      🏨 {s.hotel.name}
                    </span>
                  )}
                  <p className="text-[11px] text-slate-500 truncate">
                    {s.senderType === 'staff' ? 'Bạn: ' : ''}{s.lastMessage}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col bg-surface">
        {selectedSession ? (
          <>
            {}
            <div className="p-4 border-b border-border flex items-center justify-between text-left shadow-sm bg-surface">
              <div>
                <h3 className="font-bold text-sm text-primary">{selectedSession.name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedSession.type === 'user' ? `Thành viên - ID: ${selectedSession.id}` : 'Khách vãng lai'}
                </p>
              </div>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {messagesLoading ? (
                <Spinner className="py-12" />
              ) : (
                messages.map((m) => {
                  const isMe = m.senderType === 'staff';
                  return (
                    <div key={m._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-400 mb-0.5 px-1">{m.senderName}</span>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-150 rounded-tl-none'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                        {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {}
            <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3 items-center bg-surface">
              <input
                type="text"
                className="flex-1 input !py-2 !px-4 text-xs bg-slate-50 border-0 focus:ring-1 focus:ring-emerald-500 rounded-xl"
                placeholder="Nhập nội dung trả lời..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="btn-primary !py-2 !px-5 text-xs rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                Gửi phản hồi
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/20">
            <svg className="w-16 h-16 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-light">Chọn một cuộc trò chuyện từ danh sách để bắt đầu hỗ trợ khách hàng</p>
          </div>
        )}
      </div>
    </div>
  );
}

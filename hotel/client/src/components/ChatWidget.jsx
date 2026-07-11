import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { useGetChatMessagesQuery } from '../features/chat/chatApi';
import { useListHotelsQuery } from '../features/hotels/hotelsApi';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, token } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const { data: hotelsData } = useListHotelsQuery({ limit: 100 });
  const hotels = hotelsData?.data?.hotels || [];
  
  const [guestId] = useState(() => {
    let id = localStorage.getItem('chat_guest_id');
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('chat_guest_id', id);
    }
    return id;
  });

  const queryParams = {
    ...(isAuthenticated ? { userId: user?._id } : { guestId }),
    ...(selectedHotelId ? { hotel: selectedHotelId } : {}),
  };
  
  const { data: initialData, refetch } = useGetChatMessagesQuery(queryParams, {
    skip: !open,
  });

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialData?.data?.messages) {
      setMessages(initialData.data.messages);
    }
  }, [initialData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    const handleOpenChat = () => {
      setOpen(true);
    };
    window.addEventListener('open_chat_widget', handleOpenChat);
    return () => {
      window.removeEventListener('open_chat_widget', handleOpenChat);
    };
  }, [refetch]);

  useEffect(() => {
    if (!open) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: isAuthenticated ? { token } : undefined,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[chat socket] connected', socket.id);
      socket.emit('join_chat', { guestId });
    });

    socket.on('new_chat_message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [open, isAuthenticated, token, guestId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.emit('send_chat_message', {
      content: input.trim(),
      guestId,
      senderName: user ? user.name : 'Khách vãng lai',
      hotelId: selectedHotelId || undefined,
    });
    setInput('');
  };

  return (
    <>
      {}
      {open && (
        <div className="chatbot-enter fixed bottom-6 right-6 z-50 flex h-[500px] max-h-[75vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl text-left">
          {}
          <div className="relative overflow-hidden border-b border-white/30 bg-gradient-to-r from-emerald-800 to-teal-600 px-4 py-4 text-white">
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-lg" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-bold tracking-wide">Hỗ trợ trực tuyến 2T Hotel</p>
                <p className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  Lễ tân đang trực tuyến
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg bg-white/20 px-2 py-1 text-xs font-medium transition hover:bg-white/30"
              >
                Đóng
              </button>
            </div>
          </div>

          {/* Hotel selector */}
          <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Khách sạn:</span>
            <select
              value={selectedHotelId}
              onChange={(e) => {
                setSelectedHotelId(e.target.value);
              }}
              className="bg-white border border-slate-200 rounded-lg text-[11px] font-medium py-1 px-1.5 flex-1 focus:outline-none text-slate-700"
            >
              <option value="">— Chọn chi nhánh cần liên hệ —</option>
              {hotels.map((h) => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="text-center text-xs text-slate-400 py-12">
                Chưa có tin nhắn. Hãy gửi lời chào đến Lễ tân nhé!
              </div>
            )}
            {messages.map((m) => {
              const isMe = m.senderType === 'customer';
              return (
                <div key={m._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-400 mb-0.5 px-1">{m.senderName}</span>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                    {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3 flex gap-2 items-center">
            <input
              type="text"
              className="flex-1 bg-slate-50 border-0 outline-none focus:ring-0 text-xs px-3 py-2 rounded-xl text-slate-800 placeholder-slate-400"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="h-8 w-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center disabled:opacity-50 transition-colors shadow-md"
            >
              <svg className="h-4 w-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

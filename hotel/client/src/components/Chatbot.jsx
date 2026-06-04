import { useState, useRef, useEffect } from 'react';
import { useSendMessageMutation } from '../features/chatbot/chatbotApi';

const QUICK_PROMPTS = [
  'Tim khach san Ha Noi duoi 1 trieu',
  'Phong cho 2 nguoi lon + 1 tre em o Da Nang',
  'Khach san co ho boi va buffet sang',
];

function nowTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Xin chao! Toi la tro ly 2T Hotel. Ban can tim phong theo dia diem, ngan sach hay tien ich nao?',
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', content: text, time: nowTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const history = messages
        .slice(1)
        .map((m) => ({ role: m.role === 'bot' ? 'model' : 'user', content: m.content }));

      const res = await sendMessage({ message: text, history }).unwrap();
      setMessages((prev) => [...prev, { role: 'bot', content: res.data.reply, time: nowTime() }]);
    } catch (err) {
      const errorMessage = err?.data?.message || 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.';
      setMessages((prev) => [...prev, { role: 'bot', content: errorMessage, time: nowTime() }]);
    }
  };

  const sendQuickPrompt = (text) => {
    if (isLoading) return;
    setInput(text);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`chatbot-fab fixed bottom-5 right-5 z-50 h-14 w-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open ? 'bg-rose-500 hover:bg-rose-600' : 'bg-gradient-to-br from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600'
        } text-white`}
        title="Chat với AI"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="chatbot-enter fixed bottom-24 right-4 z-50 flex h-[560px] max-h-[78vh] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:right-6">
          <div className="relative overflow-hidden border-b border-white/30 bg-gradient-to-r from-slate-900 via-brand-700 to-cyan-600 px-4 py-4 text-white">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-cyan-200/20 blur-xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold tracking-wide">Tro ly dat phong 2T Hotel</p>
                <p className="flex items-center gap-2 text-xs text-white/80">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
                  Dang hoat dong
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg bg-white/20 px-2 py-1 text-xs font-medium transition hover:bg-white/30"
                type="button"
              >
                Dong
              </button>
            </div>

            <div className="relative mt-3 flex gap-2 overflow-x-auto pb-1">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendQuickPrompt(prompt)}
                  className="shrink-0 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="chatbot-scroll flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-cyan-50/40 p-4">
            {messages.map((msg, i) => (
              <div key={`${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[84%]">
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      msg.role === 'user'
                        ? 'rounded-br-md bg-gradient-to-r from-brand-600 to-cyan-600 text-white'
                        : 'rounded-bl-md border border-slate-100 bg-white text-slate-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className={`mt-1 text-[11px] ${msg.role === 'user' ? 'text-right text-slate-400' : 'text-slate-400'}`}>
                    {msg.time || nowTime()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-100 bg-white/90 p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhap nhu cau cua ban..."
              className="flex-1 bg-transparent px-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 text-white transition hover:from-brand-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">Tra loi dua tren du lieu thuc te tu he thong 2T Hotel</p>
          </form>
        </div>
      )}
    </>
  );
}

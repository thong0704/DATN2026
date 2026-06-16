import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useSubmitContactMutation } from '../features/content/contentApi';

export default function ContactPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [submit, { isLoading }] = useSubmitContactMutation();

  const onSend = async (form) => {
    try {
      const res = await submit(form).unwrap();
      toast.success(res.message || 'Đã gửi liên hệ');
      reset();
    } catch (e) {
      toast.error(e?.data?.message || 'Gửi thất bại');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-2">Liên hệ với chúng tôi</h1>
      <p className="text-gray-600 mb-8">Có câu hỏi hoặc cần hỗ trợ? Hãy gửi tin nhắn — chúng tôi sẽ phản hồi sớm nhất.</p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="card p-5">
            <div className="text-2xl">📞</div>
            <p className="font-semibold mt-2">Hotline</p>
            <p className="text-gray-600">1900 1234</p>
          </div>
          <div className="card p-5">
            <div className="text-2xl">✉️</div>
            <p className="font-semibold mt-2">Email</p>
            <p className="text-gray-600">support@hotelbooking.vn</p>
          </div>
          <div className="card p-5">
            <div className="text-2xl">📍</div>
            <p className="font-semibold mt-2">Địa chỉ</p>
            <p className="text-gray-600">123 Nguyễn Huệ, Quận 1, TP.HCM</p>
          </div>
          <div 
            onClick={() => window.dispatchEvent(new CustomEvent('open_chat_widget'))}
            className="card p-5 cursor-pointer border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all duration-300 group"
          >
            <div className="text-2xl group-hover:scale-110 transition-transform duration-300">💬</div>
            <p className="font-semibold mt-2 text-accent">Chat trực tiếp</p>
            <p className="text-gray-650 text-xs mt-1">Trò chuyện trực tiếp với lễ tân 24/7</p>
            <span className="text-accent text-[11px] font-bold mt-3 inline-block group-hover:translate-x-1 transition-transform">Bắt đầu chat →</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSend)} className="card p-6 md:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Họ tên *</label>
              <input className="input" {...register('name', { required: 'Bắt buộc' })} />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" {...register('email', { required: 'Bắt buộc' })} />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Số điện thoại</label>
              <input className="input" {...register('phone')} />
            </div>
            <div>
              <label className="label">Tiêu đề</label>
              <input className="input" {...register('subject')} />
            </div>
          </div>
          <div>
            <label className="label">Nội dung *</label>
            <textarea rows={5} className="input" {...register('message', { required: 'Bắt buộc' })} />
            {errors.message && <p className="text-red-600 text-xs mt-1">{errors.message.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Đang gửi...' : 'Gửi liên hệ'}
          </button>
        </form>
      </div>
    </div>
  );
}

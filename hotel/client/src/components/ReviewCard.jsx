import { useState } from 'react';
import { formatDate } from '../utils/format';

export default function ReviewCard({ review }) {
  const [activeImage, setActiveImage] = useState(null);

  return (
    <div className="card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 bg-white border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-brand-500/15">
          {review.user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{review.user?.name || 'Khách'}</p>
          <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
        </div>
        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          ★ {review.rating}
        </span>
      </div>
      {review.title && <h4 className="mt-3 font-bold text-gray-950 text-base">{review.title}</h4>}
      <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{review.comment}</p>

      {/* Hình ảnh thực tế từ khách hàng */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {review.images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setActiveImage(img)}
              className="w-20 h-20 rounded-xl overflow-hidden border border-gray-150 cursor-zoom-in hover:opacity-85 transition-opacity bg-slate-50 flex-shrink-0"
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {review.response?.text && (
        <div className="mt-4 pl-4 border-l-4 border-brand-500 bg-slate-50/70 p-3.5 rounded-2xl">
          <p className="text-xs text-brand-700 font-bold uppercase tracking-wider">Phản hồi từ khách sạn</p>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{review.response.text}</p>
        </div>
      )}

      {/* Lightbox phóng to ảnh */}
      {activeImage && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={activeImage}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setActiveImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-3xl font-light"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

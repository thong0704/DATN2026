import { formatDate } from '../utils/format';

export default function ReviewCard({ review }) {
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
      {review.response?.text && (
        <div className="mt-4 pl-4 border-l-4 border-brand-500 bg-slate-50/70 p-3.5 rounded-2xl">
          <p className="text-xs text-brand-700 font-bold uppercase tracking-wider">Phản hồi từ khách sạn</p>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{review.response.text}</p>
        </div>
      )}
    </div>
  );
}

import { formatDate } from '../utils/format';

export default function ReviewCard({ review }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold">
          {review.user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <p className="font-medium">{review.user?.name || 'Khách'}</p>
          <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
        </div>
        <span className="text-amber-500 font-medium">★ {review.rating}</span>
      </div>
      {review.title && <h4 className="mt-3 font-semibold">{review.title}</h4>}
      <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
      {review.response?.text && (
        <div className="mt-3 pl-4 border-l-2 border-brand-300 bg-brand-50/40 p-3 rounded">
          <p className="text-xs text-brand-700 font-medium">Phản hồi từ khách sạn</p>
          <p className="text-sm text-gray-700 mt-1">{review.response.text}</p>
        </div>
      )}
    </div>
  );
}

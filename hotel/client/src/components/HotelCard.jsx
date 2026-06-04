import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

export default function HotelCard({ hotel }) {
  const img = hotel.images?.[0]?.url || `https://picsum.photos/seed/${hotel._id}/600/400`;
  return (
    <Link
      to={`/hotels/${hotel.slug}`}
      className="group overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={img}
          alt={hotel.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {hotel.avgRating > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-brand-700 shadow-md backdrop-blur-sm">
            ★ {hotel.avgRating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 line-clamp-1">{hotel.name}</h3>
          <span className="ml-2 flex-shrink-0 text-xs text-amber-500">{'★'.repeat(hotel.stars || 0)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1.5 line-clamp-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {hotel.address?.city}, {hotel.address?.country}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Từ</span>
            <p className="font-bold text-lg text-brand-600">{formatCurrency(hotel.basePrice || 0)}</p>
          </div>
          <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 transition group-hover:bg-cyan-100">
            Xem phòng →
          </span>
        </div>
      </div>
    </Link>
  );
}

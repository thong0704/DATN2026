import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

export default function HotelCard({ hotel }) {
  const img = hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';
  
  return (
    <Link
      to={`/hotels/${hotel.slug}`}
      className="card group flex flex-col h-full bg-white border border-border"
    >
      {/* Media Window */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={img}
          alt={hotel.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Rating Badge */}
        {hotel.avgRating > 0 && (
          <span className="absolute right-3.5 top-3.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold font-mono text-primary shadow-sm backdrop-blur-sm border border-border/40">
            ★ {hotel.avgRating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Info Content */}
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div>
          {/* Stars & Location Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] text-accent tracking-widest font-mono uppercase">
              {'★'.repeat(hotel.stars || 0)}
            </span>
            <p className="text-[11px] text-slate-400 font-light flex items-center gap-1">
              📍 {hotel.address?.city}
            </p>
          </div>

          {/* Heading */}
          <h3 className="font-serif-display font-medium text-lg text-primary group-hover:text-accent transition-colors duration-300 line-clamp-1">
            {hotel.name}
          </h3>
        </div>

        {/* Price & Action Row */}
        <div className="mt-6 flex items-end justify-between border-t border-border/40 pt-4">
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-0.5">Giá từ</span>
            <p className="font-mono font-semibold text-base text-primary">
              {formatCurrency(hotel.basePrice || 0)}
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent border-b border-transparent group-hover:border-accent transition-all duration-300">
            Khám phá →
          </span>
        </div>
      </div>
    </Link>
  );
}

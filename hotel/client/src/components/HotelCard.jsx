import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { useToggleWishlistMutation } from '../features/wishlist/wishlistApi';
import { toast } from 'react-toastify';

export default function HotelCard({ hotel }) {
  const img = hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';
  const { user, isAuthenticated } = useAuth();
  const [toggleWishlist] = useToggleWishlistMutation();

  const isFavorite = user?.wishlist?.includes(hotel._id);

  const handleFavoriteClick = async (e) => {
    e.preventDefault(); 
    if (!isAuthenticated) {
      return toast.info('Vui lòng đăng nhập để lưu khách sạn yêu thích');
    }
    try {
      await toggleWishlist(hotel._id).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Lỗi thao tác');
    }
  };
  
  return (
    <article className="card group flex flex-col h-full bg-white border border-border">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 flex-shrink-0">
        <Link to={`/hotels/${hotel.slug || hotel._id}`} className="block h-full w-full relative z-0">
          <img
            src={img}
            alt={hotel.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute left-3.5 top-3.5 z-20 p-2 rounded-full bg-white/95 text-slate-500 hover:text-red-500 shadow-md backdrop-blur-sm border border-border/20 transition-all hover:scale-110 active:scale-95"
          title={isFavorite ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
        >
          <svg
            className={`w-3.5 h-3.5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {hotel.avgRating > 0 && (
          <span className="absolute right-3.5 top-3.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold font-mono text-primary shadow-sm backdrop-blur-sm border border-border/40 z-10">
            ★ {hotel.avgRating.toFixed(1)}
          </span>
        )}
      </div>

      <Link to={`/hotels/${hotel.slug || hotel._id}`} className="p-6 flex flex-col flex-1 justify-between relative z-10">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] text-accent tracking-widest font-mono uppercase">
              {'★'.repeat(hotel.stars || 0)}
            </span>
            <p className="text-[11px] text-slate-400 font-light flex items-center gap-1">
              📍 {hotel.address?.city}
            </p>
          </div>

          <h3 className="font-serif-display font-medium text-lg text-primary group-hover:text-accent transition-colors duration-300 line-clamp-1">
            {hotel.name}
          </h3>
        </div>

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
      </Link>
    </article>
  );
}

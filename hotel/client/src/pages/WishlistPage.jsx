import { useGetWishlistQuery } from '../features/wishlist/wishlistApi';
import Spinner from '../components/Spinner';
import HotelCard from '../components/HotelCard';

export default function WishlistPage() {
  const { data, isLoading } = useGetWishlistQuery();
  const hotels = data?.data?.hotels || [];

  if (isLoading) return <Spinner className="py-16" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in-up">
      <div className="mb-8 border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Khách sạn yêu thích của bạn</h1>
        <p className="text-sm text-gray-550 mt-1.5 font-medium">Danh sách các khách sạn bạn đã lưu để tiện đặt phòng sau này</p>
      </div>

      {hotels.length === 0 ? (
        <div className="card p-16 text-center text-gray-500 border border-dashed border-gray-200 rounded-3xl">
          <span className="text-5xl block mb-3">❤️</span>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Danh sách yêu thích trống</h3>
          <p className="text-sm text-gray-500">Hãy duyệt qua danh sách khách sạn và thả tim khách sạn bạn ưng ý nhất nhé!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {hotels.map((h) => (
            <HotelCard key={h._id} hotel={h} />
          ))}
        </div>
      )}
    </div>
  );
}

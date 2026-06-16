import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useListHotelsQuery } from '../features/hotels/hotelsApi';
import Spinner from '../components/Spinner';
import { formatCurrency, tAmenity } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { useToggleWishlistMutation } from '../features/wishlist/wishlistApi';
import { toast } from 'react-toastify';

export default function HotelListPage() {
  const { user, isAuthenticated } = useAuth();
  const [toggleWishlist] = useToggleWishlistMutation();

  const handleFavoriteClick = async (hotelId) => {
    if (!isAuthenticated) {
      return toast.info('Vui lòng đăng nhập để lưu khách sạn yêu thích');
    }
    try {
      await toggleWishlist(hotelId).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Lỗi thao tác');
    }
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

  // Read from URL params
  const city = searchParams.get('city') || '';
  const checkIn = searchParams.get('checkIn') || today;
  const checkOut = searchParams.get('checkOut') || tomorrow;
  const adults = Number(searchParams.get('adults')) || 2;
  const children = Number(searchParams.get('children')) || 0;

  // Local search form state
  const [formCity, setFormCity] = useState(city);
  const [formCheckIn, setFormCheckIn] = useState(checkIn);
  const [formCheckOut, setFormCheckOut] = useState(checkOut);
  const [formAdults, setFormAdults] = useState(adults);
  const [formChildren, setFormChildren] = useState(children);

  const [sort, setSort] = useState('-avgRating');
  const [page, setPage] = useState(1);

  const queryArgs = useMemo(() => {
    const q = { page, limit: 12, sort };
    if (city) q.city = city;
    if (checkIn) q.checkIn = checkIn;
    if (checkOut) q.checkOut = checkOut;
    if (adults) q.adults = adults;
    if (children) q.children = children;
    return q;
  }, [city, checkIn, checkOut, adults, children, sort, page]);

  const { data, isLoading, isFetching } = useListHotelsQuery(queryArgs);
  const hotels = data?.data?.hotels || [];
  const meta = data?.meta;

  const onSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formCity) params.set('city', formCity);
    params.set('checkIn', formCheckIn);
    params.set('checkOut', formCheckOut);
    params.set('adults', formAdults);
    params.set('children', formChildren);
    setSearchParams(params);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Search Panel */}
        <aside className="lg:col-span-1">
          <form onSubmit={onSearch} className="card p-5 space-y-5 lg:sticky lg:top-20">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Tìm Khách Sạn Hoàn Hảo
            </h2>

            {/* Destination */}
            <div>
              <label className="label">Điểm đến</label>
              <input className="input" placeholder="Hà Nội, Đà Nẵng, ..." value={formCity} onChange={(e) => setFormCity(e.target.value)} />
            </div>

            {/* Dates */}
            <div>
              <label className="label flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Thời gian lưu trú
              </label>
              <div className="space-y-2 mt-1">
                <input type="date" className="input" value={formCheckIn} min={today} onChange={(e) => setFormCheckIn(e.target.value)} />
                <input type="date" className="input" value={formCheckOut} min={formCheckIn} onChange={(e) => setFormCheckOut(e.target.value)} />
              </div>
            </div>

            {/* Guest count */}
            <div>
              <label className="label flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Số lượng khách
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <span className="text-xs text-gray-500">Người lớn</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button type="button" onClick={() => setFormAdults(Math.max(1, formAdults - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-medium">−</button>
                    <span className="w-8 text-center font-semibold">{formAdults}</span>
                    <button type="button" onClick={() => setFormAdults(formAdults + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-medium">+</button>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Trẻ em</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button type="button" onClick={() => setFormChildren(Math.max(0, formChildren - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-medium">−</button>
                    <span className="w-8 text-center font-semibold">{formChildren}</span>
                    <button type="button" onClick={() => setFormChildren(formChildren + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-medium">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full py-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Tìm Khách Sạn
            </button>
          </form>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          {/* Results header */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <div>
              <h1 className="text-xl font-bold">
                Khách Sạn Có Sẵn {meta ? `(${meta.total})` : ''}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Từ {dayjs(checkIn).format('DD/MM/YYYY')} đến {dayjs(checkOut).format('DD/MM/YYYY')} • {adults} người lớn{children > 0 ? `, ${children} trẻ em` : ''}
                {city ? ` • ${city}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sắp xếp theo:</span>
              <select className="input max-w-[200px]" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="-avgRating">Đánh giá cao nhất</option>
                <option value="basePrice">Giá từ thấp đến cao</option>
                <option value="-basePrice">Giá từ cao đến thấp</option>
                <option value="-stars">Sao nhiều nhất</option>
              </select>
            </div>
          </div>

          {isFetching && <div className="text-sm text-brand-600 mb-2">Đang tìm kiếm...</div>}

          {isLoading ? (
            <Spinner className="py-16" />
          ) : hotels.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">Không tìm thấy khách sạn nào phù hợp.</div>
          ) : (
            <>
              <div className="space-y-4">
                {hotels.map((hotel) => {
                  const img = hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';
                  return (
                    <div key={hotel._id} className="card overflow-hidden flex flex-col md:flex-row group">
                      {/* Image */}
                      <div className="relative md:w-72 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                        <img src={img} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        
                        {/* Heart Favorite Button */}
                        <button
                          type="button"
                          onClick={() => handleFavoriteClick(hotel._id)}
                          className="absolute right-2.5 top-2.5 z-10 p-2 rounded-full bg-white/95 text-slate-500 hover:text-red-500 shadow-md backdrop-blur-sm border border-border/20 transition-all hover:scale-110 active:scale-95"
                          title={user?.wishlist?.includes(hotel._id) ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
                        >
                          <svg
                            className={`w-3.5 h-3.5 transition-colors ${user?.wishlist?.includes(hotel._id) ? 'fill-red-500 text-red-500' : 'text-slate-650'}`}
                            fill={user?.wishlist?.includes(hotel._id) ? 'currentColor' : 'none'}
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

                        {hotel.images?.length > 1 && (
                          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                            {hotel.images.length} ảnh
                          </span>
                        )}
                        {hotel.discount && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{hotel.discount}%
                          </span>
                        )}
                      </div>


                      {/* Details */}
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{hotel.name}</h3>
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {hotel.address?.city} • {'★'.repeat(hotel.stars || 0)}
                            {hotel.avgRating > 0 && <span className="ml-2 badge bg-brand-50 text-brand-700 text-xs">★ {hotel.avgRating.toFixed(1)}</span>}
                          </p>

                          {/* Amenities */}
                          {hotel.amenities?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-1">Dịch vụ đặc biệt:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {hotel.amenities.slice(0, 6).map((a) => (
                                  <span key={a} className="badge bg-blue-50 text-blue-700 border border-blue-200">{tAmenity(a)}</span>
                                ))}
                                {hotel.amenities.length > 6 && (
                                  <span className="badge bg-gray-100 text-gray-600">+{hotel.amenities.length - 6}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Price + Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div>
                            <span className="text-2xl font-bold text-brand-600">{formatCurrency(hotel.basePrice || 0)}</span>
                            <span className="text-sm text-gray-500 ml-1">/ đêm</span>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/hotels/${hotel.slug}`} className="btn-outline text-sm px-4 py-2">Chi Tiết</Link>
                            <Link to={`/hotels/${hotel.slug}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`} className="btn-primary text-sm px-4 py-2">Đặt Ngay</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {meta && meta.hasNext && (
                <div className="flex justify-center mt-8">
                  <button onClick={() => setPage((p) => p + 1)} className="btn-outline">Tải thêm</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

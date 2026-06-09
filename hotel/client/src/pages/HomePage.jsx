import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import dayjs from 'dayjs';
import HotelCard from '../components/HotelCard';
import Spinner from '../components/Spinner';
import { useListHotelsQuery } from '../features/hotels/hotelsApi';
import { useListPublicBannersQuery } from '../features/content/contentApi';

export default function HomePage() {
  const navigate = useNavigate();
  const { data, isLoading } = useListHotelsQuery({ limit: 8, sort: '-avgRating' });
  const hotels = data?.data?.hotels || [];
  const { data: bannerData } = useListPublicBannersQuery();
  const allBanners = bannerData?.data?.banners || [];
  const heroBanners = allBanners.filter((b) => b.type === 'hero');
  const destinations = allBanners.filter((b) => b.type === 'destination');

  const heroImage = heroBanners[0]?.image || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=80';
  const heroTitle = heroBanners[0]?.title || 'Resort biển tuyệt đẹp';
  const heroSubtitle = heroBanners[0]?.subtitle || 'Nghỉ dưỡng bên bờ biển xanh';

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const onSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    params.set('checkIn', checkIn);
    params.set('checkOut', checkOut);
    params.set('adults', adults);
    params.set('children', children);
    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[640px] items-center">
        {/* Background Image with Ken Burns Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/85 via-slate-900/40 to-cyan-900/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(0,0,0,0.5))]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-16 text-center text-white md:pb-24 md:pt-24">
          <div className="flex flex-col items-center">
            <span className="mb-6 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-200 backdrop-blur-md animate-fade-in-up animation-fill-both hover:bg-white/15 transition-all duration-300 shadow-sm">
              ✨ Trải nghiệm nghỉ dưỡng đẳng cấp
            </span>
            <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight md:text-6xl animate-fade-in-up delay-150 animation-fill-both">
              {heroTitle.includes('Resort biển') ? (
                <>
                  Resort Biển <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(251,191,36,0.2)]">Tuyệt Đẹp</span>
                </>
              ) : (
                heroTitle
              )}
            </h1>
            <p className="mx-auto mb-7 max-w-2xl text-lg text-slate-205 md:text-xl animate-fade-in-up delay-300 animation-fill-both">
              {heroSubtitle}
            </p>
            <div className="flex justify-center gap-1.5 animate-fade-in-up delay-450 animation-fill-both mb-10">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-6 h-6 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Search bar inside the flow, below the stars */}
            <div className="w-full max-w-5xl z-20 animate-fade-in-up delay-600 animation-fill-both">
              <form
                onSubmit={onSearch}
                className="rounded-3xl lg:rounded-full bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.15)] backdrop-blur-xl border border-white/60 p-2 md:p-3 transition-all duration-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
              >
                {/* Search fields in unified divider layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center divide-y lg:divide-y-0 lg:divide-x divide-slate-200/60">
                  
                  {/* Địa điểm */}
                  <div className="lg:col-span-4 px-5 py-2.5 hover:bg-slate-50/80 rounded-2xl lg:rounded-l-full transition-colors duration-200 group text-left">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span className="text-brand-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </span>
                      Địa điểm
                    </label>
                    <input
                      type="text"
                      className="w-full bg-transparent border-0 p-0 mt-0.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none"
                      placeholder="Bạn muốn đi đâu?"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      list="city-suggestions"
                    />
                    <datalist id="city-suggestions">
                      <option value="Hà Nội" />
                      <option value="Đà Nẵng" />
                      <option value="Nha Trang" />
                      <option value="Đà Lạt" />
                      <option value="Phú Quốc" />
                      <option value="Hồ Chí Minh" />
                      <option value="Hội An" />
                      <option value="Vũng Tàu" />
                    </datalist>
                  </div>

                  {/* Ngày nhận phòng */}
                  <div className="lg:col-span-2 px-5 py-2.5 hover:bg-slate-50/80 transition-colors duration-200 text-left">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span className="text-emerald-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </span>
                      Nhận phòng
                    </label>
                    <input
                      type="date"
                      className="w-full bg-transparent border-0 p-0 mt-0.5 text-sm font-semibold text-slate-800 focus:ring-0 focus:outline-none cursor-pointer"
                      value={checkIn}
                      min={today}
                      onChange={(e) => setCheckIn(e.target.value)}
                    />
                  </div>

                  {/* Ngày trả phòng */}
                  <div className="lg:col-span-2 px-5 py-2.5 hover:bg-slate-50/80 transition-colors duration-200 text-left">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span className="text-orange-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </span>
                      Trả phòng
                    </label>
                    <input
                      type="date"
                      className="w-full bg-transparent border-0 p-0 mt-0.5 text-sm font-semibold text-slate-800 focus:ring-0 focus:outline-none cursor-pointer"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>

                  {/* Khách & Button tìm kiếm */}
                  <div className="lg:col-span-4 pl-5 pr-2 py-2.5 flex items-center justify-between hover:bg-slate-50/80 lg:rounded-r-full transition-colors duration-200 text-left">
                    <div className="flex-1 min-w-0 pr-2">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span className="text-blue-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </span>
                        Số khách
                      </label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <select
                          className="bg-transparent border-0 p-0 text-sm font-semibold text-slate-800 focus:ring-0 focus:outline-none cursor-pointer"
                          value={adults}
                          onChange={(e) => setAdults(Number(e.target.value))}
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n} lớn</option>)}
                        </select>
                        <span className="text-slate-300 text-xs">|</span>
                        <select
                          className="bg-transparent border-0 p-0 text-sm font-semibold text-slate-500 focus:ring-0 focus:outline-none cursor-pointer"
                          value={children}
                          onChange={(e) => setChildren(Number(e.target.value))}
                        >
                          {[0,1,2,3,4,5].map((n) => <option key={n} value={n}>{n} trẻ</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Nút tìm kiếm dạng pill tròn cao cấp */}
                    <button
                      type="submit"
                      className="h-12 w-12 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
                      title="Tìm kiếm khách sạn"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                  </div>

                </div>
              </form>

              {/* Quick tags centered under search bar */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 drop-shadow-md">Phổ biến:</span>
                {['Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Đà Lạt'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setCity(tag)}
                    className="rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white transition-all duration-300 hover:border-white/60 hover:bg-white/20 hover:scale-105 active:scale-95 shadow-sm"
                  >
                    📍 {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Room list */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-16">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold uppercase tracking-wider mb-3">Khách sạn nổi bật</span>
          <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl">Danh sách khách sạn nổi bật</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-gray-500">Lựa chọn nhanh những khách sạn được đặt nhiều nhất hôm nay</p>
        </div>
        {isLoading ? (
          <Spinner className="py-12" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hotels.map((h) => <HotelCard key={h._id} hotel={h} />)}
          </div>
        )}
        <div className="text-center mt-10">
          <Link to="/hotels" className="btn-outline text-base">
            Xem tất cả khách sạn →
          </Link>
        </div>
      </section>

      {/* Destinations */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold uppercase tracking-wider mb-3">Khám phá</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Điểm đến phổ biến</h2>
          <p className="text-gray-500 mt-3 text-lg">Những địa điểm được yêu thích nhất</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(destinations.length > 0 ? destinations : [
            { _id: '1', title: 'Hà Nội', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80', link: '/hotels?city=Hà Nội' },
            { _id: '2', title: 'Đà Nẵng', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80', link: '/hotels?city=Đà Nẵng' },
            { _id: '3', title: 'Nha Trang', image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&q=80', link: '/hotels?city=Nha Trang' },
            { _id: '4', title: 'Đà Lạt', image: 'https://images.unsplash.com/photo-1555217851-6141535bd771?w=600&q=80', link: '/hotels?city=Đà Lạt' },
          ]).map((dest) => (
            <Link
              key={dest._id}
              to={dest.link || `/hotels?city=${encodeURIComponent(dest.title)}`}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-card hover:shadow-card-hover transition-all duration-500"
            >
              <img
                src={dest.image}
                alt={dest.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-xl drop-shadow-lg">{dest.title}</h3>
                <span className="text-white/80 text-sm flex items-center gap-1 mt-1">
                  Khám phá ngay →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-gradient-to-br from-cyan-50 via-white to-brand-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-semibold uppercase tracking-wider mb-3">Tại sao chọn chúng tôi</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Dịch vụ rõ ràng, trải nghiệm mượt mà</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '💎', t: 'Giá tốt nhất', d: 'Cam kết hoàn tiền nếu bạn tìm thấy giá rẻ hơn', color: 'from-purple-500 to-indigo-600' },
              { icon: '🔒', t: 'Đặt phòng an toàn', d: 'Thanh toán mã hóa, bảo mật tuyệt đối', color: 'from-emerald-500 to-teal-600' },
              { icon: '☎️', t: 'Hỗ trợ 24/7', d: 'Đội ngũ luôn sẵn sàng hỗ trợ bạn mọi lúc', color: 'from-orange-500 to-red-500' },
            ].map((x) => (
              <div key={x.t} className="card p-8 text-center group hover:-translate-y-2 transition-all duration-300">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${x.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {x.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">{x.t}</h3>
                <p className="text-gray-600">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

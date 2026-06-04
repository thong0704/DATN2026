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
      <section
        className="relative flex min-h-[640px] items-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/45 to-cyan-900/55" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_50%,rgba(0,0,0,0.4))]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-32 pt-16 text-center text-white md:pb-44 md:pt-24">
          <div className="animate-fade-in-up">
            <span className="mb-6 inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-md">
              ✨ Trải nghiệm nghỉ dưỡng đẳng cấp
            </span>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-6xl">
              {heroTitle}
            </h1>
            <p className="mx-auto mb-7 max-w-2xl text-lg text-slate-200 md:text-xl">
              {heroSubtitle}
            </p>
            <div className="flex justify-center gap-1 text-2xl text-amber-300">
              {'★★★★★'}
            </div>
          </div>
        </div>

        {/* Search bar overlapping hero bottom */}
        <div className="absolute -bottom-16 left-1/2 w-full max-w-5xl -translate-x-1/2 px-4">
          <form onSubmit={onSearch} className="surface p-6 md:p-8">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-800">
              <span className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              Tìm phòng khách sạn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="label flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Địa Điểm
                </label>
                <input type="text" className="input" placeholder="Hà Nội, Đà Nẵng, Nha Trang..." value={city} onChange={(e) => setCity(e.target.value)} list="city-suggestions" />
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
              <div>
                <label className="label flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Ngày Nhận Phòng
                </label>
                <input type="date" className="input" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} />
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Ngày Trả Phòng
                </label>
                <input type="date" className="input" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Người Lớn
                </label>
                <select className="input" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n} người</option>)}
                </select>
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Trẻ Em
                </label>
                <select className="input" value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                  {[0,1,2,3,4,5].map((n) => <option key={n} value={n}>{n} trẻ em</option>)}
                </select>
              </div>
              <div>
                <button type="submit" className="btn-primary w-full !py-3 text-base">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Tìm Phòng
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Room list */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-24">
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
            Xem tất cả phòng →
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

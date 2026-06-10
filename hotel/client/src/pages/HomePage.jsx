import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import HotelCard from '../components/HotelCard';
import Spinner from '../components/Spinner';
import { useListHotelsQuery } from '../features/hotels/hotelsApi';
import { useListPublicBannersQuery } from '../features/content/contentApi';

// Micro-interaction: Word Swapper for Hero headline
function WordSwapper({ words = ['kỷ niệm', 'di sản', 'kiệt tác'] }) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!words || words.length === 0) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setFade(true);
      }, 300); // matches opacity transition duration
    }, 2500);
    return () => clearInterval(interval);
  }, [words]);

  if (!words || words.length === 0) return null;

  return (
    <span className={`text-accent italic font-normal inline-block transition-all duration-300 ${fade ? 'opacity-100 blur-0 translate-y-0' : 'opacity-0 blur-[4px] translate-y-1'}`}>
      {words[index]}
    </span>
  );
}

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

  // Parse title to see if it has dynamic words separator "|"
  // Format: "Nơi những kỳ nghỉ trở thành | kỷ niệm, di sản, kiệt tác"
  const hasSwapper = heroTitle.includes('|');
  let displayTitle = heroTitle;
  let swapWords = ['kỷ niệm', 'di sản', 'kiệt tác'];

  if (hasSwapper) {
    const parts = heroTitle.split('|');
    displayTitle = parts[0].trim();
    swapWords = parts[1].split(',').map(w => w.trim()).filter(Boolean);
  }

  // Slideshow logic for Hero Archway Portal
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const fallbackSlides = [
    {
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=80',
      title: 'Bờ cát vàng & Sóng biển rì rào',
      subtitle: 'Elite Retreats'
    },
    {
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80',
      title: 'Hồ bơi vô cực bên sườn đồi',
      subtitle: 'Infinite Luxury'
    },
    {
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80',
      title: 'Không gian nghỉ dưỡng thượng lưu',
      subtitle: 'Exclusive Access'
    }
  ];

  const slides = heroBanners.length > 0 
    ? heroBanners.map(b => ({ image: b.image, title: b.subtitle || '2T Hotel', subtitle: b.title || 'Elite Retreats' }))
    : fallbackSlides;

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

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
    <div className="bg-surface-bg min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-12 md:pt-20 md:pb-16 overflow-hidden px-6">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Premium Copy */}
            <div className="lg:col-span-7 space-y-8 text-left z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent anim-load-eyebrow">
                <span>✦</span> Trải nghiệm nghỉ dưỡng tinh hoa
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-[1.08] tracking-tight text-primary font-serif-display anim-load-headline-1">
                {hasSwapper ? (
                  <>
                    {displayTitle} <br />
                    <WordSwapper words={swapWords} />
                  </>
                ) : heroTitle.includes('Resort biển') ? (
                  <>
                    Nơi những kỳ nghỉ <br />
                    trở thành <WordSwapper words={swapWords} />
                  </>
                ) : (
                  heroTitle
                )}
              </h1>
              
              <p className="max-w-xl text-base md:text-lg text-slate-500 leading-relaxed font-light anim-load-subheadline">
                {heroSubtitle || 'Đắm mình trong không gian thiết kế độc bản, dịch vụ may đo tinh tế và những điểm đến ngoạn mục của chuỗi khách sạn 2T Hotel.'}
              </p>

              {/* Trust/Stars indicator */}
              <div className="flex items-center gap-4 pt-2 anim-load-subheadline">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Tiêu chuẩn 5 sao quốc tế</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4 anim-load-cta">
                <Link to="/hotels" className="btn-accent rounded-full">
                  Đặt phòng ngay
                </Link>
                <a href="#featured" className="btn-outline rounded-full text-xs">
                  Tìm hiểu thêm
                </a>
              </div>
            </div>

            {/* Right Column: Signature Element - The Archway Portal */}
            <div className="lg:col-span-5 flex justify-center z-10 anim-load-visual">
              <div className="relative w-full max-w-[380px] md:max-w-[420px] aspect-[4/5] rounded-t-full overflow-hidden shadow-[0_24px_50px_rgba(15,26,44,0.12)] border border-accent/15 group">
                {/* Background Images with Cross-Fade */}
                <div className="absolute inset-0 overflow-hidden">
                  {slides.map((slide, idx) => (
                    <div
                      key={idx}
                      className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                        idx === activeHeroIndex ? 'opacity-100 scale-105 animate-ken-burns' : 'opacity-0 scale-100'
                      }`}
                      style={{ backgroundImage: `url(${slide.image})` }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
                <div className="absolute inset-0 border border-white/10 rounded-t-full pointer-events-none" />
                
                {/* Monogram floating inside the arch */}
                <div className="absolute bottom-8 left-8 right-8 text-white text-left z-20">
                  {slides.map((slide, idx) => (
                    <div
                      key={idx}
                      className={`transition-all duration-700 absolute bottom-0 left-0 right-0 ${
                        idx === activeHeroIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent block mb-1">
                        {slide.subtitle}
                      </span>
                      <h4 className="text-xl font-medium tracking-wide font-serif-display leading-tight">
                        {slide.title}
                      </h4>
                    </div>
                  ))}
                  {/* Invisible spacer to reserve height for absolute elements above */}
                  <div className="opacity-0 pointer-events-none">
                    <span className="text-[10px] block mb-1">Spacer</span>
                    <h4 className="text-xl">Spacer Layout Height</h4>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Floating Luxury Search Bar Section */}
      <section className="relative z-30 px-6 anim-load-cta">
        <div className="mx-auto max-w-5xl">
          <form
            onSubmit={onSearch}
            className="glass rounded-3xl lg:rounded-full p-3 md:p-4 transition-all duration-300 hover:shadow-[0_24px_60px_rgba(15,26,44,0.15)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center divide-y lg:divide-y-0 lg:divide-x divide-border">
              
              {/* Địa điểm */}
              <div className="lg:col-span-4 px-6 py-3 hover:bg-slate-50/50 rounded-2xl lg:rounded-l-full transition-colors duration-300 text-left">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="text-accent">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </span>
                  Địa điểm
                </label>
                <input
                  type="text"
                  className="w-full bg-transparent border-0 p-0 mt-1 text-sm font-semibold text-primary placeholder-slate-400 focus:ring-0 focus:outline-none"
                  placeholder="Bạn muốn nghỉ dưỡng ở đâu?"
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
              <div className="lg:col-span-2 px-6 py-3 hover:bg-slate-50/50 transition-colors duration-300 text-left">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="text-accent">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  Nhận phòng
                </label>
                <input
                  type="date"
                  className="w-full bg-transparent border-0 p-0 mt-1 text-sm font-semibold text-primary focus:ring-0 focus:outline-none cursor-pointer"
                  value={checkIn}
                  min={today}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              {/* Ngày trả phòng */}
              <div className="lg:col-span-2 px-6 py-3 hover:bg-slate-50/50 transition-colors duration-300 text-left">
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="text-accent">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  Trả phòng
                </label>
                <input
                  type="date"
                  className="w-full bg-transparent border-0 p-0 mt-1 text-sm font-semibold text-primary focus:ring-0 focus:outline-none cursor-pointer"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              {/* Khách & Submit */}
              <div className="lg:col-span-4 pl-6 pr-3 py-3 flex items-center justify-between hover:bg-slate-50/50 lg:rounded-r-full transition-colors duration-300 text-left">
                <div className="flex-1 min-w-0 pr-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="text-accent">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    Số khách
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      className="bg-transparent border-0 p-0 text-sm font-semibold text-primary focus:ring-0 focus:outline-none cursor-pointer"
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n} lớn</option>)}
                    </select>
                    <span className="text-border">|</span>
                    <select
                      className="bg-transparent border-0 p-0 text-sm font-semibold text-slate-450 focus:ring-0 focus:outline-none cursor-pointer"
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} trẻ</option>)}
                    </select>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="h-12 w-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20 hover:bg-primary transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0"
                  title="Tìm kiếm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>

            </div>
          </form>

          {/* Quick tags */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Điểm đến gợi ý:</span>
            {['Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Đà Lạt'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setCity(tag)}
                className="rounded-full border border-border bg-white hover:border-accent hover:text-accent px-4 py-1.5 text-xs font-medium text-slate-600 transition-all duration-300 shadow-sm"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section id="featured" className="mx-auto max-w-7xl px-6 pt-12 md:pt-16 pb-12 md:pb-16 reveal">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Khách sạn nổi bật</span>
          <h2 className="text-4xl md:text-5xl font-light text-primary font-serif-display line-draw">Danh sách tuyển chọn</h2>
          <p className="mx-auto mt-6 max-w-lg text-sm text-slate-400 font-light">Những kiệt tác kiến trúc nghỉ dưỡng sang trọng thuộc chuỗi 2T Hotel</p>
        </div>
        
        {isLoading ? (
          <Spinner className="py-16" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 reveal-stagger">
            {hotels.map((h) => <HotelCard key={h._id} hotel={h} />)}
          </div>
        )}
        
        <div className="text-center mt-16">
          <Link to="/hotels" className="btn-outline rounded-full px-8 py-3.5 text-xs font-semibold">
            Xem tất cả khách sạn
          </Link>
        </div>
      </section>

      {/* Popular Destinations Section */}
      <section className="mx-auto max-w-7xl px-6 pt-12 md:pt-16 pb-12 md:pb-16 border-t border-border/40 reveal">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Khám phá</span>
          <h2 className="text-4xl md:text-5xl font-light text-primary font-serif-display line-draw">Điểm đến thịnh hành</h2>
          <p className="text-slate-400 mt-6 text-sm font-light">Tìm kiếm nguồn cảm hứng nghỉ dưỡng tiếp theo của bạn</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 reveal-stagger">
          {(destinations.length > 0 ? destinations : [
            { _id: '1', title: 'Hà Nội', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80', link: '/hotels?city=Hà Nội' },
            { _id: '2', title: 'Đà Nẵng', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80', link: '/hotels?city=Đà Nẵng' },
            { _id: '3', title: 'Nha Trang', image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&q=80', link: '/hotels?city=Nha Trang' },
            { _id: '4', title: 'Đà Lạt', image: 'https://images.unsplash.com/photo-1555217851-6141535bd771?w=600&q=80', link: '/hotels?city=Đà Lạt' },
          ]).map((dest) => (
            <Link
              key={dest._id}
              to={dest.link || `/hotels?city=${encodeURIComponent(dest.title)}`}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-card border border-border/40 transition-all duration-700 card-scale-img"
            >
              <img
                src={dest.image}
                alt={dest.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[9px] font-bold uppercase tracking-widest text-accent mb-1 block">Khám phá</span>
                <h3 className="text-white font-medium text-xl font-serif-display">{dest.title}</h3>
                <span className="text-white/60 text-xs flex items-center gap-1 mt-2 group-hover:text-accent transition-colors duration-300">
                  Tìm khách sạn →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Us Section */}
      <section className="bg-primary pt-16 md:pt-20 pb-24 md:pb-32 relative overflow-hidden reveal">
        {/* Subtle background illumination matching footer */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(196,154,69,0.06),transparent_50%)]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Giá trị cốt lõi</span>
            <h2 className="text-4xl md:text-5xl font-light text-white font-serif-display line-draw">Đặc quyền phục vụ</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 reveal-stagger">
            {[
              { icon: '✦', t: 'Tuyệt tác ẩm thực & dịch vụ', d: 'Trải nghiệm ẩm thực Michelin và sự quan tâm chu đáo may đo riêng cho từng vị khách.' },
              { icon: '✦', t: 'Không gian sống độc bản', d: 'Mỗi căn phòng là một tác phẩm nghệ thuật tôn vinh di sản văn hóa địa phương.' },
              { icon: '✦', t: 'Đặc quyền thượng lưu', d: 'Phục vụ quản gia riêng 24/7 và quyền tiếp cận các câu lạc bộ VIP cao cấp.' },
            ].map((x) => (
              <div 
                key={x.t} 
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-10 text-left transition-all duration-500 hover:border-accent/40 hover:bg-white/[0.05] hover:-translate-y-1.5 shadow-sm"
              >
                <div className="w-12 h-12 mb-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xl">
                  {x.icon}
                </div>
                <h3 className="font-medium text-lg text-white mb-3 font-serif-display">{x.t}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-light">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

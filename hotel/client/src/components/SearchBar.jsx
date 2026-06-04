import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function SearchBar({ compact = false }) {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
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

  if (compact) {
    return (
      <form onSubmit={onSearch} className="grid gap-3 md:grid-cols-5 bg-white text-gray-900 rounded-2xl p-4 shadow-lg">
        <div className="md:col-span-2">
          <label className="label">Điểm đến</label>
          <input className="input" placeholder="Hà Nội, Đà Nẵng, ..." value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className="label">Check-in</label>
          <input type="date" className="input" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} />
        </div>
        <div>
          <label className="label">Check-out</label>
          <input type="date" className="input" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="label">Số khách</label>
          <div className="flex gap-2">
            <input type="number" min="1" className="input" value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
            <button type="submit" className="btn-primary whitespace-nowrap">Tìm</button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSearch} className="bg-white text-gray-900 rounded-2xl p-6 shadow-lg space-y-5">
      {/* Destination */}
      <div>
        <label className="label">Điểm đến</label>
        <input className="input" placeholder="Hà Nội, Đà Nẵng, ..." value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      {/* Dates */}
      <div>
        <label className="label flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Thời gian lưu trú
        </label>
        <div className="space-y-2 mt-1">
          <input type="date" className="input" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} />
          <input type="date" className="input" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
      </div>

      {/* Guest count */}
      <div>
        <label className="label flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Số lượng khách
        </label>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div>
            <span className="text-xs text-gray-500">Người lớn</span>
            <div className="flex items-center gap-2 mt-1">
              <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-medium">−</button>
              <span className="w-8 text-center font-semibold">{adults}</span>
              <button type="button" onClick={() => setAdults(adults + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-medium">+</button>
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500">Trẻ em</span>
            <div className="flex items-center gap-2 mt-1">
              <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-medium">−</button>
              <span className="w-8 text-center font-semibold">{children}</span>
              <button type="button" onClick={() => setChildren(children + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-lg font-medium">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" className="btn-primary w-full py-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        Tìm Kiếm Phòng
      </button>
    </form>
  );
}

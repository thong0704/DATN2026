import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { formatCurrency, tAmenity } from '../utils/format';
import dayjs from 'dayjs';
import { useGetHotelBySlugQuery, useGetAvailableRoomsAtQuery, useGetSimilarHotelsQuery } from '../features/hotels/hotelsApi';
import { useHotelReviewsQuery, useCreateReviewMutation, useUploadReviewImagesMutation } from '../features/reviews/reviewsApi';
import { useMyBookingsQuery } from '../features/bookings/bookingsApi';
import { useToggleWishlistMutation } from '../features/wishlist/wishlistApi';
import Spinner from '../components/Spinner';
import RoomCard from '../components/RoomCard';
import ReviewCard from '../components/ReviewCard';
import HotelCard from '../components/HotelCard';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import Map from '../components/Map';

function ReviewForm({ hotel, onSuccess }) {
  const { data: bookingsData } = useMyBookingsQuery({ status: 'checked_out' });
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const [uploadImages, { isLoading: isUploading }] = useUploadReviewImagesMutation();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedBooking, setSelectedBooking] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Filter bookings for this hotel
  const eligibleBookings = (bookingsData?.data?.bookings || []).filter(
    (b) => (b.hotel?._id || b.hotel) === hotel._id
  );

  if (eligibleBookings.length === 0) return null;

  const onFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (files.length + selected.length > 3) {
      toast.warn('Chỉ được chọn tối đa 3 ảnh');
    }
    const newFiles = selected.slice(0, 3 - files.length);
    if (newFiles.length === 0) return;

    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.warn('Vui lòng viết nhận xét');
    const booking = eligibleBookings.find((b) => b._id === selectedBooking) || eligibleBookings[0];
    
    let imageUrls = [];
    if (files.length > 0) {
      try {
        const formData = new FormData();
        files.forEach((f) => formData.append('images', f));
        const res = await uploadImages(formData).unwrap();
        imageUrls = res.urls || [];
      } catch (err) {
        return toast.error('Tải hình ảnh đánh giá thất bại');
      }
    }

    try {
      await createReview({
        hotel: hotel._id,
        room: booking.room?._id || booking.room,
        booking: booking._id,
        rating,
        title,
        comment,
        images: imageUrls,
      }).unwrap();
      toast.success('Cảm ơn bạn đã đánh giá!');
      setRating(5);
      setTitle('');
      setComment('');
      setSelectedBooking('');
      setFiles([]);
      setPreviews([]);
      onSuccess?.();
    } catch (err) {
      toast.error(err?.data?.message || 'Gửi đánh giá thất bại');
    }
  };

  return (
    <div className="card p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Viết đánh giá của bạn</h3>
      <form onSubmit={handleSubmit}>
        {eligibleBookings.length > 1 && (
          <div className="mb-3">
            <label className="label">Chọn đặt phòng</label>
            <select
              className="input"
              value={selectedBooking}
              onChange={(e) => setSelectedBooking(e.target.value)}
            >
              {eligibleBookings.map((b) => (
                <option key={b._id} value={b._id}>
                  Phòng {b.room?.roomNumber || '—'} · {dayjs(b.checkIn).format('DD/MM/YYYY')}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="mb-3">
          <label className="label">Đánh giá</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className={`text-3xl ${(hover || rating) >= n ? 'text-amber-400' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
          </div>
        </div>
        <div className="mb-3">
          <label className="label">Tiêu đề (tuỳ chọn)</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Phòng sạch, view đẹp"
          />
        </div>
        <div className="mb-4">
          <label className="label">Nhận xét *</label>
          <textarea
            rows={4}
            className="input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về khách sạn..."
          />
        </div>
        <div className="mb-4">
          <label className="label font-semibold">Hình ảnh thực tế (Tối đa 3 ảnh)</label>
          <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center bg-slate-50/50 hover:border-brand-500 transition cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              id="review-images"
              className="hidden"
              onChange={onFilesChange}
              disabled={isLoading || isUploading}
            />
            <label htmlFor="review-images" className="cursor-pointer block">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {files.length > 0 ? `Đã chọn ${files.length} ảnh (Nhấp để chọn lại)` : 'Chọn ảnh thực tế từ thiết bị'}
              </p>
            </label>
          </div>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5 mt-3.5">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-150">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1.5 right-1.5 bg-red-500/80 hover:bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center transition-colors shadow-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" disabled={isLoading || isUploading} className="btn-primary">
          {isLoading || isUploading ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </form>
    </div>
  );
}

export default function HotelDetailPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const [checkIn, setCheckIn] = useState(params.get('checkIn') || today);
  const [checkOut, setCheckOut] = useState(params.get('checkOut') || tomorrow);
  const [adults, setAdults] = useState(Number(params.get('adults')) || 2);
  const [children, setChildren] = useState(Number(params.get('children')) || 0);

  const { data, isLoading } = useGetHotelBySlugQuery(slug);
  const hotel = data?.data?.hotel;
  const reviews = data?.data?.reviews || [];

  const [toggleWishlist] = useToggleWishlistMutation();
  const isFavorite = user?.wishlist?.includes(hotel?._id);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      return toast.info('Vui lòng đăng nhập để lưu khách sạn yêu thích');
    }
    try {
      await toggleWishlist(hotel._id).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Lỗi thao tác');
    }
  };

  const { data: roomsData, isFetching } = useGetAvailableRoomsAtQuery(
    hotel ? { id: hotel._id, checkIn, checkOut, adults, children } : null,
    { skip: !hotel }
  );
  const { data: similarData, isLoading: similarLoading } = useGetSimilarHotelsQuery(hotel?._id, { skip: !hotel?._id });
  const similarHotels = similarData?.data?.hotels || [];
  const rooms = roomsData?.data?.rooms || [];

  const { data: allReviews } = useHotelReviewsQuery(hotel?._id, { skip: !hotel });

  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  // Reset selected rooms when search parameters change
  useEffect(() => {
    setSelectedRoomIds([]);
  }, [checkIn, checkOut, adults]);

  const onSelectRoom = (room) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để đặt phòng');
      return navigate('/login');
    }
    setSelectedRoomIds((prev) => {
      if (prev.includes(room._id)) {
        return prev.filter((id) => id !== room._id);
      } else {
        return [...prev, room._id];
      }
    });
  };

  if (isLoading) return <Spinner className="py-16" />;
  if (!hotel) return <div className="p-8 text-center">Không tìm thấy khách sạn.</div>;

  const heroImg = hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&h=600&fit=crop';

  return (
    <div className="animate-fade-in-up">
      {/* Hero Section with Zoom Effect */}
      <div className="relative overflow-hidden h-72 md:h-96 group">
        <div
          className="h-full w-full bg-cover bg-center group-hover:scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16 pt-2">
        {/* Floating Glassmorphic Hotel Info Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] -mt-16 relative z-10 mb-8 flex flex-wrap items-center justify-between gap-6 hover:shadow-[0_24px_60px_rgba(0,0,0,0.1)] transition-all duration-300">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-extrabold uppercase tracking-wider">
              {'★'.repeat(hotel.stars || 0)} Khách sạn
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{hotel.name}</h1>
              <button
                type="button"
                onClick={handleFavoriteToggle}
                className="p-2.5 rounded-2xl bg-slate-50 border border-gray-150 hover:bg-slate-100 text-slate-550 hover:text-red-500 shadow-sm transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                title={isFavorite ? 'Xóa khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
              >
                <svg
                  className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-500'}`}
                  fill={isFavorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
            <p className="text-gray-650 flex items-center gap-1.5 text-sm font-medium">
              <span className="text-brand-500 text-base">📍</span> {hotel.address?.street}, {hotel.address?.city}
            </p>
          </div>
          {hotel.avgRating > 0 && (
            <div className="bg-gradient-to-br from-brand-600 to-indigo-650 text-white px-5 py-3.5 rounded-2xl shadow-lg shadow-brand-500/20 text-center flex-shrink-0">
              <p className="text-2xl font-black leading-none mb-1">★ {hotel.avgRating.toFixed(1)}</p>
              <p className="text-[10px] text-brand-100 uppercase font-bold tracking-wider">{hotel.totalReviews} đánh giá</p>
            </div>
          )}
        </div>

        {/* Hover-Zoom Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {(hotel.images || []).slice(0, 6).map((img, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-150/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group aspect-[4/3] cursor-pointer bg-slate-50">
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            </div>
          ))}
        </div>

        {/* Split Layout: Info & Availability on Left, Amenities on Right */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* LEFT side */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📖 Giới thiệu khách sạn
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{hotel.description}</p>
            </div>

            {/* Bản đồ vị trí khách sạn */}
            <div className="card p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📍 Vị trí khách sạn
              </h2>
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-150 relative z-0">
                <Map
                  lat={hotel.location?.coordinates?.[1]}
                  lng={hotel.location?.coordinates?.[0]}
                  hotelName={hotel.name}
                  address={`${hotel.address?.street}, ${hotel.address?.city}`}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-650 flex items-center gap-1.5 font-medium">
                  <span className="text-brand-500 text-base">📍</span> Địa chỉ: {hotel.address?.street}, {hotel.address?.city}
                </p>
                {hotel.location?.coordinates?.[1] && hotel.location?.coordinates?.[0] && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.address?.street + ', ' + hotel.address?.city + ', Vietnam')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 transition-all active:scale-[0.98] no-underline"
                  >
                    🗺️ Chỉ đường bằng Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Availability Check Block */}
            <div className="card p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-brand-50/10 shadow-sm border border-gray-150 hover:shadow-md hover:border-gray-250 transition-all duration-300">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
                <span className="text-brand-650">🔍</span> Kiểm tra phòng trống
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Check-in</label>
                  <input type="date" className="input focus:border-brand-500 focus:ring-brand-200" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} />
                </div>
                <div>
                  <label className="label">Check-out</label>
                  <input type="date" className="input focus:border-brand-500 focus:ring-brand-200" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
                </div>
                <div>
                  <label className="label">Người lớn</label>
                  <input type="number" min="1" className="input focus:border-brand-500 focus:ring-brand-200" value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Trẻ em</label>
                  <input type="number" min="0" className="input focus:border-brand-500 focus:ring-brand-200" value={children} onChange={(e) => setChildren(Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT side: Sticky Amenities */}
          <div className="lg:col-span-1">
            <div className="card p-6 bg-gradient-to-b from-white to-slate-50/60 lg:sticky lg:top-24 border border-gray-150">
              <h2 className="text-lg font-bold text-gray-950 mb-4 flex items-center gap-2">
                💎 Tiện ích nổi bật
              </h2>
              <div className="flex flex-wrap gap-2">
                {(hotel.amenities || []).map((a) => (
                  <span key={a} className="badge bg-brand-50/60 text-brand-700 border border-brand-100/30 px-3 py-1.5 text-xs font-semibold hover:bg-brand-50 hover:scale-[1.03] transition-all duration-200">
                    {tAmenity(a)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Room availability section */}
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              🛏️ Các hạng phòng sẵn có
            </h2>
            {isFetching ? (
              <Spinner className="py-8" />
            ) : rooms.length === 0 ? (
              <div className="card p-12 text-center text-gray-500 border border-dashed">Không còn phòng cho ngày bạn chọn.</div>
            ) : (
              <div className="space-y-4 pb-20">
                {rooms.map((r) => (
                  <RoomCard
                    key={r._id}
                    room={r}
                    onSelect={onSelectRoom}
                    selected={selectedRoomIds.includes(r._id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Reviews section */}
          <div className="border-t border-gray-150 pt-10">
            <h2 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-2">
              💬 Nhận xét từ khách hàng
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Đánh giá trung bình: <span className="font-bold text-gray-800">{hotel.avgRating > 0 ? `★ ${hotel.avgRating.toFixed(1)}/5` : 'Chưa có'}</span> ({allReviews?.results || reviews.length} đánh giá)
            </p>

            {isAuthenticated && <ReviewForm hotel={hotel} />}

            <div className="space-y-4 mt-6">
              {(allReviews?.data?.reviews || reviews).map((r) => <ReviewCard key={r._id} review={r} />)}
              {(allReviews?.data?.reviews || reviews).length === 0 && (
                <p className="text-gray-550 bg-white p-8 rounded-2xl border border-dashed text-center">Chưa có đánh giá nào.</p>
              )}
            </div>
          </div>

          {/* Similar Hotels section */}
          <div className="border-t border-gray-150 pt-10 pb-12 text-left">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              🏨 Các khách sạn tương tự
            </h2>
            {similarLoading ? (
              <Spinner className="py-8" />
            ) : similarHotels.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có khách sạn tương tự nào khác tại khu vực này.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarHotels.map((h) => (
                  <HotelCard key={h._id} hotel={h} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar for Multi-Room Selection */}
      {selectedRoomIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-4 z-40 animate-fade-in-up">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-gray-900 font-semibold text-lg">
                Đã chọn {selectedRoomIds.length} phòng
              </p>
              <p className="text-gray-500 text-sm">
                Thời gian: {dayjs(checkIn).format('DD/MM/YYYY')} → {dayjs(checkOut).format('DD/MM/YYYY')} ({dayjs(checkOut).diff(dayjs(checkIn), 'day')} đêm)
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-500">Tổng tiền tạm tính (gồm thuế)</p>
                <p className="text-2xl font-bold text-brand-700">
                  {formatCurrency(
                    rooms
                      .filter((r) => selectedRoomIds.includes(r._id))
                      .reduce((sum, r) => sum + (r.dynamicPricing?.roomTotal || r.pricePerNight * dayjs(checkOut).diff(dayjs(checkIn), 'day')), 0) * 1.08
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  navigate(`/booking?roomIds=${selectedRoomIds.join(',')}&hotelId=${hotel._id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`);
                }}
                className="btn-primary px-8 py-3 text-base shadow-lg shadow-brand-200"
              >
                Tiến hành đặt phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useGetHotelBySlugQuery, useGetAvailableRoomsAtQuery } from '../features/hotels/hotelsApi';
import { useHotelReviewsQuery, useCreateReviewMutation } from '../features/reviews/reviewsApi';
import { useMyBookingsQuery } from '../features/bookings/bookingsApi';
import Spinner from '../components/Spinner';
import RoomCard from '../components/RoomCard';
import ReviewCard from '../components/ReviewCard';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

function ReviewForm({ hotel, onSuccess }) {
  const { data: bookingsData } = useMyBookingsQuery({ status: 'checked_out' });
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedBooking, setSelectedBooking] = useState('');

  // Filter bookings for this hotel
  const eligibleBookings = (bookingsData?.data?.bookings || []).filter(
    (b) => (b.hotel?._id || b.hotel) === hotel._id
  );

  if (eligibleBookings.length === 0) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.warn('Vui lòng viết nhận xét');
    const booking = eligibleBookings.find((b) => b._id === selectedBooking) || eligibleBookings[0];
    try {
      await createReview({
        hotel: hotel._id,
        room: booking.room?._id || booking.room,
        booking: booking._id,
        rating,
        title,
        comment,
      }).unwrap();
      toast.success('Cảm ơn bạn đã đánh giá!');
      setRating(5);
      setTitle('');
      setComment('');
      setSelectedBooking('');
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
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </form>
    </div>
  );
}

export default function HotelDetailPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const [checkIn, setCheckIn] = useState(params.get('checkIn') || today);
  const [checkOut, setCheckOut] = useState(params.get('checkOut') || tomorrow);
  const [adults, setAdults] = useState(Number(params.get('adults')) || 2);

  const { data, isLoading } = useGetHotelBySlugQuery(slug);
  const hotel = data?.data?.hotel;
  const reviews = data?.data?.reviews || [];

  const { data: roomsData, isFetching } = useGetAvailableRoomsAtQuery(
    hotel ? { id: hotel._id, checkIn, checkOut, adults, children: 0 } : null,
    { skip: !hotel }
  );
  const rooms = roomsData?.data?.rooms || [];

  const { data: allReviews } = useHotelReviewsQuery(hotel?._id, { skip: !hotel });

  const onSelectRoom = (room) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để đặt phòng');
      return navigate('/login');
    }
    navigate(`/booking?roomId=${room._id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`);
  };

  if (isLoading) return <Spinner className="py-16" />;
  if (!hotel) return <div className="p-8 text-center">Không tìm thấy khách sạn.</div>;

  const heroImg = hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&h=600&fit=crop';

  return (
    <div>
      <div
        className="h-72 md:h-96 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{hotel.name}</h1>
            <p className="text-amber-500 mt-1">{'★'.repeat(hotel.stars || 0)}</p>
            <p className="text-gray-600 mt-1">
              📍 {hotel.address?.street}, {hotel.address?.city}
            </p>
          </div>
          {hotel.avgRating > 0 && (
            <div className="bg-brand-700 text-white px-4 py-2 rounded-lg">
              <p className="text-2xl font-bold">★ {hotel.avgRating.toFixed(1)}</p>
              <p className="text-xs">{hotel.totalReviews} đánh giá</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-3 mb-8">
          {(hotel.images || []).slice(0, 6).map((img, i) => (
            <img key={i} src={img.url} alt="" className="rounded-lg h-40 w-full object-cover" />
          ))}
        </div>

        <p className="text-gray-700 mb-6">{hotel.description}</p>

        <div className="card p-4 mb-8">
          <h2 className="font-semibold mb-3">Tiện nghi</h2>
          <div className="flex flex-wrap gap-2">
            {(hotel.amenities || []).map((a) => (
              <span key={a} className="badge bg-gray-100 text-gray-700">{a}</span>
            ))}
          </div>
        </div>

        {/* Availability check */}
        <div className="card p-4 mb-8">
          <h2 className="font-semibold mb-3">Kiểm tra phòng trống</h2>
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Check-in</label>
              <input type="date" className="input" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label className="label">Check-out</label>
              <input type="date" className="input" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div>
              <label className="label">Người lớn</label>
              <input type="number" min="1" className="input" value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Phòng có sẵn</h2>
        {isFetching ? (
          <Spinner className="py-8" />
        ) : rooms.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">Không còn phòng cho ngày bạn chọn.</div>
        ) : (
          <div className="space-y-4">
            {rooms.map((r) => <RoomCard key={r._id} room={r} onSelect={onSelectRoom} />)}
          </div>
        )}

        {/* Reviews */}
        <h2 className="text-xl font-bold mt-12 mb-4">Đánh giá ({allReviews?.results || reviews.length})</h2>

        {isAuthenticated && <ReviewForm hotel={hotel} />}

        <div className="space-y-3 mt-6">
          {(allReviews?.data?.reviews || reviews).map((r) => <ReviewCard key={r._id} review={r} />)}
          {(allReviews?.data?.reviews || reviews).length === 0 && (
            <p className="text-gray-500">Chưa có đánh giá nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}

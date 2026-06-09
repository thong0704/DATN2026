import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useGetRoomQuery, useRoomsByHotelQuery, useGetMultiRoomQuoteQuery } from '../features/rooms/roomsApi';
import { useCreateBookingMutation } from '../features/bookings/bookingsApi';
import { useValidateCouponMutation } from '../features/coupons/couponsApi';
import Spinner from '../components/Spinner';
import { formatCurrency, nightsBetween } from '../utils/format';
import { useAuth } from '../hooks/useAuth';

export default function BookingPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roomIdsStr = params.get('roomIds') || '';
  const roomId = params.get('roomId') || '';
  const roomIds = roomIdsStr ? roomIdsStr.split(',') : roomId ? [roomId] : [];
  const hotelId = params.get('hotelId') || '';
  const checkIn = params.get('checkIn') || dayjs().format('YYYY-MM-DD');
  const checkOut = params.get('checkOut') || dayjs().add(1, 'day').format('YYYY-MM-DD');
  const adults = Number(params.get('adults') || 2);

  const { data: hotelRoomsData, isLoading: roomsLoading } = useRoomsByHotelQuery(hotelId, { skip: !hotelId });
  const allRooms = hotelRoomsData?.data?.rooms || [];
  const selectedRooms = allRooms.filter(r => roomIds.includes(r._id));

  const { data: singleRoomData, isLoading: singleRoomLoading } = useGetRoomQuery(roomId, { skip: !!hotelId || !roomId });
  const fallbackRoom = singleRoomData?.data?.room;

  const finalRooms = hotelId ? selectedRooms : fallbackRoom ? [fallbackRoom] : [];
  const loading = roomsLoading || singleRoomLoading;

  const { data: quoteData, isLoading: quoteLoading } = useGetMultiRoomQuoteQuery(
    { roomIds, checkIn, checkOut },
    { skip: !roomIds.length || !checkIn || !checkOut }
  );
  const quote = quoteData?.data;

  const [step, setStep] = useState(1);
  const [createBooking, { isLoading: creating }] = useCreateBookingMutation();
  const [validateCoupon, { isLoading: validating }] = useValidateCouponMutation();
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount, description }

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name, email: user?.email, phone: user?.phone, idCard: '', specialRequests: '',
    },
  });

  if (loading || quoteLoading) return <Spinner className="py-16" />;
  if (finalRooms.length === 0) return <div className="p-8 text-center">Phòng không tồn tại.</div>;

  const nights = quote ? quote.nights : nightsBetween(checkIn, checkOut);
  const roomTotal = quote ? (quote.pricing?.roomTotal || 0) : finalRooms.reduce((sum, r) => sum + (r.pricePerNight || 0), 0) * nights;
  const tax = quote ? (quote.pricing?.tax || 0) : Math.round(roomTotal * 0.08);
  const subtotal = roomTotal + tax;
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  const onApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const res = await validateCoupon({ code: couponInput.trim(), amount: subtotal, roomId: roomIds[0] }).unwrap();
      setCoupon(res.data);
      toast.success(`Áp dụng mã ${res.data.code} - giảm ${res.data.discount.toLocaleString('vi-VN')}đ`);
    } catch (e) {
      setCoupon(null);
      toast.error(e?.data?.message || 'Mã không hợp lệ');
    }
  };

  const onSubmit = async (guestInfo) => {
    try {
      const res = await createBooking({
        roomId: roomIds[0],
        roomIds,
        checkIn,
        checkOut,
        guests: { adults, children: 0 },
        guestInfo,
        specialRequests: guestInfo.specialRequests,
        couponCode: coupon?.code,
      }).unwrap();
      toast.info('Đang chuyển đến trang thanh toán...');
      navigate(`/payment/${res.data.booking._id}`);
    } catch (e) {
      toast.error(e?.data?.message || 'Đặt phòng thất bại');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Stepper */}
      <div className="relative flex items-center justify-center gap-4 mb-10 text-sm max-w-xl mx-auto">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 -z-10" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-brand-600 -translate-y-1/2 -z-10 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
        {['Chọn phòng', 'Thông tin khách', 'Thanh toán'].map((s, i) => (
          <div key={s} className="flex items-center bg-slate-50 px-4 py-1.5 rounded-full z-10 border border-gray-100 shadow-sm gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= step ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
            <span className={`font-semibold ${i + 1 <= step ? 'text-brand-700' : 'text-gray-400'}`}>{s}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card p-6">
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold mb-4">Xác nhận các phòng đã chọn</h2>
              <div className="space-y-4 mb-6">
                {finalRooms.map((r) => (
                  <div key={r._id} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <img src={r.images?.[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop'} alt="" className="w-32 h-24 object-cover rounded-lg" />
                    <div>
                      <p className="font-semibold capitalize">{r.type} · Phòng {r.roomNumber}</p>
                      <p className="text-sm text-gray-500">{r.bedType} · {r.size}m²</p>
                      <p className="text-sm">Sức chứa: {r.capacity?.adults} người lớn</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full">Tiếp tục →</button>
            </>
          )}
          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <h2 className="text-lg font-semibold mb-2">Thông tin khách</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Họ tên *</label>
                  <input className="input" {...register('name', { required: 'Bắt buộc' })} />
                  {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" {...register('email', { required: 'Bắt buộc' })} />
                </div>
                <div>
                  <label className="label">Số điện thoại *</label>
                  <input className="input" {...register('phone', { required: 'Bắt buộc' })} />
                </div>
                <div>
                  <label className="label">CMND/CCCD</label>
                  <input className="input" {...register('idCard')} />
                </div>
              </div>
              <div>
                <label className="label">Yêu cầu đặc biệt</label>
                <textarea rows={3} className="input" {...register('specialRequests')} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-outline">← Quay lại</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? 'Đang xử lý...' : 'Đặt phòng và chuyển đến thanh toán'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Summary */}
        <aside className="card p-6 h-fit lg:sticky lg:top-20">
          <h3 className="font-semibold mb-3">Tóm tắt đặt phòng</h3>
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <p>Check-in: <b>{dayjs(checkIn).format('DD/MM/YYYY')}</b></p>
            <p>Check-out: <b>{dayjs(checkOut).format('DD/MM/YYYY')}</b></p>
            <p>Số đêm: <b>{nights}</b></p>
            <p>Khách: <b>{adults} người lớn</b></p>
          </div>
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Phòng × {nights} đêm</span><span>{formatCurrency(roomTotal)}</span></div>

            {quote?.roomBreakdowns?.map((breakdown, roomIdx) => (
              <div key={breakdown.room || roomIdx} className="mb-4">
                <p className="font-semibold text-gray-700 text-xs mb-1">
                  Phòng {breakdown.roomNumber} ({breakdown.type}):
                </p>
                <div className="bg-gray-50 rounded-xl p-2.5 text-xs space-y-1.5 text-gray-500 max-h-36 overflow-y-auto border border-gray-100">
                  {breakdown.perNight?.map((day, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <span>Đêm {idx + 1} ({dayjs(day.date).format('DD/MM')})</span>
                        {day.label && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase leading-none border ${
                            day.label === 'Cuối tuần' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            day.label === 'Mùa cao điểm' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-teal-50 text-teal-700 border-teal-200'
                          }`}>
                            {day.label}
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-gray-700">{formatCurrency(day.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-1 font-semibold text-gray-700 mt-1">
                    <span>Tổng phòng {breakdown.roomNumber}</span>
                    <span>{formatCurrency(breakdown.roomTotal)}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between text-gray-600"><span>Thuế & phí (8%)</span><span>{formatCurrency(tax)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Giảm giá ({coupon.code})</span>
                <span>−{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-brand-700 pt-2 border-t">
              <span>Tổng</span><span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Coupon input */}
          <div className="border-t pt-3 mt-3">
            <label className="label">Mã giảm giá</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Nhập mã..."
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                disabled={!!coupon}
              />
              {coupon ? (
                <button type="button" onClick={() => { setCoupon(null); setCouponInput(''); }} className="btn-outline">Bỏ</button>
              ) : (
                <button type="button" onClick={onApplyCoupon} disabled={validating || !couponInput.trim()} className="btn-primary">Áp dụng</button>
              )}
            </div>
            {coupon?.description && <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

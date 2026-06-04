import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useGetRoomQuery } from '../features/rooms/roomsApi';
import { useCreateBookingMutation } from '../features/bookings/bookingsApi';
import { useValidateCouponMutation } from '../features/coupons/couponsApi';
import Spinner from '../components/Spinner';
import { formatCurrency, nightsBetween } from '../utils/format';
import { useAuth } from '../hooks/useAuth';

export default function BookingPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roomId = params.get('roomId');
  const checkIn = params.get('checkIn') || dayjs().format('YYYY-MM-DD');
  const checkOut = params.get('checkOut') || dayjs().add(1, 'day').format('YYYY-MM-DD');
  const adults = Number(params.get('adults') || 2);

  const { data, isLoading } = useGetRoomQuery(roomId, { skip: !roomId });
  const room = data?.data?.room;
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

  if (isLoading) return <Spinner className="py-16" />;
  if (!room) return <div className="p-8 text-center">Phòng không tồn tại.</div>;

  const nights = nightsBetween(checkIn, checkOut);
  const roomTotal = (room.pricePerNight || 0) * nights;
  const tax = Math.round(roomTotal * 0.08);
  const subtotal = roomTotal + tax;
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  const onApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const res = await validateCoupon({ code: couponInput.trim(), amount: subtotal, roomId }).unwrap();
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
        roomId,
        checkIn,
        checkOut,
        guests: { adults, children: 0 },
        guestInfo,
        specialRequests: guestInfo.specialRequests,
        couponCode: coupon?.code,
      }).unwrap();
      toast.success('Đặt phòng thành công, vui lòng thanh toán!');
      navigate(`/payment/${res.data.booking._id}`);
    } catch (e) {
      toast.error(e?.data?.message || 'Đặt phòng thất bại');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Stepper */}
      <ol className="flex items-center justify-center gap-4 mb-8 text-sm">
        {['Chọn phòng', 'Thông tin khách', 'Thanh toán'].map((s, i) => (
          <li key={s} className={`flex items-center gap-2 ${i + 1 <= step ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${i + 1 <= step ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card p-6">
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold mb-4">Xác nhận phòng đã chọn</h2>
              <div className="flex gap-4 items-start mb-4">
                <img src={room.images?.[0]?.url} alt="" className="w-32 h-24 object-cover rounded-lg" />
                <div>
                  <p className="font-semibold capitalize">{room.type} · Phòng {room.roomNumber}</p>
                  <p className="text-sm text-gray-500">{room.bedType} · {room.size}m²</p>
                  <p className="text-sm">Sức chứa: {room.capacity.adults} người lớn</p>
                </div>
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

import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { useGetBookingQuery } from '../features/bookings/bookingsApi';
import { useCreateIntentMutation, useConfirmPaymentMutation } from '../features/payments/paymentsApi';
import Spinner from '../components/Spinner';
import { formatCurrency } from '../utils/format';

const PUB_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const IS_MOCK_KEY = !PUB_KEY || PUB_KEY.includes('dummy') || PUB_KEY.includes('placeholder');
const stripePromise = IS_MOCK_KEY ? null : loadStripe(PUB_KEY);

function CheckoutForm({ booking, intentId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirmPayment] = useConfirmPaymentMutation();
  const [processing, setProcessing] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (error) {
      toast.error(error.message);
      setProcessing(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      try {
        await confirmPayment({ intentId }).unwrap();
        toast.success('Thanh toán thành công!');
        onSuccess();
      } catch (err) {
        toast.error('Xác nhận thanh toán thất bại');
      }
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      <button disabled={!stripe || processing} className="btn-primary w-full">
        {processing ? 'Đang xử lý...' : `Thanh toán ${formatCurrency(booking?.pricing?.total)}`}
      </button>
    </form>
  );
}

function MockCheckoutForm({ booking, intentId, onSuccess, method }) {
  const [confirmPayment] = useConfirmPaymentMutation();
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const onPay = async () => {
    setProcessing(true);
    try {
      await confirmPayment({ intentId }).unwrap();
      if (method === 'cash') {
        toast.success('Đặt phòng đang chờ xử lý! Thanh toán khi nhận phòng.');
      } else {
        toast.success('Thanh toán thành công!');
      }
      onSuccess();
    } catch (err) {
      toast.error('Xác nhận thanh toán thất bại');
    } finally {
      setProcessing(false);
    }
  };

  
  if (method === 'cash') {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 text-sm">
          <p className="font-medium mb-1">Thanh toán khi nhận phòng</p>
          <p>Xác nhận đặt phòng và thanh toán trực tiếp tại quầy lễ tân khi bạn đến nhận phòng.</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Tổng thanh toán</span>
            <span className="font-bold text-lg">{formatCurrency(booking?.pricing?.total)}</span>
          </div>
        </div>
        <button onClick={onPay} disabled={processing} className="btn-primary w-full">
          {processing ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
        </button>
      </div>
    );
  }

  // Stripe mock - credit card form
  return (
    <div className="space-y-4">
      <div className="card bg-gray-50 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Phương thức</span>
          <span className="font-medium">Thẻ tín dụng / ghi nợ quốc tế</span>
        </div>
        <div className="space-y-3 pt-2">
          <div>
            <label className="label">Số thẻ</label>
            <input className="input font-mono" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ngày hết hạn</label>
              <input className="input" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" />
            </div>
            <div>
              <label className="label">CVV / CVC</label>
              <input className="input" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" />
            </div>
          </div>
          <div>
            <label className="label">Tên chủ thẻ</label>
            <input className="input uppercase" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="NGUYEN VAN A" />
          </div>
        </div>
      </div>
      <button onClick={onPay} disabled={processing} className="btn-primary w-full">
        {processing ? 'Đang xử lý...' : `Thanh toán ${formatCurrency(booking?.pricing?.total)}`}
      </button>
    </div>
  );
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetBookingQuery(bookingId);
  const booking = data?.data?.booking;
  const [createIntent] = useCreateIntentMutation();
  const [clientSecret, setClientSecret] = useState('');
  const [intentId, setIntentId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [starting, setStarting] = useState(false);

  const METHODS = [
    { id: 'credit_card', label: 'Thẻ quốc tế (Visa / Mastercard)', icon: '💳' },
    { id: 'vnpay', label: 'VNPay (ATM / QR)', img: '/vnpay-logo.png' },
    { id: 'momo', label: 'Ví MoMo', img: '/momo-logo.png' },
    { id: 'cash', label: 'Thanh toán khi nhận phòng', icon: '🏨' },
  ];

  const startPayment = async () => {
    setStarting(true);
    try {
      const res = await createIntent({ bookingId, method: selectedMethod }).unwrap();
      // VNPay/MoMo/ATM: redirect to external payment gateway
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }
      setClientSecret(res.data.clientSecret);
      setIntentId(res.data.intentId);
      setPaymentMethod(res.data.method || selectedMethod);
    } catch (e) {
      toast.error(e?.data?.message || 'Không thể khởi tạo thanh toán');
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) return <Spinner className="py-16" />;
  if (!booking) return <div className="p-8 text-center">Booking không tồn tại.</div>;

  if (booking.paymentStatus === 'paid') {
    return (
      <div className="max-w-xl mx-auto py-12 text-center card p-8">
        <div className="text-5xl mb-2">✅</div>
        <h1 className="text-2xl font-bold mb-2">Đặt phòng đã thanh toán</h1>
        <p className="text-gray-600 mb-4">Mã đặt phòng: <b>{booking.bookingCode}</b></p>
        <button onClick={() => navigate(`/booking-confirmation/${booking._id}`)} className="btn-primary">
          Xem chi tiết
        </button>
      </div>
    );
  }

  const isMockIntent = intentId.startsWith('pi_mock_') || intentId.startsWith('pi_cash_') || IS_MOCK_KEY;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>
      <div className="card p-6 mb-4">
        <p className="text-sm text-gray-500">Mã đặt phòng</p>
        <p className="font-mono font-bold text-lg">{booking.bookingCode}</p>
        <p className="mt-2">Tổng cần thanh toán: <span className="text-brand-700 font-bold">{formatCurrency(booking.pricing?.total)}</span></p>
      </div>

      {/* Payment method selection */}
      {!intentId && (
        <div className="card p-6 mb-4">
          <h2 className="font-semibold mb-4">Chọn phương thức thanh toán</h2>
          <div className="space-y-2">
            {METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                  selectedMethod === m.id ? 'border-brand-600 bg-brand-50/70 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.id}
                  checked={selectedMethod === m.id}
                  onChange={() => setSelectedMethod(m.id)}
                  className="sr-only"
                />
                {m.icon && <span className="text-2xl">{m.icon}</span>}
                {m.img && <img src={m.img} alt="" className="w-8 h-8 rounded object-contain" />}
                <span className="font-medium">{m.label}</span>
                {selectedMethod === m.id && <span className="ml-auto text-brand-600 font-bold">✓</span>}
              </label>
            ))}
          </div>
          <button onClick={startPayment} disabled={starting} className="btn-primary w-full mt-4">
            {starting ? 'Đang xử lý...' : 'Tiếp tục'}
          </button>
        </div>
      )}

      {/* Payment form */}
      {intentId && (
        <div className="card p-6">
          {isMockIntent ? (
            <MockCheckoutForm
              booking={booking}
              intentId={intentId}
              method={paymentMethod}
              onSuccess={() => navigate(`/booking-confirmation/${booking._id}`)}
            />
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CheckoutForm
                booking={booking}
                intentId={intentId}
                onSuccess={() => navigate(`/booking-confirmation/${booking._id}`)}
              />
            </Elements>
          )}
          {!isMockIntent && (
            <p className="text-xs text-gray-500 mt-4">
              Thử thẻ Stripe test: <code>4242 4242 4242 4242</code> · bất kỳ ngày hết hạn tương lai · CVC bất kỳ.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

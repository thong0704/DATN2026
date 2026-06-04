import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function VNPayReturnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | failed
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const queryString = params.toString();
        const res = await fetch(`${API_URL}/payments/vnpay-return?${queryString}`);
        const data = await res.json();
        if (data.data?.resultCode === '00') {
          setStatus('success');
          setBookingId(data.data.bookingId);
        } else {
          setStatus('failed');
          setBookingId(data.data?.bookingId || '');
        }
      } catch {
        setStatus('failed');
      }
    };
    verify();
  }, [params]);

  if (status === 'loading') return <Spinner className="py-16" />;

  return (
    <div className="max-w-xl mx-auto py-12 text-center card p-8">
      {status === 'success' ? (
        <>
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold mb-2">Thanh toán thành công!</h1>
          <p className="text-gray-600 mb-6">Giao dịch VNPay đã được xác nhận.</p>
          <button onClick={() => navigate(`/booking-confirmation/${bookingId}`)} className="btn-primary">
            Xem chi tiết đặt phòng
          </button>
        </>
      ) : (
        <>
          <div className="text-5xl mb-3">❌</div>
          <h1 className="text-2xl font-bold mb-2">Thanh toán thất bại</h1>
          <p className="text-gray-600 mb-6">Giao dịch VNPay không thành công hoặc đã bị huỷ.</p>
          {bookingId && (
            <button onClick={() => navigate(`/payment/${bookingId}`)} className="btn-primary">
              Thử lại
            </button>
          )}
        </>
      )}
    </div>
  );
}

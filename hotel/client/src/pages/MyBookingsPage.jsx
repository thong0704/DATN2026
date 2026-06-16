import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useMyBookingsQuery, useCancelBookingMutation } from '../features/bookings/bookingsApi';
import { useCreateReviewMutation, useUploadReviewImagesMutation } from '../features/reviews/reviewsApi';
import Spinner from '../components/Spinner';
import { formatCurrency, formatDate, statusColor, tStatus, tRoomType } from '../utils/format';

function ReviewModal({ booking, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const [uploadImages, { isLoading: isUploading }] = useUploadReviewImagesMutation();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

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

  const submit = async () => {
    if (!comment.trim()) return toast.warn('Vui lòng viết nhận xét');
    
    let imageUrls = [];
    if (files.length > 0) {
      try {
        const formData = new FormData();
        files.forEach((f) => formData.append('images', f));
        const uploadRes = await uploadImages(formData).unwrap();
        imageUrls = uploadRes.urls || [];
      } catch (err) {
        return toast.error('Tải hình ảnh đánh giá thất bại');
      }
    }

    try {
      await createReview({
        hotel: booking.hotel?._id,
        room: booking.room?._id,
        booking: booking._id,
        rating,
        title,
        comment,
        images: imageUrls,
      }).unwrap();
      toast.success('Cảm ơn bạn đã đánh giá!');
      onDone();
      onClose();
    } catch (e) {
      toast.error(e?.data?.message || 'Gửi đánh giá thất bại');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-1">Đánh giá kỳ nghỉ</h2>
        <p className="text-sm text-gray-500 mb-4">
          {booking.hotel?.name} · {booking.rooms && booking.rooms.length > 0
            ? booking.rooms.map(r => `Phòng ${r.room?.roomNumber || booking.room?.roomNumber}`).join(', ')
            : `Phòng ${booking.room?.roomNumber}`}
        </p>

        <div className="flex items-center gap-1 mb-4">
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

        <div className="mb-3">
          <label className="label">Tiêu đề (tuỳ chọn)</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Phòng sạch, view đẹp" />
        </div>
        <div className="mb-4">
          <label className="label">Nhận xét *</label>
          <textarea rows={4} className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Chia sẻ cảm nhận của bạn..." />
        </div>

        <div className="mb-4">
          <label className="label font-semibold">Hình ảnh thực tế (Tối đa 3 ảnh)</label>
          <div className="border border-dashed border-gray-300 rounded-2xl p-4 text-center bg-slate-50/50 hover:border-brand-500 transition cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              id="modal-review-images"
              className="hidden"
              onChange={onFilesChange}
              disabled={isLoading || isUploading}
            />
            <label htmlFor="modal-review-images" className="cursor-pointer block">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {files.length > 0 ? `Đã chọn ${files.length} ảnh (Nhấp để chọn lại)` : 'Chọn ảnh thực tế từ thiết bị'}
              </p>
            </label>
          </div>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-150">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center transition-colors shadow-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">Huỷ</button>
          <button onClick={submit} disabled={isLoading || isUploading} className="btn-primary">
            {isLoading || isUploading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading, refetch } = useMyBookingsQuery({ status: status || undefined });
  const bookings = data?.data?.bookings || [];
  const [cancel, { isLoading: cancelling }] = useCancelBookingMutation();
  const [reviewing, setReviewing] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const onCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancel({ id: cancelTarget, reason: cancelReason || 'Khách hàng yêu cầu hủy' }).unwrap();
      toast.success('Đã hủy đặt phòng');
      setCancelTarget(null);
      setCancelReason('');
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || 'Hủy thất bại');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Đặt phòng của tôi</h1>
        <Link to="/my-invoices" className="btn-outline text-sm">🧾 Hóa đơn của tôi</Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'pending', 'confirmed', 'paid', 'checked_in', 'checked_out', 'cancelled'].map((s) => (
          <button key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`badge cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
              status === s ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'bg-gray-150/70 text-gray-700 hover:bg-gray-200'
            }`}>
            {s ? tStatus(s) : 'Tất cả'}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner className="py-16" /> : (
        bookings.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">Chưa có đặt phòng nào.</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b._id} className="card p-4 flex flex-wrap items-center gap-4">
                <img src={b.hotel?.images?.[0]?.url} alt="" className="w-24 h-20 rounded-lg object-cover" />
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold">{b.hotel?.name}</p>
                  <p className="text-sm text-gray-500">
                    {b.rooms && b.rooms.length > 0
                      ? `${tRoomType(b.rooms[0].room?.type || b.room?.type)} · ${b.rooms.map(r => `Phòng ${r.room?.roomNumber || b.room?.roomNumber}`).join(', ')}`
                      : `${tRoomType(b.room?.type)} · Phòng ${b.room?.roomNumber}`}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.nights} đêm</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-700">{formatCurrency(b.pricing?.total)}</p>
                  <span className={`badge ${statusColor(b.status)}`}>{tStatus(b.status)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <Link to={`/booking-confirmation/${b._id}`} className="btn-outline text-xs px-3 py-1">Chi tiết</Link>
                  {b.status === 'checked_out' && (
                    <button onClick={() => setReviewing(b)} className="btn-primary text-xs px-3 py-1">
                      ⭐ Đánh giá
                    </button>
                  )}
                  {!['cancelled', 'checked_in', 'checked_out', 'refunded'].includes(b.status) && (
                    <button onClick={() => setCancelTarget(b._id)} disabled={cancelling} className="btn-danger text-xs px-3 py-1">Hủy</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {reviewing && (
        <ReviewModal
          booking={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => refetch()}
        />
      )}

      {/* Cancel booking modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold mb-3">Xác nhận hủy đặt phòng</h3>
            <p className="text-sm text-gray-600 mb-3">Vui lòng cho chúng tôi biết lý do hủy:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy (tùy chọn)..."
              className="input w-full h-24 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setCancelTarget(null); setCancelReason(''); }} className="btn-outline px-4 py-2">Quay lại</button>
              <button onClick={onCancel} disabled={cancelling} className="btn-danger px-4 py-2">
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

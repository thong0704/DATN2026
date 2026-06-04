import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-7xl font-black text-brand-700">404</h1>
      <p className="text-xl text-gray-600 mt-2">Trang không tồn tại</p>
      <Link to="/" className="btn-primary mt-6">Về trang chủ</Link>
    </div>
  );
}

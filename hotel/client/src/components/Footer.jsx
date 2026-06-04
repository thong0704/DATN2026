import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-slate-950 text-slate-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_45%)]" />
      <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-brand-700/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14">
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Stay different</p>
            <h3 className="mt-2 text-2xl font-extrabold text-white">Đặt phòng nhanh, giá rõ ràng, hỗ trợ 24/7</h3>
            <p className="mt-1 text-sm text-slate-300">Lên lịch cho chuyến đi tiếp theo của bạn chỉ trong vài phút.</p>
          </div>
          <Link to="/hotels" className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-brand-700 hover:to-cyan-600 md:mt-0">Khám phá khách sạn</Link>
        </div>

        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="text-2xl font-extrabold text-white">2T Hotel</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">Nền tảng đặt phòng khách sạn thông minh, ưu tiên trải nghiệm rõ ràng và dịch vụ tận tâm.</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Điều hướng</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="transition hover:text-white">Trang chủ</Link></li>
              <li><Link to="/hotels" className="transition hover:text-white">Danh sách khách sạn</Link></li>
              <li><Link to="/articles" className="transition hover:text-white">Cẩm nang du lịch</Link></li>
              <li><Link to="/booking-lookup" className="transition hover:text-white">Tra cứu đặt phòng</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Hỗ trợ</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/contact" className="transition hover:text-white">Liên hệ</Link></li>
              <li><Link to="/articles" className="transition hover:text-white">Hướng dẫn đặt phòng</Link></li>
              <li><Link to="/articles" className="transition hover:text-white">Chính sách hủy phòng</Link></li>
              <li><Link to="/articles" className="transition hover:text-white">Điều khoản sử dụng</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Kết nối</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>support@2thotel.vn</li>
              <li>+84 900 000 000</li>
              <li>TP. Hồ Chí Minh, Việt Nam</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} 2T Hotel. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

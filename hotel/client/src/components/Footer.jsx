import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative mt-0 overflow-hidden bg-primary text-slate-300 border-t border-border/10">
      {/* Delicate background illumination */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,154,69,0.08),transparent_50%)]" />
      <div className="absolute -left-32 top-24 h-64 w-64 rounded-full bg-accent/5 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 pb-12 pt-16">
        {/* Footer Top Banner */}
        <div className="mb-16 rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-10 backdrop-blur-sm md:flex md:items-center md:justify-between transition-all duration-300 hover:border-accent/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Stay different</span>
            <h3 className="mt-2 text-2xl font-medium text-white font-serif-display leading-tight">
              Khám phá thế giới nghỉ dưỡng thượng lưu cùng 2T Hotel
            </h3>
            <p className="mt-2 text-xs tracking-wide text-slate-400">
              Lên lịch trình hoàn hảo cho chuyến đi tiếp theo của bạn chỉ trong vài bước.
            </p>
          </div>
          <Link 
            to="/hotels" 
            className="mt-6 inline-flex items-center justify-center rounded-full bg-accent hover:bg-white hover:text-primary border border-accent hover:border-white px-7 py-3 text-xs font-semibold uppercase tracking-widest text-white shadow-lg transition-all duration-300 md:mt-0"
          >
            Khám phá khách sạn
          </Link>
        </div>

        {/* Footer Links Grid */}
        <div className="grid gap-12 md:grid-cols-4 border-b border-white/5 pb-12">
          {/* Brand Info */}
          <div>
            <h3 className="text-xl font-medium tracking-widest text-white font-serif-display">2T HOTEL</h3>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              Nền tảng đặt phòng chuỗi khách sạn boutique & resort cao cấp, ưu tiên tính minh bạch, sự tinh tế trong dịch vụ và trải nghiệm tinh hoa.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Điều hướng</h4>
            <ul className="space-y-3.5 text-xs text-slate-400">
              <li><Link to="/" className="transition-colors duration-300 hover:text-accent">Trang chủ</Link></li>
              <li><Link to="/hotels" className="transition-colors duration-300 hover:text-accent">Danh sách khách sạn</Link></li>
              <li><Link to="/articles" className="transition-colors duration-300 hover:text-accent">Cẩm nang du lịch</Link></li>
              <li><Link to="/booking-lookup" className="transition-colors duration-300 hover:text-accent">Tra cứu đặt phòng</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Hỗ trợ</h4>
            <ul className="space-y-3.5 text-xs text-slate-400">
              <li><Link to="/contact" className="transition-colors duration-300 hover:text-accent">Liên hệ chúng tôi</Link></li>
              <li><Link to="/articles" className="transition-colors duration-300 hover:text-accent">Hướng dẫn đặt phòng</Link></li>
              <li><Link to="/articles" className="transition-colors duration-300 hover:text-accent">Chính sách hủy phòng</Link></li>
              <li><Link to="/articles" className="transition-colors duration-300 hover:text-accent">Điều khoản sử dụng</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Kết nối</h4>
            <ul className="space-y-3.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-accent">✉</span> support@2thotel.vn
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">☎</span> +84 900 000 000
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">📍</span> TP. Hồ Chí Minh, Việt Nam
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between text-[10px] tracking-widest uppercase text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} 2T HOTEL. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

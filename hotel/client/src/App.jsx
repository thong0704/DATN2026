import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Spinner from './components/Spinner';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { useMeQuery } from './features/auth/authApi';
import { setUser } from './features/auth/authSlice';
import Chatbot from './components/Chatbot';
import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';
import { toast } from 'react-toastify';


const HomePage = lazy(() => import('./pages/HomePage'));
const HotelListPage = lazy(() => import('./pages/HotelListPage'));
const HotelDetailPage = lazy(() => import('./pages/HotelDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const BookingLookupPage = lazy(() => import('./pages/BookingLookupPage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const VNPayReturnPage = lazy(() => import('./pages/VNPayReturnPage'));
const MoMoReturnPage = lazy(() => import('./pages/MoMoReturnPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordPages';


const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const DashboardOverview = lazy(() => import('./pages/admin/DashboardOverview'));
const BookingManagement = lazy(() => import('./pages/admin/BookingManagement'));
const HotelManagement = lazy(() => import('./pages/admin/HotelManagement'));
const RoomManagement = lazy(() => import('./pages/admin/RoomManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const FrontDeskPage = lazy(() => import('./pages/admin/FrontDeskPage'));
const CouponManagement = lazy(() => import('./pages/admin/CouponManagement'));
const DynamicPricingManagement = lazy(() => import('./pages/admin/DynamicPricingManagement'));
const ArticleManagement = lazy(() => import('./pages/admin/ArticleManagement'));
const ContactInbox = lazy(() => import('./pages/admin/ContactInbox'));
const BannerManagement = lazy(() => import('./pages/admin/BannerManagement'));
const InvoiceManagement = lazy(() => import('./pages/admin/InvoiceManagement'));
const SupportChat = lazy(() => import('./pages/admin/SupportChat'));
const MyInvoicesPage = lazy(() => import('./pages/MyInvoicesPage'));

function PublicShell({ children }) {
  const location = useLocation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .line-draw');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [location.pathname, children]);

  return (
    <div className="relative overflow-hidden min-h-screen flex flex-col justify-between">
      {}
      <div className="ambient-shape ambient-shape-1 top-20 -left-24" />
      <div className="ambient-shape ambient-shape-2 top-[35%] -right-32" />
      
      <Navbar />
      <main className="flex-1 min-h-[62vh]">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const { data: me } = useMeQuery(undefined, { skip: !isAuthenticated });

  useEffect(() => {
    if (me?.data?.user) dispatch(setUser(me.data.user));
  }, [me, dispatch]);

  useSocket();

  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('[Global Event Error]', event.error || event.message);
      const msg = event.error?.message || event.message || 'Lỗi không xác định';
      toast.error(`Đã xảy ra lỗi hệ thống: ${msg}`);
    };

    const handleUnhandledRejection = (event) => {
      console.error('[Unhandled Promise Rejection]', event.reason);
      const reason = event.reason;
      const msg = reason?.data?.message || reason?.message || 'Không thể kết nối tới máy chủ hoặc lỗi xử lý.';
      toast.error(`Lỗi bất đồng bộ: ${msg}`);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<Spinner className="py-16" />}>
        <Routes>
          {/* Public site */}
          <Route path="/" element={<PublicShell><HomePage /></PublicShell>} />
          <Route path="/hotels" element={<PublicShell><HotelListPage /></PublicShell>} />
          <Route path="/hotels/:slug" element={<PublicShell><HotelDetailPage /></PublicShell>} />
          <Route path="/booking-lookup" element={<PublicShell><BookingLookupPage /></PublicShell>} />
          <Route path="/articles" element={<PublicShell><ArticlesPage /></PublicShell>} />
          <Route path="/articles/:slug" element={<PublicShell><ArticleDetailPage /></PublicShell>} />
          <Route path="/contact" element={<PublicShell><ContactPage /></PublicShell>} />
          <Route path="/login" element={<PublicShell><LoginPage /></PublicShell>} />
          <Route path="/register" element={<PublicShell><RegisterPage /></PublicShell>} />
          <Route path="/forgot-password" element={<PublicShell><ForgotPasswordPage /></PublicShell>} />
          <Route path="/reset-password" element={<PublicShell><ResetPasswordPage /></PublicShell>} />

          {/* Customer-protected */}
          <Route path="/booking" element={<ProtectedRoute><PublicShell><BookingPage /></PublicShell></ProtectedRoute>} />
          <Route path="/payment/:bookingId" element={<ProtectedRoute><PublicShell><PaymentPage /></PublicShell></ProtectedRoute>} />
          <Route path="/payment/vnpay-return" element={<PublicShell><VNPayReturnPage /></PublicShell>} />
          <Route path="/payment/momo-return" element={<PublicShell><MoMoReturnPage /></PublicShell>} />
          <Route path="/booking-confirmation/:id" element={<ProtectedRoute><PublicShell><BookingConfirmationPage /></PublicShell></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><PublicShell><MyBookingsPage /></PublicShell></ProtectedRoute>} />
          <Route path="/my-invoices" element={<ProtectedRoute><PublicShell><MyInvoicesPage /></PublicShell></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><PublicShell><ProfilePage /></PublicShell></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><PublicShell><WishlistPage /></PublicShell></ProtectedRoute>} />

          {/* Admin / Staff */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin', 'manager', 'staff']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardOverview />} />
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="invoices" element={<InvoiceManagement />} />
            <Route path="hotels" element={<HotelManagement />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="front-desk" element={<FrontDeskPage />} />
            <Route path="coupons" element={<CouponManagement />} />
            <Route path="dynamic-pricing" element={<DynamicPricingManagement />} />
            <Route path="banners" element={<BannerManagement />} />
            <Route path="articles" element={<ArticleManagement />} />
            <Route path="contacts" element={<ContactInbox />} />
            <Route path="chat" element={<SupportChat />} />
          </Route>

          <Route path="*" element={<PublicShell><NotFoundPage /></PublicShell>} />
        </Routes>
      </Suspense>
      {!isAdminPage && (
        <>
          <Chatbot />
          <ChatWidget />
        </>
      )}
    </ErrorBoundary>
  );
}

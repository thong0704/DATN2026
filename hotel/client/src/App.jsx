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

// Lazy-loaded pages for code splitting
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
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordPages';

// Admin
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const DashboardOverview = lazy(() => import('./pages/admin/DashboardOverview'));
const BookingManagement = lazy(() => import('./pages/admin/BookingManagement'));
const HotelManagement = lazy(() => import('./pages/admin/HotelManagement'));
const RoomManagement = lazy(() => import('./pages/admin/RoomManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const FrontDeskPage = lazy(() => import('./pages/admin/FrontDeskPage'));
const CouponManagement = lazy(() => import('./pages/admin/CouponManagement'));
const ArticleManagement = lazy(() => import('./pages/admin/ArticleManagement'));
const ContactInbox = lazy(() => import('./pages/admin/ContactInbox'));
const BannerManagement = lazy(() => import('./pages/admin/BannerManagement'));
const InvoiceManagement = lazy(() => import('./pages/admin/InvoiceManagement'));
const MyInvoicesPage = lazy(() => import('./pages/MyInvoicesPage'));

function PublicShell({ children }) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.08),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.07),transparent_34%)]" />
      <Navbar />
      <main className="min-h-[62vh]">{children}</main>
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

  return (
    <ErrorBoundary>
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
          <Route path="/reset-password/:token" element={<PublicShell><ResetPasswordPage /></PublicShell>} />

          {/* Customer-protected */}
          <Route path="/booking" element={<ProtectedRoute><PublicShell><BookingPage /></PublicShell></ProtectedRoute>} />
          <Route path="/payment/:bookingId" element={<ProtectedRoute><PublicShell><PaymentPage /></PublicShell></ProtectedRoute>} />
          <Route path="/payment/vnpay-return" element={<PublicShell><VNPayReturnPage /></PublicShell>} />
          <Route path="/payment/momo-return" element={<PublicShell><MoMoReturnPage /></PublicShell>} />
          <Route path="/booking-confirmation/:id" element={<ProtectedRoute><PublicShell><BookingConfirmationPage /></PublicShell></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><PublicShell><MyBookingsPage /></PublicShell></ProtectedRoute>} />
          <Route path="/my-invoices" element={<ProtectedRoute><PublicShell><MyInvoicesPage /></PublicShell></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><PublicShell><ProfilePage /></PublicShell></ProtectedRoute>} />

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
            <Route path="banners" element={<BannerManagement />} />
            <Route path="articles" element={<ArticleManagement />} />
            <Route path="contacts" element={<ContactInbox />} />
          </Route>

          <Route path="*" element={<PublicShell><NotFoundPage /></PublicShell>} />
        </Routes>
      </Suspense>
      {!isAdminPage && <Chatbot />}
    </ErrorBoundary>
  );
}

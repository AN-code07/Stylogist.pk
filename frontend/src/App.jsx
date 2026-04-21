import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
// Storefront critical path — ship on first paint.
import Home from './commonpages/Home'
import Navbar from './commonpages/Navbar'
import Footer from './commonpages/Footer'
import ScrollToTop from './commonpages/ScrollToTop'
import RouteLoader from './components/common/RouteLoader'
import Seo from './components/common/Seo'

// Everything below is lazy-loaded. Only the home page ships in the initial
// bundle — category/product detail and the rest load on demand so the
// landing-page TTI stays tight.
const CategoryPage = lazy(() => import('./components/category/CategoryPage'))
const ProductDetailsPage = lazy(() => import('./commonpages/SingleProductPage'))
const About = lazy(() => import('./commonpages/About'))
const Contact = lazy(() => import('./commonpages/Contact'))
const HotDeals = lazy(() => import('./commonpages/HotDeals'))
const TermsPrivacy = lazy(() => import('./commonpages/TermsPrivacy'))
const CartPage = lazy(() => import('./commonpages/CartPage'))
const WishlistPage = lazy(() => import('./commonpages/WishlistPage'))
const CheckoutPage = lazy(() => import('./commonpages/checkoutPage'))
const PageNotFound = lazy(() => import('./commonpages/PageNotFound'))
const Login = lazy(() => import('./commonpages/Login'))
const Signup = lazy(() => import('./commonpages/Signup'))
const ForgotPassword = lazy(() => import('./commonpages/ForgotPassword'))
const EnterOTP = lazy(() => import('./commonpages/OTPpage'))
const ResetPassword = lazy(() => import('./commonpages/resetPasswordPage'))
const UserProfile = lazy(() => import('./Dashboard/UserProfile'))

// Admin: always lazy — storefront users must never download this.
const AdminLayout = lazy(() => import('./AdminDashboard/layout/AdminLayout'))
const AdminDashboard = lazy(() => import('./AdminDashboard/pages/Dashboard'))
const ProductManage = lazy(() => import('./AdminDashboard/pages/ProductManage'))
const OrderLogs = lazy(() => import('./AdminDashboard/pages/OrderLogs'))
const UserControl = lazy(() => import('./AdminDashboard/pages/UserControl'))
const ReviewManage = lazy(() => import('./AdminDashboard/pages/ReviewManage'))
const RevenueAnalytics = lazy(() => import('./AdminDashboard/pages/RevenueAnalytics'))
const CategoryManage = lazy(() => import('./AdminDashboard/pages/CategoryManage'))
const BrandManage = lazy(() => import('./AdminDashboard/pages/BrandManage'))
const AdminSettings = lazy(() => import('./AdminDashboard/pages/AdminSettings'))

// Lightweight fallback while a lazy chunk is fetched. Uses the branded
// double-ring spinner (see .brand-spinner in index.css) so the loading
// state feels on-theme rather than a generic stock indicator.
const PageSuspense = ({ children }) => (
  <Suspense fallback={
    <div className="min-h-[60vh] flex items-center justify-center" aria-live="polite" role="status">
      <div className="brand-spinner" aria-label="Loading">
        <span className="brand-spinner__ring" />
        <span className="brand-spinner__mark">S</span>
      </div>
    </div>
  }>
    {children}
  </Suspense>
)


const MainLayout = () => {
  return (
    <div>
      {/* Default site-wide SEO — per-page <Seo /> components override these. */}
      <Seo
        title="Stylogist.pk — Curated fashion, beauty & lifestyle"
        description="Shop hand-picked fashion, beauty and lifestyle essentials with free shipping and cash on delivery across Pakistan."
        type="website"
      />
      <RouteLoader />
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <ScrollToTop />
      <main id="main-content" tabIndex={-1}>
        <PageSuspense>
          <Outlet />
        </PageSuspense>
      </main>
      <Footer />
    </div>
  )
}

const route = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/about",
        element: <About />
      },
      {
        path: "/contact",
        element: <Contact />
      },
      {
        path: "/deals",
        element: <HotDeals />
      },
      {
        path: "/category",
        element: <CategoryPage />
      },
      {
        path: "/terms",
        element: <TermsPrivacy />
      },
      {
        path: "/privacy",
        element: <TermsPrivacy />
      },


      {
        path: "/product/:slug",
        element: <ProductDetailsPage />
      },
      {
        path: "/cart",
        element: <CartPage />
      },
      {
        path: "/checkout",
        element: <CheckoutPage />
      },
      {
        path: "/wishlist",
        element: <WishlistPage />
      },

    ]
  },

  { path: '*', element: <PageSuspense><PageNotFound /></PageSuspense> },
  { path: '/login', element: <PageSuspense><Login /></PageSuspense> },
  { path: '/signup', element: <PageSuspense><Signup /></PageSuspense> },
  { path: '/forgot-password', element: <PageSuspense><ForgotPassword /></PageSuspense> },
  { path: '/verify-otp', element: <PageSuspense><EnterOTP /></PageSuspense> },
  { path: '/reset-password', element: <PageSuspense><ResetPassword /></PageSuspense> },
  { path: '/profile', element: <PageSuspense><UserProfile /></PageSuspense> },

  // admin Routes — fully lazy so the storefront bundle never includes them.

  {
    path: '/admin',
    element: <PageSuspense><AdminLayout /></PageSuspense>,
    children: [
      { path: 'overview', element: <PageSuspense><AdminDashboard /></PageSuspense> },
      { path: 'analytics', element: <PageSuspense><RevenueAnalytics /></PageSuspense> },
      { path: 'products', element: <PageSuspense><ProductManage /></PageSuspense> },
      { path: 'categories', element: <PageSuspense><CategoryManage /></PageSuspense> },
      { path: 'brands', element: <PageSuspense><BrandManage /></PageSuspense> },
      { path: 'orders', element: <PageSuspense><OrderLogs /></PageSuspense> },
      { path: 'users', element: <PageSuspense><UserControl /></PageSuspense> },
      { path: 'reviews', element: <PageSuspense><ReviewManage /></PageSuspense> },
      { path: 'settings', element: <PageSuspense><AdminSettings /></PageSuspense> },
    ]
  },


])
export default function App() {
  return <RouterProvider router={route} />
}

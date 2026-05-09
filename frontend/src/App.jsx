import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { queryClient } from './main'
import { productBySlugQuery } from './features/products/useProductHooks'
// Storefront critical path — ship on first paint.
import Home from './commonpages/Home'
import Navbar from './commonpages/Navbar'
import Footer from './commonpages/Footer'
import ScrollToTop from './commonpages/ScrollToTop'
import RouteLoader from './components/common/RouteLoader'
import PageLoader from './components/common/PageLoader'
import ProtectedRoute from './components/common/ProtectedRoute'
import Seo from './components/common/Seo'
import GlobalSeo from './components/common/GlobalSeo'
import WhatsAppFab from './components/common/WhatsAppFab'

// Everything below is lazy-loaded. Only the home page ships in the initial
// bundle — category/product detail and the rest load on demand so the
// landing-page TTI stays tight.
// Unified listing page — powers /products, /category/:slug, /brand/:slug,
// /ingredient/:slug. Filters travel via body (FilterStore → POST
// /products/search) so URLs stay clean for SEO.
const ProductsPage = lazy(() => import('./components/products/ProductsPage'))
const ProductDetailsPage = lazy(() => import('./commonpages/SingleProductPage'))
const AllCategoriesPage = lazy(() => import('./commonpages/AllCategoriesPage'))
const AllBrandsPage = lazy(() => import('./commonpages/AllBrandsPage'))
const AllIngredientsPage = lazy(() => import('./commonpages/AllIngredientsPage'))
const About = lazy(() => import('./commonpages/About'))
const Contact = lazy(() => import('./commonpages/Contact'))
const HotDeals = lazy(() => import('./commonpages/HotDeals'))
const TermsPrivacy = lazy(() => import('./commonpages/TermsPrivacy'))
const CartPage = lazy(() => import('./commonpages/CartPage'))
const WishlistPage = lazy(() => import('./commonpages/WishlistPage'))
const CheckoutPage = lazy(() => import('./commonpages/checkoutPage'))
const PageNotFound = lazy(() => import('./commonpages/PageNotFound'))
const SearchResults = lazy(() => import('./commonpages/SearchResults'))
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
const IngredientManage = lazy(() => import('./AdminDashboard/pages/IngredientManage'))
const AdminSettings = lazy(() => import('./AdminDashboard/pages/AdminSettings'))
const StaffPermissions = lazy(() => import('./AdminDashboard/pages/StaffPermissions'))

// Lightweight fallback while a lazy chunk is fetched. Uses the branded
// double-ring spinner (see .brand-spinner in index.css) so the loading
// state feels on-theme rather than a generic stock indicator.
// Inline spinner used as the Suspense fallback while a lazy route chunk
// is fetched. Mirrors the full-screen PageLoader styling (dim track ring
// + rotating teal/cyan arc + centered logo disc + bouncing dots label)
// so loading states feel consistent across the app.
const BrandSpinner = ({ label = 'Loading' }) => (
  <div className="flex flex-col items-center gap-5" aria-label={label}>
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-[2.5px] border-[#007074]/10" />
      <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-[#007074] border-r-[#0a8c91] brand-ring" />
      <div className="absolute inset-[14%] rounded-full bg-white shadow-[0_8px_20px_rgba(0,112,116,0.15)] flex items-center justify-center">
        <img src="/logo.png" alt="" className="w-[72%] h-[72%] object-contain" draggable={false} />
      </div>
    </div>
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] tracking-[0.4em] uppercase text-[#007074] font-semibold">{label}</span>
      <div className="flex gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#007074] brand-dot brand-dot--1" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#0a8c91] brand-dot brand-dot--2" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#7FD4D7] brand-dot brand-dot--3" />
      </div>
    </div>
  </div>
)

const PageSuspense = ({ children }) => (
  <Suspense fallback={
    <div className="min-h-[60vh] flex items-center justify-center" aria-live="polite" role="status">
      <BrandSpinner />
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
        title="HarbalMart.pk — Curated fashion, beauty & lifestyle"
        description="Shop hand-picked fashion, beauty and lifestyle essentials with free shipping and cash on delivery across Pakistan."
        type="website"
      />
      {/* Global structured data: WebSite (sitelinks search box) + OnlineStore
          (knowledge panel signals). Sits alongside per-page Product / FAQ
          schemas so search engines see one canonical brand entity. */}
      <GlobalSeo />
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
      <WhatsAppFab />
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
      // ── 4 canonical SEO product routes ───────────────────────────
      // Each renders the same ProductsPage component but with a
      // different scope. Filters are body-only (POST /products/search)
      // so these URLs stay clean and crawlable.
      {
        path: "/products",
        element: <ProductsPage scopeType="all" />,
      },
      {
        path: "/category/:slug",
        element: <ProductsPage scopeType="category" />,
      },
      {
        path: "/brand/:slug",
        element: <ProductsPage scopeType="brand" />,
      },
      {
        path: "/ingredient/:slug",
        element: <ProductsPage scopeType="ingredient" />,
      },

      // ── Listing index pages ──────────────────────────────────────
      {
        path: "/categories",
        element: <AllCategoriesPage />,
      },
      {
        path: "/brands",
        element: <AllBrandsPage />,
      },
      {
        path: "/ingredients",
        element: <AllIngredientsPage />,
      },

      // Legacy aliases — keep crawlers from 404'ing existing inbound links.
      {
        path: "/products/all",
        element: <ProductsPage scopeType="all" />,
      },

      {
        path: "/search",
        element: <SearchResults />
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
        // Loader prefetches the product into the React Query cache before
        // the component renders. By the time <ProductDetailsPage /> mounts,
        // `useProduct(slug)` resolves synchronously from cache → JSON-LD
        // ships in the very first DOM commit, fixing the "Product not found"
        // false negative on the schema markup validator.
        loader: async ({ params }) => {
          const slug = params.slug;
          if (!slug) return null;
          try {
            await queryClient.prefetchQuery(productBySlugQuery(slug));
          } catch {
            // Network/404 errors are surfaced by the component's own error
            // boundary; the loader never throws so navigation isn't blocked.
          }
          return null;
        },
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

  // Customer dashboard: must be logged in. Redirects to /login with a
  // `from` state so the login screen can bounce back here after auth.
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <PageSuspense><UserProfile /></PageSuspense>
      </ProtectedRoute>
    ),
  },

  // Admin console: locked to Super Admin only. All child routes inherit the
  // guard by wrapping the layout itself; a non-admin user is redirected to
  // the storefront home before any admin chunk is executed.
  {
    path: '/admin',
    element: (
      <ProtectedRoute adminOnly>
        <PageSuspense><AdminLayout /></PageSuspense>
      </ProtectedRoute>
    ),
    children: [
      { path: 'overview', element: <PageSuspense><AdminDashboard /></PageSuspense> },
      { path: 'analytics', element: <PageSuspense><RevenueAnalytics /></PageSuspense> },
      { path: 'products', element: <PageSuspense><ProductManage /></PageSuspense> },
      { path: 'categories', element: <PageSuspense><CategoryManage /></PageSuspense> },
      { path: 'brands', element: <PageSuspense><BrandManage /></PageSuspense> },
      { path: 'ingredients', element: <PageSuspense><IngredientManage /></PageSuspense> },
      { path: 'orders', element: <PageSuspense><OrderLogs /></PageSuspense> },
      { path: 'users', element: <PageSuspense><UserControl /></PageSuspense> },
      { path: 'reviews', element: <PageSuspense><ReviewManage /></PageSuspense> },
      { path: 'staff', element: <PageSuspense><StaffPermissions /></PageSuspense> },
      { path: 'settings', element: <PageSuspense><AdminSettings /></PageSuspense> },
    ]
  },


])
export default function App() {
  return (
    <>
      <PageLoader />
      <RouterProvider router={route} />
    </>
  )
}

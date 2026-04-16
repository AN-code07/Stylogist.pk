import React from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import Home from './commonpages/Home'
import Navbar from './commonpages/Navbar'
import Footer from './commonpages/Footer'
import Login from './commonpages/Login'
import Signup from './commonpages/Signup'
import About from './commonpages/About'
import Contact from './commonpages/Contact'
import HotDeals from './commonpages/HotDeals'
import CategoryPage from './components/category/CategoryPage'
import ForgotPassword from './commonpages/ForgotPassword'
import TermsPrivacy from './commonpages/TermsPrivacy'
import ProductDetailsPage from './commonpages/SingleProductPage'
import CartPage from './commonpages/CartPage'
import WishlistPage from './commonpages/WishlistPage'
import CheckoutPage from './commonpages/checkoutPage'
import PageNotFound from './commonpages/PageNotFound'
import UserProfile from './Dashboard/UserProfile'
import AdminLayout from './AdminDashboard/layout/AdminLayout'
import AdminDashboard from './AdminDashboard/pages/Dashboard'
import ProductManage from './AdminDashboard/pages/ProductManage'
import OrderLogs from './AdminDashboard/pages/OrderLogs'
import UserControl from './AdminDashboard/pages/UserControl'
import ReviewManage from './AdminDashboard/pages/ReviewManage'
import RevenueAnalytics from './AdminDashboard/pages/RevenueAnalytics'
import CategoryManage from './AdminDashboard/pages/CategoryManage'
import BrandManage from './AdminDashboard/pages/BrandManage'
import AdminSettings from './AdminDashboard/pages/AdminSettings'
import ScrollToTop from './commonpages/ScrollToTop'
import EnterOTP from './commonpages/OTPpage'
import ResetPassword from './commonpages/resetPasswordPage'


const MainLayout = () => {
  return (
    <div>
      <Navbar />
      <ScrollToTop />
      <Outlet />
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

  { path: '*', element: <PageNotFound /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/verify-otp", element: <EnterOTP /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/profile", element: <UserProfile /> },

  // admin Routes

  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { path: "overview", element: <AdminDashboard /> },
      { path: "analytics", element: <RevenueAnalytics /> },
      { path: "products", element: <ProductManage /> },
      { path: "categories", element: <CategoryManage /> },
      { path: "brands", element: <BrandManage /> },
      { path: "orders", element: <OrderLogs /> },
      { path: "users", element: <UserControl /> },
      { path: "reviews", element: <ReviewManage /> },
      { path: "settings", element: <AdminSettings /> },
    ]
  },


])
export default function App() {
  return <RouterProvider router={route} />
}

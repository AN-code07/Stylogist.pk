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


const MainLayout = () => {
  return (
    <div>
      <Navbar />
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
     

    ]
  },

  { path: '*', element: <h1>404 Not Found</h1> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  {
    path: "/forgot-password",
    element: <ForgotPassword />
  },
])
export default function App() {
  return <RouterProvider router={route} />
}

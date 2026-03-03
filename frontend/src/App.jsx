import React from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import Home from './commonpages/Home'
import Navbar from './commonpages/Navbar'
import Footer from './commonpages/Footer'
import Login from './commonpages/Login'
import Signup from './commonpages/Signup'
import About from './commonpages/About'
import Contact from './commonpages/Contact'


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
        element: <Contact  />
      },
    ]
  },

  { path: '*', element: <h1>404 Not Found</h1> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> }
])
export default function App() {
  return <RouterProvider router={route} />
}

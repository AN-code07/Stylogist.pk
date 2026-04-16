import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiBox, FiShoppingBag, FiUsers, FiSettings,
  FiLogOut, FiMessageSquare, FiBarChart2, FiMenu, FiX, FiTag, FiFolder
} from 'react-icons/fi';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Manages visibility on small screens
  const navigate = useNavigate();

  const links = [
    { name: 'Overview', path: '/admin/overview', icon: <FiGrid /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <FiBarChart2 /> },
    { name: 'Products', path: '/admin/products', icon: <FiBox /> },
    { name: 'Categories', path: '/admin/categories', icon: <FiFolder /> },
    { name: 'Brands', path: '/admin/brands', icon: <FiTag /> },
    { name: 'Orders', path: '/admin/orders', icon: <FiShoppingBag /> },
    { name: 'Customers', path: '/admin/users', icon: <FiUsers /> },
    { name: 'Reviews', path: '/admin/reviews', icon: <FiMessageSquare /> },
    { name: 'Settings', path: '/admin/settings', icon: <FiSettings /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      {/* MOBILE TRIGGER: Visible only on small/medium screens */}
      <div className="lg:hidden fixed top-6 md:top-4 left-1 md:left-4 z-50">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-1 md:p-3 bg-[#1E293B] text-white rounded-md md:rounded-xl shadow-lg border border-slate-700 hover:bg-[#007074] transition-colors"
        >
          <FiMenu size={20} />
        </button>
      </div>

      {/* BACKDROP: Closes the sidebar when clicking outside on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR ASIDE: slide-out on mobile, static on desktop */}
      <aside className={`
        fixed lg:static top-0 left-0 h-full w-64 bg-[#1E293B] flex flex-col shrink-0 z-[60]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* HEADER: Added a close button for mobile UX */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#007074] rounded-lg flex items-center justify-center font-bold text-white shadow-lg">S</div>
            <span className="text-white font-black tracking-tighter uppercase text-sm">Stylogist Admin</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* NAV LINKS — no vertical scroll. Items are tightened so all fit on standard heights. */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-md text-xs uppercase tracking-widest transition-all
                ${isActive
                  ? 'bg-[#007074] text-white shadow-lg shadow-[#007074]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <span className="text-base">{link.icon}</span>
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT FOOTER */}
        <div className="p-4 border-t border-slate-700/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 text-xs font-semibold uppercase tracking-widest hover:bg-red-500/10 rounded-xl transition-all"
          >
            <FiLogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
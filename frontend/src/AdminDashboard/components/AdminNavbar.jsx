import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiExternalLink, FiChevronDown, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import useAuthStore from '../../store/useAuthStore';
import { useLogout } from '../../features/auth/useAuthHooks';

export default function AdminNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending: loggingOut } = useLogout();

  // Close the profile menu on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const name = user?.name || 'Admin';
  const role = user?.role || '—';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-5 md:px-8 shrink-0 relative z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Dashboard</h2>
      </div>

      <div className="flex items-center gap-2">
        {/* View live site — the one action that actually means something from an admin screen. */}
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          title="Open storefront in a new tab"
        >
          <FiExternalLink size={13} /> View site
        </Link>

        <span className="hidden md:block w-px h-6 bg-slate-200 mx-1" />

        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-md hover:bg-slate-50"
          >
            <div className="w-8 h-8 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-medium text-slate-900 leading-tight">{name}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{role}</div>
            </div>
            <FiChevronDown size={13} className="text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-900 truncate">{name}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email || ''}</div>
              </div>
              <nav className="p-1.5">
                <Link
                  to="/admin/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007074]"
                >
                  <FiSettings size={14} /> Settings
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007074]"
                >
                  <FiUser size={14} /> Customer profile
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 mt-0.5 border-t border-slate-100 disabled:opacity-60"
                >
                  <FiLogOut size={14} /> Sign out
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

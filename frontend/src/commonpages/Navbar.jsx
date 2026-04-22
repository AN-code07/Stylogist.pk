import React, { useEffect, useState, memo } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiMenu, FiX, FiSearch, FiHeart, FiShoppingCart, FiUser, FiChevronDown,
  FiTruck, FiLogOut, FiPackage, FiLoader, FiGrid,
  FiChevronRight
} from 'react-icons/fi';

import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';

import { getLoginUser } from '../features/user/useUserHooks';
import { useLogout } from '../features/auth/useAuthHooks';
import { useCategories } from '../features/categories/useCategoryHooks';
import { useProducts } from '../features/products/useProductHooks';
import logo from "/logo.png"

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Keep session fresh
  getLoginUser();
  const { mutate: logout } = useLogout();

  const { data: categories = [] } = useCategories({ active: 'true' });
  const topCategories = categories.filter((c) => c.level === 0);

  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const location = useLocation();

  // Fast scroll listener with passive flag for better mobile performance
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled(scrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/category', isShop: true },
    { name: 'Deals', path: '/deals' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      {/* Thin announcement bar */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 text-center relative z-50">
        <div className="inline-flex items-center gap-2">
          <FiTruck className="text-[#5cc0c3]" size={12} />
          <span className="font-medium tracking-wide">Free nationwide delivery · Cash on Delivery available</span>
        </div>
      </div>

      {/* Main nav (ANIMATED ON SCROLL) */}
      <nav
        className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md transition-all duration-300 ease-in-out border-b ${isScrolled ? 'h-14 border-slate-200 shadow-md translate-z-0' : 'h-16 border-slate-100 shadow-none'
          }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 transition-transform duration-300 hover:scale-105">
            <img src={logo} alt="Stylogist" className={`transition-all duration-300 ${isScrolled ? 'w-[85px]' : 'w-[100px]'}`} />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group">
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                      ? 'text-[#007074] bg-[#007074]/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.name}
                  {link.isShop && topCategories.length > 0 && <FiChevronDown size={13} className="group-hover:rotate-180 transition-transform duration-200" />}
                </NavLink>

                {link.isShop && topCategories.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                    <div className="bg-white border border-slate-200 rounded-lg shadow-xl p-2 min-w-[220px]">
                      <Link to="/category" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007074]">
                        <FiGrid size={14} className="text-slate-400" /> All products
                      </Link>
                      <div className="h-px bg-slate-100 my-1" />
                      {topCategories.map((c) => (
                        <Link key={c._id} to={`/category?category=${c._id}`} className="block px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007074]">
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <IconBtn title="Search (Ctrl+K)" onClick={() => setIsSearchOpen(true)}>
              <FiSearch size={18} />
            </IconBtn>

            <IconBtn title="Wishlist" as={Link} to="/wishlist" badge={wishlistCount}>
              <FiHeart size={18} />
            </IconBtn>

            <IconBtn title="Cart" as={Link} to="/cart" badge={cartCount}>
              <FiShoppingCart size={18} />
            </IconBtn>

            <span className="hidden md:block w-px h-6 bg-slate-200 mx-1" />

            {isAuthenticated && user ? (
              <UserMenu user={user} onLogout={() => logout()} />
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-[#007074] transition-colors"
              >
                <FiUser size={15} /> Sign in
              </Link>
            )}

            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-md inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <FiMenu size={20} />
            </button>
          </div>
        </div>
      </nav>

      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <MobileMenu
        open={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        links={navLinks}
        categories={topCategories}
        user={user}
        isAuthenticated={isAuthenticated}
        onLogout={() => logout()}
      />
    </>
  );
}

/* ---------- Optimized Subcomponents ---------- */

const IconBtn = memo(function IconBtn({ children, title, onClick, as: As = 'button', badge, ...rest }) {
  return (
    <As
      title={title}
      onClick={onClick}
      className="relative w-9 h-9 rounded-md inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-[#007074] transition-all active:scale-90"
      {...rest}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#007074] text-white text-[10px] font-bold rounded-full inline-flex items-center justify-center shadow-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </As>
  );
});

const UserMenu = memo(function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const initials = (user.name || '?').split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const isAdmin = user.role === 'Super Admin' || user.role === 'Staff';

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className="inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-slate-50 transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center text-xs font-bold border border-[#007074]/10">
          {initials}
        </span>
        <span className="hidden xl:inline text-sm text-slate-700 max-w-[100px] truncate font-medium">{user.name}</span>
        <FiChevronDown size={13} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`absolute right-0 top-full pt-2 w-56 z-10 transition-all duration-200 ${open ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
        <div className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
          </div>
          <div className="p-1.5">
            <MenuItem to={isAdmin ? "/admin/overview" : "/profile"} icon={isAdmin ? <FiPackage size={14} /> : <FiUser size={14} />}>
              {isAdmin ? 'Admin panel' : 'My profile'}
            </MenuItem>
            <MenuItem to="/wishlist" icon={<FiHeart size={14} />}>Wishlist</MenuItem>
            <MenuItem to="/cart" icon={<FiShoppingCart size={14} />}>Cart</MenuItem>
            <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 mt-0.5 border-t border-slate-100 transition-colors">
              <FiLogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const MenuItem = memo(function MenuItem({ to, icon, children }) {
  return (
    <Link to={to} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007074] transition-colors">
      {icon} {children}
    </Link>
  );
});

/* ---------- Search & Mobile (Remain same logic, added simple transitions) ---------- */

function SearchOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) { setQ(''); setDebounced(''); }
  }, [open]);

  const enabled = debounced.length >= 2;
  const { data, isFetching } = useProducts(enabled ? { search: debounced, limit: 6 } : {});
  const results = enabled ? data?.items ?? [] : [];

  const handleSelect = (slug) => { onClose(); navigate(`/product/${slug}`); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!debounced) return;
    onClose();
    navigate(`/category?search=${encodeURIComponent(debounced)}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-2xl mx-auto mt-20 px-4 animate-in zoom-in-95 duration-200">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <FiSearch className="text-slate-400" size={18} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="flex-1 bg-transparent text-base outline-none" />
            {isFetching && enabled && <FiLoader className="animate-spin text-slate-400" size={16} />}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500">ESC</kbd>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100"><FiX size={16} /></button>
          </form>
          <div className="max-h-[60vh] overflow-y-auto">
            {!enabled ? <div className="p-8 text-center text-sm text-slate-500">Type 2+ characters to search.</div> :
              results.length === 0 && !isFetching ? <div className="p-8 text-center"><p className="text-sm text-slate-500">No match for "{debounced}".</p></div> :
                <ul className="py-2">
                  {results.map((p) => (
                    <li key={p._id}>
                      <button onClick={() => handleSelect(p.slug)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left">
                        <img src={p.image} className="w-10 h-10 rounded object-cover" />
                        <div className="flex-1 truncate text-sm font-medium">{p.name}</div>
                        <div className="text-sm font-bold text-[#007074]">{fmtPKR(p.minPrice)}</div>
                      </button>
                    </li>
                  ))}
                  <li className="border-t"><button onClick={handleSubmit} className="w-full px-4 py-3 text-sm font-bold text-[#007074] hover:bg-slate-50 flex justify-between">See all results <span>↵</span></button></li>
                </ul>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Professional Mobile menu ---------- */

/* ---------- Professional Mobile menu (Left Emerge) ---------- */

function MobileMenu({ open, onClose, links, categories, user, isAuthenticated, onLogout }) {
  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* CSS Animations */}
      <style>{`
        @keyframes customFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideFromLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes itemFadeSlide {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-backdrop { animation: customFadeIn 0.3s ease-out forwards; }
        .animate-drawer { animation: slideFromLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-item { opacity: 0; animation: itemFadeSlide 0.5s ease-out forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-backdrop"
        onClick={onClose}
      />

      {/* Sidebar: Slides in from the LEFT */}
      <aside className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col animate-drawer">

        {/* Header */}
        <header className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
          {/* <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#007074] rounded-lg flex items-center justify-center text-white text-xs font-bold">S</div>
            <span className="font-bold tracking-tight text-slate-900">Stylogist<span className="text-[#007074]">.pk</span></span>
          </div> */}
          {isAuthenticated && user && (
          <div
            className="px-0 py-4 bg-slate-50/50 flex items-center gap-3 animate-item"
            style={{ animationDelay: '100ms' }}
          >
            <div className="w-10 h-10 rounded-full bg-[#007074] text-white flex items-center justify-center text-sm font-bold shadow-sm">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{user.name}</div>
              <div className="text-[11px] text-slate-500 truncate uppercase tracking-tight">{user.email}</div>
            </div>
          </div>
        )}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 active:scale-90 transition-all cursor-pointer hover:text-red-600"
          >
            <FiX size={22} />
          </button>
        </header>

        {/* User Snapshot */}
        

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {links.map((l, i) => (
            <Link
              key={l.name}
              to={l.path}
              className="group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-[#007074]/5 hover:text-[#007074] transition-all animate-item"
              style={{ animationDelay: `${(i + 2) * 60}ms` }}
            >
              {l.name}
              <FiChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>
          ))}

          {/* Categories Section */}
          {categories.length > 0 && (
            <div
              className="mt-8 animate-item"
              style={{ animationDelay: `${(links.length + 2) * 60}ms` }}
            >
              <div className="px-4 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Browse Categories
              </div>
              <div className="grid grid-cols-1 gap-1">
                {categories.map((c) => (
                  <Link
                    key={c._id}
                    to={`/category?category=${c._id}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-600 hover:text-[#007074] transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <footer className="p-6 border-t border-slate-50 space-y-3 bg-white">
          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="w-full py-3.5 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors active:scale-[0.98]"
            >
              <FiLogOut size={16} /> Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="block w-full py-4 bg-[#222] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-center shadow-lg active:scale-[0.98] transition-all"
            >
              Sign In to Harbal Mart
            </Link>
          )}
        </footer>
      </aside>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiMenu, FiX, FiSearch, FiHeart, FiShoppingCart, FiUser, FiChevronDown,
  FiTruck, FiLogOut, FiPackage, FiLoader, FiGrid
} from 'react-icons/fi';

import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';

import { getLoginUser } from '../features/user/useUserHooks';
import { useLogout } from '../features/auth/useAuthHooks';
import { useCategories } from '../features/categories/useCategoryHooks';
import { useProducts } from '../features/products/useProductHooks';

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Keep session fresh — syncs the zustand store from /users/me.
  getLoginUser();
  const { mutate: logout } = useLogout();

  const { data: categories = [] } = useCategories({ active: 'true' });
  const topCategories = categories.filter((c) => c.level === 0);

  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setIsMobileOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  // Open the search overlay on Ctrl/Cmd+K.
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
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 text-center">
        <div className="inline-flex items-center gap-2">
          <FiTruck className="text-[#5cc0c3]" size={12} />
          <span className="font-medium tracking-wide">Free nationwide delivery · Cash on Delivery available</span>
        </div>
      </div>

      {/* Main nav */}
      <nav
        className={`sticky top-0 z-40 w-full bg-white border-b border-slate-100 transition-shadow ${
          isScrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-[#007074] rounded-lg flex items-center justify-center text-white font-semibold">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Stylogist<span className="text-[#007074]">.pk</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group">
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#007074] bg-[#007074]/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.name}
                  {link.isShop && topCategories.length > 0 && <FiChevronDown size={13} />}
                </NavLink>

                {/* Shop dropdown */}
                {link.isShop && topCategories.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[220px]">
                      <Link
                        to="/category"
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007074]"
                      >
                        <FiGrid size={14} className="text-slate-400" /> All products
                      </Link>
                      <div className="h-px bg-slate-100 my-1" />
                      {topCategories.map((c) => (
                        <Link
                          key={c._id}
                          to={`/category?category=${c._id}`}
                          className="block px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007074]"
                        >
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
            <IconBtn
              title="Search (Ctrl+K)"
              onClick={() => setIsSearchOpen(true)}
            >
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
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-[#007074]"
              >
                <FiUser size={15} /> Sign in
              </Link>
            )}

            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-md inline-flex items-center justify-center text-slate-600 hover:bg-slate-50"
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

/* ---------- subcomponents ---------- */

function IconBtn({ children, title, onClick, as: As = 'button', badge, ...rest }) {
  return (
    <As
      title={title}
      onClick={onClick}
      className="relative w-9 h-9 rounded-md inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-[#007074] transition-colors"
      {...rest}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#007074] text-white text-[10px] font-medium rounded-full inline-flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </As>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const initials = (user.name || '?')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isAdmin = user.role === 'Super Admin' || user.role === 'Staff';

  return (
    <div
      className="relative"
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className="inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-slate-50"
      >
        <span className="w-8 h-8 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center text-xs font-semibold">
          {initials}
        </span>
        <span className="hidden xl:inline text-sm text-slate-700 max-w-[100px] truncate">{user.name}</span>
        <FiChevronDown size={13} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-2 w-56 z-10">
          <div className="bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div className="text-sm font-medium text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
            <div className="p-1.5">
              {isAdmin ? (
                <MenuItem to="/admin/overview" icon={<FiPackage size={14} />}>
                  Admin panel
                </MenuItem>
              ) : (
                <MenuItem to="/profile" icon={<FiUser size={14} />}>
                  My profile
                </MenuItem>
              )}
              <MenuItem to="/wishlist" icon={<FiHeart size={14} />}>
                Wishlist
              </MenuItem>
              <MenuItem to="/cart" icon={<FiShoppingCart size={14} />}>
                Cart
              </MenuItem>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 mt-0.5 border-t border-slate-100"
              >
                <FiLogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ to, icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50 hover:text-[#007074]"
    >
      {icon} {children}
    </Link>
  );
}

/* ---------- Search overlay ---------- */

function SearchOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  // 250ms debounce so the user typing "silk dress" fires one request, not six.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Reset local state when the overlay closes so next open is fresh.
  useEffect(() => {
    if (!open) {
      setQ('');
      setDebounced('');
    }
  }, [open]);

  const enabled = debounced.length >= 2;
  const { data, isFetching } = useProducts(
    enabled ? { search: debounced, limit: 6 } : {}
  );
  // useProducts fires regardless; ignore its result if the query isn't ready.
  const results = enabled ? data?.items ?? [] : [];

  const handleSelect = (slug) => {
    onClose();
    navigate(`/product/${slug}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!debounced) return;
    onClose();
    navigate(`/category?search=${encodeURIComponent(debounced)}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-w-2xl mx-auto mt-20 px-4">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <FiSearch className="text-slate-400 flex-shrink-0" size={18} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
            {isFetching && enabled && <FiLoader className="animate-spin text-slate-400" size={16} />}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-500">
              ESC
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            >
              <FiX size={16} />
            </button>
          </form>

          <div className="max-h-[60vh] overflow-y-auto">
            {!enabled ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Type at least 2 characters to search.
              </div>
            ) : results.length === 0 && !isFetching ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No products match "{debounced}".</p>
                <button
                  onClick={handleSubmit}
                  className="mt-3 text-xs text-[#007074] hover:underline"
                >
                  Open full catalog search
                </button>
              </div>
            ) : (
              <ul className="py-2">
                {results.map((p) => (
                  <li key={p._id}>
                    <button
                      onClick={() => handleSelect(p.slug)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} width="48" height="48" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <FiPackage size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {p.brand?.name || p.category?.name || '—'}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 tabular-nums flex-shrink-0">
                        {fmtPKR(p.minPrice)}
                      </div>
                    </button>
                  </li>
                ))}
                <li className="border-t border-slate-100 mt-1">
                  <button
                    onClick={handleSubmit}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[#007074] hover:bg-slate-50"
                  >
                    <span>See all results</span>
                    <span className="text-xs text-slate-400">↵ Enter</span>
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Mobile menu ---------- */

function MobileMenu({ open, onClose, links, categories, user, isAuthenticated, onLogout }) {
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-[80%] max-w-sm bg-white shadow-xl flex flex-col">
        <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900">
            Stylogist<span className="text-[#007074]">.pk</span>
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <FiX size={16} />
          </button>
        </header>

        {isAuthenticated && user && (
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center text-xs font-semibold">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map((l) => (
            <Link
              key={l.name}
              to={l.path}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {l.name}
            </Link>
          ))}

          {categories.length > 0 && (
            <>
              <div className="pt-3 pb-1 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Categories
              </div>
              {categories.map((c) => (
                <Link
                  key={c._id}
                  to={`/category?category=${c._id}`}
                  className="block px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50"
                >
                  {c.name}
                </Link>
              ))}
            </>
          )}
        </nav>

        <footer className="border-t border-slate-100 p-3 space-y-1">
          {isAuthenticated ? (
            <>
              <MenuItem
                to={user?.role === 'Super Admin' || user?.role === 'Staff' ? '/admin/overview' : '/profile'}
                icon={<FiUser size={14} />}
              >
                {user?.role === 'Super Admin' || user?.role === 'Staff' ? 'Admin panel' : 'My profile'}
              </MenuItem>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
              >
                <FiLogOut size={14} /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="block px-3 py-2 rounded-md text-sm font-medium text-[#007074] bg-[#007074]/10 hover:bg-[#007074]/20 text-center"
            >
              Sign in
            </Link>
          )}
        </footer>
      </aside>
    </div>
  );
}

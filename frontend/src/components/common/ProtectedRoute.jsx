import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore, { hadSession } from '../../store/useAuthStore';
import { useMe } from '../../features/user/useUserHooks';
import PageLoader from './PageLoader';

// Guards a route that requires an authenticated user. Reads the zustand
// store (hydrated by /users/me via useMe on mount) and falls back to the
// localStorage hint so a hard refresh on a protected page still waits for
// the cookie check before redirecting.
export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Kick off /users/me; this is the single source of truth on a cold load.
  const { isLoading, isFetching, isError } = useMe();

  // Fresh tab load: store says not-authed but we have the localStorage flag.
  // Show the branded loader while the cookie check is still in flight rather
  // than flashing the login redirect.
  const resolving = (isLoading || isFetching) && !isAuthenticated && hadSession() && !isError;
  if (resolving) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Admin console is locked to Super Admin only (per product spec). Other
  // roles — even Staff — get bounced to the storefront home.
  if (adminOnly && user?.role !== 'Super Admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

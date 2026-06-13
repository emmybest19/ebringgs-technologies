import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** One or more roles allowed to access this route. */
  allow: UserRole | UserRole[];
  /** Where to send unauthenticated users. Defaults to /login. */
  redirectTo?: string;
}

/**
 * Gates a route by authentication + role. Unauthenticated users are sent to
 * `redirectTo` (default /login) with a `next` query param so they can return.
 * Authenticated users without the right role are sent to /.
 */
export default function ProtectedRoute({ children, allow, redirectTo = '/login' }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?next=${next}`} replace />;
  }

  const allowedRoles = Array.isArray(allow) ? allow : [allow];
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

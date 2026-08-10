import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — guards access based on:
 *   • token presence  (user must be logged in)
 *   • role            (allowedRoles must include user.role)
 *   • profileComplete (when requireProfile=true, org must have completed profile)
 *
 * Redirect logic:
 *   • No token           → /auth
 *   • Wrong role         → /
 *   • Org, profile incomplete, but requireProfile=true → /complete-profile
 */
export default function ProtectedRoute({ children, allowedRoles, requireProfile = true }) {
  const { user } = useAuth();

  // ── 1. Must be authenticated ──────────────────────────────────────────
  if (!user || !user.token) {
    return <Navigate to="/auth" replace />;
  }

  // ── 2. Must have an allowed role ──────────────────────────────────────
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // ── 3. Organizations must complete their profile before reaching dashboard ──
  if (
    requireProfile &&
    user.role === 'organization' &&
    !user.profileComplete
  ) {
    return <Navigate to="/complete-profile" replace />;
  }

  // ── 4. If already on /complete-profile but profile IS complete → dashboard ──
  if (
    !requireProfile &&             // i.e. this IS the complete-profile route
    user.role === 'organization' &&
    user.profileComplete
  ) {
    return <Navigate to="/org-dashboard" replace />;
  }

  return children;
}

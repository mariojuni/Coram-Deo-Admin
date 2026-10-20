import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isLoading, currentUser, userProfile, churchData, isAuthorizedAdmin } = useAuth();

  // 1. Auth check in progress — render a neutral loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-bg">
        <div className="flex flex-col items-center gap-3 text-church-slate">
          <Loader2 size={28} className="animate-spin text-church-green" />
          <span className="text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  // 2. Not authenticated at all
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. Super Admin bypass: Platform administrators have unrestricted access
  const isSuperAdmin = userProfile?.systemRoles?.includes('super_admin') || userProfile?.role === 'super_admin';
  if (isSuperAdmin) {
    return children;
  }

  // 4. Identity Security Gate: Founder/Admin must verify their email address
  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // 5. Wait for church data to resolve if churchId exists
  if (userProfile?.churchId && churchData === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-bg">
        <div className="flex flex-col items-center gap-3 text-church-slate">
          <Loader2 size={28} className="animate-spin text-church-green" />
          <span className="text-sm">Loading church workspace…</span>
        </div>
      </div>
    );
  }

  // 6. Workspace Governance Gate: Church must be approved by Super Admin
  if (churchData) {
    const rawStatus = (churchData.status || '').toLowerCase();
    const isApproved = churchData.isApproved === true || rawStatus === 'active';

    if (!isApproved) {
      if (rawStatus === 'pending_verification') {
        return <Navigate to="/verify-email" replace />;
      }
      if (rawStatus === 'pending_approval' || rawStatus === 'pending' || !rawStatus) {
        return <Navigate to="/approval-pending" replace />;
      }
      if (rawStatus === 'disabled' || rawStatus === 'suspended') {
        return <Navigate to="/login" replace state={{ error: 'This church workspace is suspended or disabled.' }} />;
      }
    }
  }

  // 7. Role authorization check (must have allowed admin role)
  if (!isAuthorizedAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


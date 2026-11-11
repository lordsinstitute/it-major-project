import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AccessDenied() {
  const { user, role } = useAuth();
  const location = useLocation();
  const attemptedPath = location.state?.attemptedPath || 'the requested operational dashboard';

  function getDashboardPath() {
    if (role === ROLES.ADMIN) return '/admin/dashboard';
    if (role === ROLES.STAFF) return '/staff/dashboard';
    return '/student/dashboard';
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
        <ShieldX className="h-8 w-8" aria-hidden="true" />
      </div>

      <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-rose-600">
        Authorization Error 403
      </p>

      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        Access Denied: Restricted Permission
      </h1>

      <p className="mt-3 max-w-md text-xs leading-relaxed text-slate-600 sm:text-sm">
        {user ? (
          <>
            Your current account is authenticated as <strong className="font-semibold text-slate-900">{user.name}</strong> with role <strong className="rounded bg-slate-100 px-1.5 py-0.5 text-primary-700">{role}</strong>. You do not possess the credentials required to access <code className="font-mono text-slate-700">{attemptedPath}</code>.
          </>
        ) : (
          'You do not have the required permissions to access this dashboard. Please sign in with an authorized role.'
        )}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {user ? (
          <Link to={getDashboardPath()}>
            <Button variant="primary" icon={<UserCheck className="h-4 w-4" />}>
              Go to Your Role Dashboard
            </Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button variant="primary">
              Log In to Portal
            </Button>
          </Link>
        )}
        <Link to="/">
          <Button variant="outline" icon={<Home className="h-4 w-4" />}>
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

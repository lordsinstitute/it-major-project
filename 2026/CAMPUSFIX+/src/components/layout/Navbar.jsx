import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Wrench, Menu, X, ArrowRight, LogIn, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import Button from '../ui/Button';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/features' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Modules', href: '/modules' },
  { label: 'Research', href: '/research' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Technology', href: '/technology' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const triggerRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
        triggerRef.current?.focus();
      }
    }
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  function getDashboardPath() {
    if (!user) return '/login';
    if (user.role === ROLES.ADMIN) return '/admin/dashboard';
    if (user.role === ROLES.STAFF) return '/staff/dashboard';
    return '/student/dashboard';
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          aria-label="CampusFix+ Homepage"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white shadow-sm shadow-primary-500/20">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="flex items-center text-lg font-bold tracking-tight text-slate-900">
            CampusFix<span className="text-primary-600">+</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === '/'}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA / Auth status buttons */}
        <div className="hidden items-center gap-2.5 md:flex">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link to={getDashboardPath()}>
                <Button variant="outline" size="sm" icon={<UserCheck className="h-4 w-4" />}>
                  {user.name.split(' ')[0]} ({user.role})
                </Button>
              </Link>
              <Button variant="ghost" size="sm" icon={<LogOut className="h-4 w-4" />} onClick={handleLogout} aria-label="Sign Out">
                Logout
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" icon={<LogIn className="h-4 w-4" />}>
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 md:hidden"
          aria-controls="mobile-menu"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div id="mobile-menu" className="border-b border-slate-200 bg-white px-4 pb-6 pt-3 shadow-xl md:hidden">
          <nav className="flex flex-col gap-1 pb-4" aria-label="Mobile Navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.href === '/'}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3.5 py-2.5 text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 font-semibold text-primary-700'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-4">
            {isAuthenticated && user ? (
              <>
                <Link to={getDashboardPath()} className="w-full">
                  <Button variant="primary" className="w-full justify-center">
                    Go to {user.role} Dashboard
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-center" onClick={handleLogout}>
                  Sign Out ({user.name})
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full justify-center">
                    Login to Portal
                  </Button>
                </Link>
                <Link to="/register" className="w-full">
                  <Button variant="primary" className="w-full justify-center">
                    Register as Student
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

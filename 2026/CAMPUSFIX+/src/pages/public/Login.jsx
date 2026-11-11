import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ROLES } from '../../constants/roles';
import { LogIn, Eye, EyeOff, ShieldAlert, ArrowRight, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import DemoAccountsPanel, { DEMO_ACCOUNTS } from './components/DemoAccountsPanel';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    const roleParam = new URLSearchParams(location.search).get('role');
    if (roleParam) {
      const match = DEMO_ACCOUNTS.find((d) => d.role.toUpperCase() === roleParam.toUpperCase());
      if (match) {
        setEmail(match.email);
        setPassword('password123');
      }
    }
  }, [location.search]);

  function fillDemo(demoEmail) {
    setEmail(demoEmail);
    setPassword('password123');
    setErrors({});
    setRateLimitMessage('');
    toast.info(`Filled credentials for ${demoEmail}`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid institutional email is required.';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      (newErrors.email ? emailInputRef : passwordInputRef).current?.focus();
      return;
    }

    setSubmitting(true);
    setErrors({});
    setRateLimitMessage('');

    try {
      const user = await login({ email, password });
      toast.success(`Welcome back, ${user.name}!`);
      const fromPath = location.state?.from?.pathname;
      const rolePrefix = user.role.toLowerCase();
      if (fromPath && !fromPath.startsWith('/login') && fromPath.startsWith(`/${rolePrefix}`)) {
        navigate(fromPath, { replace: true });
      } else if (user.role === ROLES.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === ROLES.STAFF) {
        navigate('/staff/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      if (err.message.includes('[Client-Side Rate Limit]')) setRateLimitMessage(err.message);
      else setErrors({ form: err.message });
      passwordInputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="py-8 sm:py-14">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <strong>Demo Authentication Notice:</strong> This prototype evaluates role-based state machines. No real credentials or identity verification servers are engaged. Click any demo account below to log in instantly.
          </div>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-primary-700">
            <LogIn className="h-6 w-6" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Portal Login</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">Sign in to access your designated role portal.</p>

          {rateLimitMessage && (
            <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{rateLimitMessage}</span>
            </div>
          )}
          {errors.form && !rateLimitMessage && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errors.form}</div>
          )}

          <div className="mt-6"><DemoAccountsPanel onFillDemo={fillDemo} /></div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <FormField label="Institutional Email" required error={errors.email} hint="e.g. arjun.mehta@student.campusfix.edu">
              <Input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campusfix.edu"
                error={Boolean(errors.email)}
              />
            </FormField>

            <FormField label="Password" required error={errors.password}>
              <div className="relative">
                <Input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  error={Boolean(errors.password)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <div className="flex items-center justify-between text-xs pt-1">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700">Forgot password?</Link>
              <Link to="/register" className="font-medium text-slate-600 hover:text-slate-900">
                New student? <span className="text-primary-600 underline">Register</span>
              </Link>
            </div>

            <Button type="submit" variant="primary" loading={submitting} className="w-full justify-center mt-2" icon={<ArrowRight className="h-4 w-4" />}>
              Sign In to Portal
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import * as authService from '../../services/authService';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || 'simulated-token-123';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-8 sm:py-14">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-primary-700">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Set New Password</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Simulated password update for prototype evaluation.
          </p>

          {!success ? (
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              {errors.form && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {errors.form}
                </div>
              )}

              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                <span className="font-semibold text-slate-800">Active Token: </span>
                <span className="font-mono text-[11px] text-primary-700">{token}</span>
              </div>

              <FormField label="New Password" required error={errors.password}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  error={Boolean(errors.password)}
                />
              </FormField>

              <FormField label="Confirm New Password" required error={errors.confirmPassword}>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  error={Boolean(errors.confirmPassword)}
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full justify-center mt-2"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Update Password
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-4 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Password Updated Successfully</h2>
              <p className="text-xs text-slate-600">
                Your simulated prototype credentials have been refreshed. You can now sign in.
              </p>
              <Link to="/login" className="block pt-2">
                <Button variant="primary" className="w-full justify-center">
                  Return to Portal Login
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

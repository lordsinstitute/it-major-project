import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import * as authService from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [simulatedToken, setSimulatedToken] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid campus email address.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(email);
      setSimulatedToken(`token-${Math.random().toString(36).substring(2, 8)}`);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-8 sm:py-14">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        
        {/* Prototype notice */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <strong>Simulated Recovery Flow:</strong> No real email service is attached in this prototype. Upon submission, a simulated token link will be presented directly for testing.
          </div>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-primary-700">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Password Recovery</h1>
          </div>

          {!submitted ? (
            <>
              <p className="mt-2 text-xs text-slate-500">
                Enter your registered campus email to receive simulated reset instructions.
              </p>

              {error && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                <FormField label="Institutional Email" required error={error}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@student.campusfix.edu"
                    error={Boolean(error)}
                  />
                </FormField>

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full justify-center mt-2"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Generate Simulated Reset Token
                </Button>
              </form>
            </>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Simulated recovery token generated for <strong>{email}</strong>.</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                <p className="text-slate-600">Simulated Recovery Link:</p>
                <Link
                  to={`/reset-password?token=${simulatedToken}`}
                  className="block font-mono text-xs font-semibold text-primary-600 underline break-all hover:text-primary-700"
                >
                  /reset-password?token={simulatedToken}
                </Link>
              </div>

              <Link to={`/reset-password?token=${simulatedToken}`} className="block">
                <Button variant="primary" className="w-full justify-center" icon={<ArrowRight className="h-4 w-4" />}>
                  Continue to Reset Password
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

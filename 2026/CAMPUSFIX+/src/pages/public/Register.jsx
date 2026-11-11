import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { UserPlus, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';

const STUDENT_DEPTS = [
  'Computer Science Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Biotechnology',
];

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: 'Computer Science Engineering',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const rollRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = 'Please enter your full name.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Valid institutional email is required.';
    if (!form.rollNumber.trim()) newErrors.rollNumber = 'Student ID / Roll number is required.';
    if (!form.password || form.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!form.terms) newErrors.terms = 'You must accept the academic prototype terms.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstRef = newErrors.name ? nameRef : newErrors.email ? emailRef : newErrors.rollNumber ? rollRef : newErrors.password ? passwordRef : confirmRef;
      firstRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const student = await register(form);
      toast.success(`Account created! Welcome, ${student.name}.`);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50/70 p-4 text-xs text-primary-900">
          <p className="font-bold">Student Self-Registration Portal</p>
          <p className="mt-1 text-slate-600">
            <strong>Administrator</strong> and <strong>Maintenance Staff</strong> accounts are provisioned exclusively by Campus Estate Admin and cannot self-register.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-primary-700">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Student Sign-Up</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">Create an account to report campus maintenance issues.</p>

          {errors.form && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errors.form}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <FormField label="Full Name" required error={errors.name}>
              <Input
                ref={nameRef}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                error={Boolean(errors.name)}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Campus Email" required error={errors.email}>
                <Input
                  ref={emailRef}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="priya.s@student.campus.edu"
                  error={Boolean(errors.email)}
                />
              </FormField>

              <FormField label="Student ID / Roll No." required error={errors.rollNumber}>
                <Input
                  ref={rollRef}
                  value={form.rollNumber}
                  onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                  placeholder="23CS201"
                  error={Boolean(errors.rollNumber)}
                />
              </FormField>
            </div>

            <FormField label="Academic Department" required>
              <Select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                options={STUDENT_DEPTS.map((d) => ({ value: d, label: d }))}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Password" required error={errors.password}>
                <Input
                  ref={passwordRef}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  error={Boolean(errors.password)}
                />
              </FormField>

              <FormField label="Confirm Password" required error={errors.confirmPassword}>
                <Input
                  ref={confirmRef}
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Repeat password"
                  error={Boolean(errors.confirmPassword)}
                />
              </FormField>
            </div>

            <PasswordStrengthMeter password={form.password} />

            <div className="pt-2">
              <Checkbox
                checked={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                label="I agree to academic research participation and prototype guidelines."
              />
              {errors.terms && <p className="mt-1 text-xs text-rose-600">{errors.terms}</p>}
            </div>

            <Button type="submit" variant="primary" loading={submitting} className="w-full justify-center mt-3" icon={<ArrowRight className="h-4 w-4" />}>
              Complete Student Registration
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Already registered? <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Log in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

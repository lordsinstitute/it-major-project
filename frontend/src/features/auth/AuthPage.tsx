
import { useState } from "react";
import {
  registerWithEmail,
  loginWithEmail,
  syncProfileWithBackend,
} from "../../lib/auth";

type AuthPageProps = {
  theme?: "light" | "dark";
};

export default function AuthPage({ theme = "light" }: AuthPageProps) {
  const [isSignup, setIsSignup] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (isSignup && !/^\+?[0-9]{10,15}$/.test(phoneNumber.trim())) {
      setError("Enter a valid phone number with 10–15 digits.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const data = await registerWithEmail(
          fullName.trim(),
          phoneNumber.trim(),
          email.trim(),
          password
        );

        if (data.session) {
          setMessage("Account created successfully!");
        } else {
          setMessage(
            "Account created! Please check your email and click the verification link."
          );
        }
      } else {
        await loginWithEmail(email.trim(), password);
        await syncProfileWithBackend();
        setMessage("Login successful!");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`auth-page ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">M</span>
          <span>Mediqo</span>
        </div>

        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>

        <p className="auth-subtitle">
          {isSignup
            ? "Join Mediqo to manage your healthcare journey."
            : "Sign in to continue to Mediqo."}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label>
                Full name
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Phone number
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={16}
                  required
                />
              </label>
            </>
          )}

          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </label>

          {isSignup && (
            <label>
              Confirm password
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-success" role="status">{message}</p>}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup
            ? "Already have an account?"
            : "New to Mediqo?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setMessage("");
              setError("");
            }}
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </p>
      </section>

      <style>{`
        .auth-page {
          min-height: 100vh;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 90px 20px 32px;
          font-family: Arial, sans-serif;
          transition: background 0.25s ease, color 0.25s ease;
        }

        .auth-page.light-mode {
          background: #f2faf8;
          color: #183c3a;
          color-scheme: light;
        }

        .auth-page.dark-mode {
          background: #101a1b;
          color: #e5efed;
          color-scheme: dark;
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          box-sizing: border-box;
          padding: 34px;
          border-radius: 22px;
          border: 1px solid #dcebe7;
          background: #ffffff;
          box-shadow: 0 15px 45px rgba(12, 68, 61, 0.08);
          transition: background 0.25s ease, border-color 0.25s ease;
        }

        .dark-mode .auth-card {
          background: #192728;
          border-color: #304343;
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.2);
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 25px;
          font-size: 22px;
          font-weight: 800;
          color: #087f75;
        }

        .auth-logo {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #d9f5ed;
          color: #087f75;
          font-weight: 800;
        }

        .auth-card h1 {
          margin: 0 0 10px;
          font-size: 28px;
          line-height: 1.25;
          color: #173b38;
        }

        .dark-mode .auth-card h1 {
          color: #f0faf7;
        }

        .auth-subtitle {
          margin: 0 0 25px;
          line-height: 1.6;
          color: #627976;
          font-size: 14px;
        }

        .dark-mode .auth-subtitle {
          color: #a7bfba;
        }

        .auth-card form {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .auth-card label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #31534f;
        }

        .dark-mode .auth-card label {
          color: #d2e3df;
        }

        .auth-card input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px;
          border: 1px solid #d5e5e0;
          border-radius: 10px;
          outline: none;
          background: #fbfefd;
          color: #183c3a;
          font: inherit;
          font-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .auth-card input::placeholder {
          color: #93a9a4;
        }

        .auth-card input:focus {
          border-color: #0b9587;
          box-shadow: 0 0 0 3px rgba(11, 149, 135, 0.12);
        }

        .dark-mode .auth-card input {
          background: #101d1e;
          color: #edf7f4;
          border-color: #3a5250;
        }

        .dark-mode .auth-card input::placeholder {
          color: #819894;
        }

        .auth-submit {
          width: 100%;
          margin-top: 5px;
          padding: 14px;
          border: none;
          border-radius: 11px;
          background: #087f75;
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, opacity 0.2s ease;
        }

        .auth-submit:hover {
          background: #066b63;
        }

        .auth-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .auth-error,
        .auth-success {
          margin: 0;
          padding: 11px 12px;
          border-radius: 9px;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .auth-error {
          background: #fff0ef;
          color: #b42318;
          border: 1px solid #ffd3cf;
        }

        .auth-success {
          background: #e9f9ef;
          color: #176b3a;
          border: 1px solid #c8efd5;
        }

        .dark-mode .auth-error {
          background: #351f21;
          color: #ffb9b2;
          border-color: #653638;
        }

        .dark-mode .auth-success {
          background: #193529;
          color: #a9efbd;
          border-color: #315d42;
        }

        .auth-switch {
          margin: 22px 0 0;
          text-align: center;
          font-size: 14px;
          color: #627976;
        }

        .dark-mode .auth-switch {
          color: #a7bfba;
        }

        .auth-switch button {
          padding: 0;
          border: none;
          background: transparent;
          color: #087f75;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .auth-switch button:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .auth-page {
            padding: 80px 14px 24px;
          }

          .auth-card {
            padding: 25px 20px;
          }

          .auth-card h1 {
            font-size: 25px;
          }
        }
      `}</style>
    </main>
  );
}

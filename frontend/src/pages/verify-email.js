import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function VerifyEmail() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const q = router.query.email;
    const devOtp = router.query.dev_otp;
    if (typeof q === 'string' && q.trim()) setEmail(q.trim());
    if (typeof devOtp === 'string' && /^\d{6}$/.test(devOtp)) setOtp(devOtp);
  }, [router.query.email, router.query.dev_otp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/^\d{6}$/.test(otp.trim())) {
      setError('Please enter your email and the 6-digit code from the email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify-email.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }
      router.replace('/dashboard');
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setError('');
    setResendSuccess(false);
    if (!email.trim()) {
      setError('Enter your email above first.');
      return;
    }
    setResendLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/resend-verification.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not resend code');
      } else {
        setResendSuccess(true);
      }
    } catch {
      setError('Network error.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Verify your email — PerformancePlatform</title>
      </Head>
      <div className="page">
        <div className="card">
          <div className="icon-wrap">
            <span className="icon" aria-hidden="true">✉️</span>
          </div>
          <h1>Verify your email</h1>
          <p className="desc">
            We sent a 6-digit code to your email. Enter it below to activate your account.
          </p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              autoComplete="email"
            />
            <label htmlFor="otp">Verification code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="otp-input"
            />
            {error && <p className="error-msg">{error}</p>}
            {resendSuccess && <p className="success-msg">A new code has been sent to your email.</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              className="resend-btn"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending…' : 'Resend code'}
            </button>
          </form>
          <Link href="/login" className="back-link">← Back to Sign in</Link>
        </div>
      </div>
      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--color-surface-alt);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .card {
          width: 100%;
          max-width: 420px;
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--color-border);
          text-align: center;
        }
        .icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--color-accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .icon { font-size: 1.75rem; }
        h1 {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 0.75rem;
        }
        .desc {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0 0 1.5rem;
          line-height: var(--leading-relaxed);
        }
        form { text-align: left; }
        label {
          display: block;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 0.35rem;
        }
        input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--color-border-input);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          margin-bottom: 1.25rem;
        }
        .otp-input { font-size: 1.5rem; letter-spacing: 0.25em; text-align: center; }
        input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-muted);
        }
        .error-msg { color: #dc2626; font-size: 0.9rem; margin: 0 0 1rem; }
        .success-msg { color: #16a34a; font-size: 0.9rem; margin: 0 0 1rem; }
        .btn-primary {
          width: 100%;
          padding: 0.8rem;
          background: var(--color-accent);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          font-size: var(--text-base);
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 0.75rem;
        }
        .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .resend-btn {
          width: 100%;
          padding: 0.5rem;
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          cursor: pointer;
        }
        .resend-btn:hover:not(:disabled) { color: var(--color-accent); }
        .resend-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .back-link {
          display: inline-block;
          margin-top: 1.25rem;
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }
        .back-link:hover { color: var(--color-accent); }
      `}</style>
    </>
  );
}

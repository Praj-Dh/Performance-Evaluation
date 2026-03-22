import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [method, setMethod] = useState(''); // '' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = router.query.token;
    const m = router.query.method;
    const e = router.query.email;
    if (typeof t === 'string') setToken(t);
    if (m === 'otp') setMethod('otp');
    if (typeof e === 'string') setEmail(e);
  }, [router.query.token, router.query.method, router.query.email]);

  const isOtpFlow = method === 'otp' && email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      if (isOtpFlow) {
        if (!/^\d{6}$/.test(otp.trim())) {
          setError('Please enter the 6-digit code from your email.');
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/reset-password-with-otp.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, otp: otp.trim(), password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || 'Request failed');
          setLoading(false);
          return;
        }
        setSuccess(true);
        setTimeout(() => router.replace('/login'), 2000);
      } else {
        if (!token) {
          setError('Invalid reset link. Request a new one from the forgot password page.');
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/reset-password.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || 'Request failed');
          setLoading(false);
          return;
        }
        setSuccess(true);
        setTimeout(() => router.replace('/login'), 2000);
      }
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password — PerformancePlatform</title>
      </Head>
      <div className="page">
        <div className="card">
          <div className="icon-wrap">
            <span className="icon" aria-hidden="true">🔑</span>
          </div>
          <h1>Set new password</h1>
          {success ? (
            <p className="desc success">Password updated. Redirecting to sign in…</p>
          ) : !token && !isOtpFlow ? (
            <p className="desc">Invalid or missing reset link. <Link href="/forgot-password">Request a new one</Link>.</p>
          ) : (
            <>
              <p className="desc">{isOtpFlow ? 'Enter the code from your email and your new password.' : 'Enter your new password below.'}</p>
              <form onSubmit={handleSubmit}>
                {isOtpFlow && (
                  <>
                    <label htmlFor="email">Email</label>
                    <div className="input-wrap">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        readOnly
                        className="readonly"
                      />
                    </div>
                    <label htmlFor="otp">Verification code</label>
                    <div className="input-wrap">
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="otp-input"
                      />
                    </div>
                  </>
                )}
                <label htmlFor="password">New Password</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <label htmlFor="confirm">Confirm Password</label>
                <div className="input-wrap">
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
          <Link href="/login" className="back-link">← Back to Login</Link>
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
        h1 { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text); margin: 0 0 0.75rem; }
        .desc { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0 0 1.5rem; line-height: var(--leading-relaxed); }
        .desc.success { margin-bottom: 1rem; }
        .error-msg { color: #dc2626; font-size: 0.9rem; margin: 0 0 1rem; text-align: left; }
        form { text-align: left; }
        label { display: block; font-size: var(--text-sm); font-weight: 500; color: var(--color-text); margin-bottom: 0.35rem; }
        .input-wrap { margin-bottom: 1.25rem; }
        .input-wrap input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--color-border-input);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
        }
        .input-wrap input:focus { outline: none; border-color: var(--color-accent); }
        .input-wrap input.readonly { background: var(--color-surface-alt); color: var(--color-text-muted); }
        .otp-input { font-size: 1.25rem; letter-spacing: 0.2em; text-align: center; }
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
        }
        .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .back-link { display: inline-block; margin-top: 1.25rem; font-size: var(--text-sm); color: var(--color-text-muted); }
        .back-link:hover { color: var(--color-accent); }
      `}</style>
    </>
  );
}

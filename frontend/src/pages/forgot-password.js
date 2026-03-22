import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState('link'); // 'link' | 'otp'
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/forgot-password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Request failed');
        setLoading(false);
        return;
      }
      setSent(true);
      if (data.method === 'otp') {
        router.push(`/reset-password?method=otp&email=${encodeURIComponent(email)}`);
        return;
      }
      if (data.reset_token) {
        router.push(`/reset-password?token=${encodeURIComponent(data.reset_token)}`);
        return;
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
        <title>Forgot Password — PerformancePlatform</title>
      </Head>
      <div className="page">
        <div className="card">
          <div className="icon-wrap">
            <span className="icon" aria-hidden="true">🔐</span>
          </div>
          <h1>Forgot Password?</h1>
          {!sent ? (
            <>
              <p className="desc">
                Don&apos;t worry, it happens. Enter your email and choose how to reset your password.
              </p>
              <form onSubmit={handleSubmit}>
                <label htmlFor="email">Work Email</label>
                <div className="input-wrap">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                  <span className="input-icon">✉</span>
                </div>
                <div className="method-choices">
                  <label className="method-option">
                    <input
                      type="radio"
                      name="method"
                      value="link"
                      checked={method === 'link'}
                      onChange={() => setMethod('link')}
                    />
                    <span>Email me a reset link</span>
                  </label>
                  <label className="method-option">
                    <input
                      type="radio"
                      name="method"
                      value="otp"
                      checked={method === 'otp'}
                      onChange={() => setMethod('otp')}
                    />
                    <span>Send me a verification code (OTP)</span>
                  </label>
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Sending…' : method === 'otp' ? 'Send code' : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <p className="desc success">
              If an account exists for that email, we&apos;ve sent reset instructions. Check your inbox.
            </p>
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
        h1 {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 0.75rem;
          letter-spacing: -0.02em;
        }
        .desc {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0 0 1.5rem;
          line-height: var(--leading-relaxed);
        }
        .desc.success { margin-bottom: 1rem; }
        .error-msg { color: #dc2626; font-size: 0.9rem; margin: 0 0 1rem; text-align: left; }
        form { text-align: left; }
        label {
          display: block;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 0.35rem;
        }
        .input-wrap {
          position: relative;
          margin-bottom: 1.25rem;
        }
        .input-wrap input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: 1px solid var(--color-border-input);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .input-wrap input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-muted);
        }
        .input-icon {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          font-size: 1rem;
        }
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
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
          transition: background var(--transition-fast), transform var(--transition-fast);
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--color-accent-hover);
          transform: translateY(-1px);
        }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .back-link {
          display: inline-block;
          margin-top: 1.25rem;
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          transition: color var(--transition-fast);
        }
        .back-link:hover { color: var(--color-accent); }
        .method-choices { margin-bottom: 1.25rem; }
        .method-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: var(--text-sm);
          color: var(--color-text);
          cursor: pointer;
          margin-bottom: 0.5rem;
        }
        .method-option input { width: auto; margin: 0; }
      `}</style>
    </>
  );
}

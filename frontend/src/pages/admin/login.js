import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 && data.code === 'email_not_verified') {
          setError('Please verify your email before signing in.');
        } else {
          setError(data.error || 'Invalid email or password.');
        }
        setLoading(false);
        return;
      }
      if (data.user?.role !== 'admin') {
        setError('This account is not an administrator.');
        setLoading(false);
        return;
      }
      router.replace('/admin');
    } catch {
      setError('Network error. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin sign in — Team Management</title>
      </Head>
      <div className="admin-login">
        <div className="admin-login-card">
          <Link href="/dashboard" className="admin-logo" aria-label="Go to dashboard">
            Performance Platform
          </Link>
          <h1>Team Management</h1>
          <p className="admin-login-sub">Admin sign in</p>

          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
              />
            </label>
            {error && <p className="admin-login-error">{error}</p>}
            <button type="submit" className="admin-login-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="admin-login-footer">
            <Link href="/login">← Back to main sign in</Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .admin-login {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: system-ui, sans-serif;
          background: #1a1d24;
          color: #e5e7eb;
        }
        .admin-login-card {
          width: 100%;
          max-width: 360px;
          padding: 2rem;
          background: #252830;
          border: 1px solid #3b4048;
          border-radius: 8px;
        }
        .admin-logo {
          display: inline-block;
          margin-bottom: 0.85rem;
          color: #93c5fd;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .admin-logo:hover { color: #bfdbfe; }
        .admin-login h1 {
          margin: 0 0 0.25rem;
          font-size: 1.5rem;
          font-weight: 600;
        }
        .admin-login-sub {
          margin: 0 0 1.5rem;
          font-size: 0.875rem;
          color: #9ca3af;
        }
        .admin-login label {
          display: block;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: #d1d5db;
        }
        .admin-login input {
          display: block;
          width: 100%;
          margin-top: 0.35rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.9375rem;
          border: 1px solid #3b4048;
          border-radius: 4px;
          background: #1a1d24;
          color: #e5e7eb;
          box-sizing: border-box;
        }
        .admin-login input::placeholder {
          color: #6b7280;
        }
        .admin-login input:focus {
          outline: none;
          border-color: #60a5fa;
        }
        .admin-login-error {
          margin: 0 0 1rem;
          font-size: 0.875rem;
          color: #f87171;
        }
        .admin-login-btn {
          width: 100%;
          padding: 0.6rem 1rem;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #fff;
          background: #2563eb;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .admin-login-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .admin-login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .admin-login-footer {
          margin: 1.5rem 0 0;
          padding-top: 1rem;
          border-top: 1px solid #3b4048;
          font-size: 0.875rem;
          text-align: center;
        }
        .admin-login-footer a {
          color: #60a5fa;
          text-decoration: none;
        }
        .admin-login-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}

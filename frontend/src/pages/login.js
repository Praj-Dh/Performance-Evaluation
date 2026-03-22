import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function EyeIcon({ show }) {
  return show ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('employee');
  const [teamId, setTeamId] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isSignUp && role === 'manager' && !teamId) {
        setError('Please select a team to manage.');
        return;
    }

    setLoading(true);
    try {
      const endpoint = isSignUp ? `${API_BASE}/api/signup.php` : `${API_BASE}/api/login.php`;
      
      const body = isSignUp
        ? { email, password, display_name: displayName, role, ...(role === 'manager' && { team_id: teamId }) }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        // Server may have returned HTML (e.g. PHP error)
      }
      if (!res.ok) {
        if (res.status === 403 && data.code === 'email_not_verified') {
          setError(data.error || 'Please verify your email before signing in.');
          setLoading(false);
          return;
        }
        setError(data.error || (res.status === 500 ? 'Server error. Check database config on server.' : `Request failed (${res.status}).`));
        setLoading(false);
        return;
      }
      if (isSignUp && data.require_verification && data.email) {
        let url = `/verify-email?email=${encodeURIComponent(data.email)}`;
        if (data.dev_otp) url += `&dev_otp=${encodeURIComponent(data.dev_otp)}`;
        router.replace(url);
        return;
      }
      router.replace('/dashboard');
    } catch (err) {
      setError('Network error. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`${isSignUp ? 'Create your account' : 'Sign in'} — PerformancePlatform`}</title>
      </Head>
      <div className="auth-layout">
        <div className="auth-panel">
          <div className="auth-panel-grid" aria-hidden="true" />
          <div className="auth-panel-content">
            <span className="auth-tag">ENTERPRISE PERFORMANCE</span>
            <h2 className="auth-headline">
              {isSignUp
                ? <>Drive results with<br />data-driven accountability.</>
                : <>Drive accountability with<br />data-backed evaluations.</>
              }
            </h2>
            <p className="auth-subhead">
              {isSignUp
                ? 'The enterprise-grade platform for workforce management, performance evaluation, and strategic alignment.'
                : 'Empower your workforce through our sophisticated performance management suite. Real-time metrics, transparent feedback, and scalable workforce solutions.'}
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-icon" aria-hidden="true">📊</span>
                <div>
                  <strong>Advanced Analytics</strong>
                  <p>Granular insights into organizational productivity.</p>
                </div>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon" aria-hidden="true">🛡️</span>
                <div>
                  <strong>Enterprise Security</strong>
                  <p>Your data protected with industry-leading standards.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="auth-copyright">© 2024 PerformancePlatform Inc. All rights reserved.</p>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form-inner">
            <div className="auth-brand">
              <Link href="/dashboard" className="auth-logo" aria-label="Go to dashboard">PerformancePlatform</Link>
              <span className="auth-tagline">Performance Accountability & Evaluation</span>
            </div>

            <h1 className="auth-form-title">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h1>
            <p className="auth-form-desc">
              {isSignUp
                ? "Join the platform to begin managing your team's performance data."
                : 'Welcome back. Enter your credentials to access your dashboard.'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              {isSignUp && (
                <>
                  <div className="field">
                    <label htmlFor="display_name">Full Name</label>
                    <input
                      id="display_name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoComplete="name"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => {
                          setRole(e.target.value);
                          if (e.target.value !== 'manager') setTeamId(''); 
                      }}
                      className="auth-select"
                      aria-label="Role"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  
                  {role === 'manager' && (
                     <div className="field">
                       <label htmlFor="team_id">Select Team You Manage</label>
                       <select
                         id="team_id"
                         value={teamId}
                         onChange={(e) => setTeamId(e.target.value)}
                         className="auth-select"
                         required
                       >
                         <option value="" disabled>Choose a team...</option>
                         <option value="1">Engineering</option>
                         <option value="2">Design</option>
                         <option value="3">Marketing</option>
                         <option value="4">Sales</option>
                       </select>
                     </div>
                  )}
                </>
              )}
              <div className="field">
                <label htmlFor="email">Work Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                />
              </div>
              <div className="field">
                <div className="field-label-row">
                  <label htmlFor="password">Password</label>
                  {!isSignUp && (
                    <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
                  )}
                </div>
                <div className="input-with-icon">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder={isSignUp ? 'Min. 8 characters' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
              </div>
              {!isSignUp && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                  />
                  <span>Remember this device</span>
                </label>
              )}
              {error && (
                <div className="error-block">
                  <p className="error-msg">{error}</p>
                  {error.includes('verify your email') && (
                    <Link href={`/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="verify-link">
                      Verify email →
                    </Link>
                  )}
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Please wait…' : isSignUp ? 'Sign Up →' : 'Sign In'}
              </button>
            </form>

            <p className="auth-toggle">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                className="link-btn"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>

            <footer className="auth-footer">
              <Link href="/admin/login">Admin</Link>
              <span className="sep">·</span>
              <a href="#">Privacy Policy</a>
              <span className="sep">·</span>
              <a href="#">Terms of Service</a>
              <span className="sep">·</span>
              <a href="#">Support</a>
            </footer>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-layout {
          display: flex;
          min-height: 100vh;
        }
        .auth-panel {
          flex: 1;
          min-width: 0;
          background: linear-gradient(160deg, #0f1d38 0%, #1a2d4a 100%);
          color: var(--color-panel-text);
          padding: 2.5rem 3rem;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .auth-panel-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .auth-panel-content {
          position: relative;
          z-index: 1;
          max-width: 480px;
          margin: auto 0;
        }
        .auth-tag {
          display: inline-block;
          background: var(--color-accent);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-full);
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
        }
        .auth-headline {
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 700;
          line-height: 1.2;
          margin: 0 0 1rem;
          letter-spacing: -0.02em;
        }
        .auth-subhead {
          color: var(--color-panel-muted);
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0 0 2rem;
        }
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .auth-feature {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        .auth-feature-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .auth-feature strong {
          display: block;
          font-size: 0.9rem;
          margin-bottom: 0.2rem;
        }
        .auth-feature p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--color-panel-muted);
        }
        .auth-copyright {
          position: relative;
          z-index: 1;
          margin-top: auto;
          padding-top: 2rem;
          font-size: 0.75rem;
          color: var(--color-panel-muted);
        }
        .auth-form-wrap {
          width: 100%;
          max-width: 440px;
          flex-shrink: 0;
          background: var(--color-surface);
          display: flex;
          align-items: center;
          padding: 2.5rem 2rem;
          box-shadow: -8px 0 24px rgba(0,0,0,0.06);
        }
        .auth-form-inner {
          width: 100%;
        }
        .auth-brand {
          margin-bottom: 2rem;
        }
        .auth-logo {
          display: block;
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--color-accent);
          letter-spacing: -0.02em;
          text-decoration: none;
        }
        .auth-logo:hover { color: var(--color-accent-hover); }
        .auth-tagline {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin-top: 0.2rem;
        }
        .auth-form-title {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 0.4rem;
          letter-spacing: -0.02em;
        }
        .auth-form-desc {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0 0 1.5rem;
          line-height: var(--leading-relaxed);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .field label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 0.35rem;
        }
        .field-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .field-label-row label {
          margin-bottom: 0;
        }
        .forgot-link {
          font-size: 0.8rem;
        }
        .field input {
          width: 100%;
          padding: 0.7rem 1rem;
          border: 1px solid var(--color-border-input);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          color: var(--color-text);
          background: var(--color-surface);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .field input::placeholder {
          color: var(--color-text-muted);
        }
        .auth-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--color-border-input);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          background: var(--color-surface);
          color: var(--color-text);
          margin-bottom: 1.25rem;
        }
        .auth-select:focus {
          outline: none;
          border-color: var(--color-accent);
        }
        .field input:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-muted);
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-with-icon input {
          padding-right: 2.75rem;
        }
        .input-icon-btn {
          position: absolute;
          right: 0.5rem;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 0.35rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .input-icon-btn:hover {
          color: var(--color-text);
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-text);
          cursor: pointer;
        }
        .checkbox-label input {
          width: 1rem;
          height: 1rem;
        }
        .error-block { margin: 0; }
        .error-msg {
          color: var(--color-error);
          font-size: 0.875rem;
          margin: 0 0 0.35rem;
        }
        .verify-link {
          display: inline-block;
          font-size: 0.875rem;
          color: var(--color-accent);
          margin-top: 0.25rem;
        }
        .verify-link:hover { text-decoration: underline; }
        .btn-primary {
          padding: 0.8rem 1.25rem;
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.25rem;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
          transition: background var(--transition-fast), transform var(--transition-fast);
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--color-accent-hover);
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .auth-toggle {
          margin-top: 1.25rem;
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }
        .link-btn {
          background: none;
          border: none;
          color: var(--color-accent);
          cursor: pointer;
          padding: 0;
          font-size: inherit;
        }
        .link-btn:hover {
          text-decoration: underline;
        }
        .auth-footer {
          margin-top: 2rem;
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }
        .auth-footer a {
          color: var(--color-text-muted);
        }
        .auth-footer a:hover {
          color: var(--color-accent);
        }
        .auth-footer .sep {
          margin: 0 0.35rem;
        }
        @media (max-width: 900px) {
          .auth-layout {
            flex-direction: column;
          }
          .auth-panel {
            padding: 1.5rem;
          }
          .auth-panel-content {
            margin: 0;
          }
          .auth-form-wrap {
            max-width: none;
          }
        }
      `}</style>
    </>
  );
}

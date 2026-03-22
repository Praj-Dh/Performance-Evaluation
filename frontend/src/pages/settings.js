import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const ICONS = {
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  eye: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  mail: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  key: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
};

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifyReviews, setNotifyReviews] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="layout loading-only">
        <div className="loading-state"><p>Loading…</p></div>
        <style jsx>{`
          .loading-only { display: flex; min-height: 100vh; background: var(--color-surface-alt); }
          .loading-state { flex: 1; display: flex; align-items: center; justify-content: center; }
        `}</style>
      </div>
    );
  }
  if (!user) return null;

  const isManager = user.role === 'manager';
  const displayName = user.display_name || user.email || '—';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = isManager ? 'Manager' : 'Employee';

  return (
    <>
      <Head>
        <title>Settings — PerformancePlatform</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="settings"
        breadcrumb={
          isManager
            ? <>Account <span className="sep">›</span> Settings</>
            : <>Account <span className="sep">›</span> Settings</>
        }
        title="Settings"
        subtitle="Manage your account, notifications, and privacy"
      >
        <div className="settings-grid">
          <section className="settings-section">
            <div className="settings-card">
              <div className="card-header">
                <span className="card-icon account">{ICONS.user}</span>
                <div>
                  <h2>Account</h2>
                  <p className="card-desc">Your profile and sign-in details</p>
                </div>
              </div>
              <div className="card-body">
                <div className="setting-row avatar-row">
                  <div className="avatar-large">{initials}</div>
                  <div>
                    <p className="setting-label">Profile photo</p>
                    <p className="setting-hint">Avatar uses your initials. Custom photos coming soon.</p>
                  </div>
                </div>
                <div className="setting-row">
                  <span className="setting-label">Email</span>
                  <span className="setting-value">{user.email}</span>
                </div>
                <div className="setting-row">
                  <span className="setting-label">Display name</span>
                  <span className="setting-value">{user.display_name || '—'}</span>
                </div>
                <div className="setting-row">
                  <span className="setting-label">Role</span>
                  <span className="role-badge">{roleLabel}</span>
                </div>
                <Link href="/profile" className="btn-secondary">
                  Edit profile &amp; password →
                </Link>
              </div>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <span className="card-icon security">{ICONS.shield}</span>
                <div>
                  <h2>Security</h2>
                  <p className="card-desc">Password and session</p>
                </div>
              </div>
              <div className="card-body">
                <div className="setting-row">
                  <span className="setting-label">{ICONS.key} Password</span>
                  <span className="setting-value muted">Last changed in account</span>
                </div>
                <Link href="/profile#password" className="btn-secondary">
                  Change password →
                </Link>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-card">
              <div className="card-header">
                <span className="card-icon notifications">{ICONS.bell}</span>
                <div>
                  <h2>Notifications</h2>
                  <p className="card-desc">How and when we email you</p>
                </div>
              </div>
              <div className="card-body">
                <div className="toggle-row">
                  <div>
                    <span className="toggle-label">Review feedback</span>
                    <p className="toggle-hint">Email when you receive new review feedback</p>
                  </div>
                  <button
                    type="button"
                    className={`toggle ${notifyReviews ? 'on' : ''}`}
                    onClick={() => setNotifyReviews((v) => !v)}
                    aria-pressed={notifyReviews}
                    aria-label="Toggle review notifications"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
                <div className="toggle-row">
                  <div>
                    <span className="toggle-label">Weekly digest</span>
                    <p className="toggle-hint">Summary of your activity and team updates</p>
                  </div>
                  <button
                    type="button"
                    className={`toggle ${notifyDigest ? 'on' : ''}`}
                    onClick={() => setNotifyDigest((v) => !v)}
                    aria-pressed={notifyDigest}
                    aria-label="Toggle weekly digest"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
                <p className="coming-soon">Notification preferences are saved locally for now. Backend wiring coming soon.</p>
              </div>
            </div>

            <div className="settings-card">
              <div className="card-header">
                <span className="card-icon privacy">{ICONS.eye}</span>
                <div>
                  <h2>Privacy</h2>
                  <p className="card-desc">Who can see your information</p>
                </div>
              </div>
              <div className="card-body">
                <div className="toggle-row">
                  <div>
                    <span className="toggle-label">Profile visible to team</span>
                    <p className="toggle-hint">Allow colleagues to see your name and role in the directory</p>
                  </div>
                  <button
                    type="button"
                    className={`toggle ${profileVisible ? 'on' : ''}`}
                    onClick={() => setProfileVisible((v) => !v)}
                    aria-pressed={profileVisible}
                    aria-label="Toggle profile visibility"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
                <p className="coming-soon">Privacy settings will sync with the server when available.</p>
              </div>
            </div>
          </section>
        </div>

        <style jsx>{`
          .settings-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            align-items: start;
          }
          @media (max-width: 900px) {
            .settings-grid { grid-template-columns: 1fr; }
          }
          .settings-section { display: flex; flex-direction: column; gap: 1.5rem; }
          .settings-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
            box-shadow: var(--shadow-card);
            transition: box-shadow var(--transition-base);
          }
          .settings-card:hover { box-shadow: var(--shadow-md); }
          .card-header {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
            background: var(--color-surface-alt);
            border-bottom: 1px solid var(--color-border);
          }
          .card-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .card-icon.account { background: var(--color-accent-soft); color: var(--color-accent); }
          .card-icon.security { background: #dcfce7; color: #16a34a; }
          .card-icon.notifications { background: #fef3c7; color: #d97706; }
          .card-icon.privacy { background: #e0e7ff; color: #4f46e5; }
          .card-header h2 {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--color-text);
            margin: 0 0 0.2rem;
          }
          .card-desc {
            font-size: 0.85rem;
            color: var(--color-text-muted);
            margin: 0;
          }
          .card-body { padding: 1.25rem 1.5rem; }
          .setting-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--color-border-light);
          }
          .setting-row:last-of-type { border-bottom: none; }
          .avatar-row { align-items: flex-start; }
          .avatar-large {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-accent) 0%, #1d4ed8 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            font-weight: 600;
            flex-shrink: 0;
          }
          .setting-label {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--color-text);
          }
          .setting-value {
            font-size: 0.9rem;
            color: var(--color-text-secondary);
            text-align: right;
            word-break: break-all;
          }
          .setting-value.muted { color: var(--color-text-muted); font-size: 0.85rem; }
          .setting-hint { font-size: 0.8rem; color: var(--color-text-muted); margin: 0.35rem 0 0; }
          .role-badge {
            display: inline-block;
            padding: 0.25rem 0.6rem;
            border-radius: var(--radius-full);
            font-size: 0.8rem;
            font-weight: 600;
            background: var(--color-accent-soft);
            color: var(--color-accent);
          }
          .btn-secondary {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--color-accent);
            background: transparent;
            border: 1px solid var(--color-accent-muted);
            border-radius: var(--radius-md);
            text-decoration: none;
            transition: background var(--transition-fast), border-color var(--transition-fast);
          }
          .btn-secondary:hover {
            background: var(--color-accent-soft);
            border-color: var(--color-accent);
          }
          .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1.5rem;
            padding: 1rem 0;
            border-bottom: 1px solid var(--color-border-light);
          }
          .toggle-row:last-of-type { border-bottom: none; }
          .toggle-label { font-size: 0.95rem; font-weight: 500; color: var(--color-text); display: block; }
          .toggle-hint { font-size: 0.8rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }
          .toggle {
            flex-shrink: 0;
            width: 44px;
            height: 24px;
            border-radius: 12px;
            border: 1px solid var(--color-border-input);
            background: var(--color-surface-alt);
            cursor: pointer;
            position: relative;
            transition: background var(--transition-fast), border-color var(--transition-fast);
          }
          .toggle:hover { border-color: var(--color-border); }
          .toggle.on {
            background: var(--color-accent);
            border-color: var(--color-accent);
          }
          .toggle-thumb {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            transition: transform var(--transition-fast);
          }
          .toggle.on .toggle-thumb { transform: translateX(20px); }
          .coming-soon {
            margin: 1rem 0 0;
            padding: 0.75rem;
            background: var(--color-surface-alt);
            border-radius: var(--radius-md);
            font-size: 0.8rem;
            color: var(--color-text-muted);
            line-height: 1.4;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

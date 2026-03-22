import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const PLACEHOLDER_PROJECTS = [
  { title: 'Project Alpha', desc: 'Next-generation cloud infrastructure scaling and security audit.', progress: 85, color: 'blue' },
  { title: 'Project Beta', desc: 'Design system unification across mobile and web platforms.', progress: 62, color: 'purple' },
  { title: 'Project Gamma', desc: 'AI-driven analytics dashboard for enterprise clients.', progress: 40, color: 'purple' },
  { title: 'Project Delta', desc: 'Legacy system migration and API documentation overhaul.', progress: 12, color: 'orange' },
];

const PLACEHOLDER_NOTIFICATIONS = [
  { icon: '✓', title: 'Project Alpha review completed by S...', time: '2H AGO', type: 'success' },
  { icon: '📅', title: 'Quarterly performance review sched...', time: '5H AGO', type: 'info' },
  { icon: '⚠', title: 'Design system v2.4 is now available.', time: '1D AGO', type: 'warning' },
  { icon: '🎉', title: 'Congratulations on 2 years with us!', time: '2D AGO', type: 'anniversary' },
];

export default function Profile() {
  const router = useRouter();
  const { id } = router.query;

  // Separate: who is logged in vs. whose profile we're viewing
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState('');
  const [profileSaveMsg, setProfileSaveMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const fetchProfile = async () => {
      try {
        // Always fetch the session user first — needed for AppLayout nav
        const meRes = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!meRes.ok) {
          router.replace('/login');
          return;
        }
        const meData = await meRes.json();
        const sessionUser = meData.user;
        setLoggedInUser(sessionUser);
        setEditName(sessionUser?.display_name ?? sessionUser?.email ?? '');

        if (id) {
          // Viewing another employee's profile
          const empRes = await fetch(`${API_BASE}/api/get_user_details.php?id=${id}`, { credentials: 'include' });
          if (!empRes.ok) {
            console.error('Failed to fetch employee profile:', empRes.status);
            setLoading(false);
            return;
          }
          const empData = await empRes.json();
          setProfileUser(empData);
        } else {
          // Viewing own profile
          setProfileUser(sessionUser);
        }
      } catch (err) {
        console.error('Connection failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router.isReady, id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaveMsg('');
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/update-profile.php`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ display_name: editName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileSaveMsg(data.error || 'Update failed');
        return;
      }
      const updatedName = data.user?.display_name ?? editName;
      setLoggedInUser((u) => ({ ...u, display_name: updatedName }));
      setProfileUser((u) => ({ ...u, display_name: updatedName }));
      setProfileSaveMsg('Saved.');
    } catch {
      setProfileSaveMsg('Network error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/change-password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordMsg(data.error || 'Failed');
        return;
      }
      setPasswordMsg('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordMsg('Network error');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="layout loading-only">
        <div className="loading-state"><p>Loading Profile Details...</p></div>
        <style jsx>{`
          .loading-only { display: flex; min-height: 100vh; background: var(--color-surface-alt); }
          .loading-state { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; font-weight: 600; color: var(--color-accent); }
        `}</style>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="layout" style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Profile Not Found</h2>
        <p>Could not retrieve data for User ID: {id}</p>
        <p style={{ fontSize: '0.8rem', color: 'gray', marginTop: '1rem' }}>
          Check your Network tab for a 401 or 403 error.
        </p>
        <button
          onClick={() => router.push('/direct-reports')}
          className="btn-primary"
          style={{ width: 'auto', marginTop: '1rem' }}
        >
          Return to List
        </button>
      </div>
    );
  }

  // Only fields that actually exist in the DB: id, email, display_name, role
  const isSelf = !id;
  const displayName = profileUser.display_name || profileUser.email || 'Unknown';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = profileUser.role
    ? profileUser.role.charAt(0).toUpperCase() + profileUser.role.slice(1)
    : 'Employee';

  return (
    <>
      <Head>
        <title>{isSelf ? 'My Profile' : `${displayName}'s Profile`} — PerformancePlatform</title>
      </Head>
      <AppLayout
        user={loggedInUser}
        activeNav="profile"
        breadcrumb={
          <>Home <span className="sep">›</span> Performance <span className="sep">›</span> {isSelf ? 'My Profile' : 'Employee Details'}</>
        }
        title={isSelf ? 'My Profile' : 'Employee Profile'}
        subtitle={isSelf ? 'Manage your account settings' : `Reviewing profile for ${displayName}`}
      >
        <div className="profile-grid">

          {/* LEFT COLUMN */}
          <div className="profile-col-left">
            <div className="card profile-card">
              <div className="profile-avatar-wrap">
                <div className="avatar-large">{initials}</div>
                <span className="status-dot online" />
              </div>
              <h2 className="profile-name">{displayName}</h2>
              <p className="profile-title">{roleLabel}</p>
              <p className="profile-email-muted">{profileUser.email}</p>
            </div>

            {/* Only show edit tools on own profile */}
            {isSelf && (
              <>
                <div className="card account-edit-card">
                  <h3>Edit profile</h3>
                  <form onSubmit={handleSaveProfile}>
                    <label htmlFor="display_name">Display name</label>
                    <input
                      id="display_name"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                    />
                    {profileSaveMsg && <p className="form-msg">{profileSaveMsg}</p>}
                    <button type="submit" className="btn-primary btn-sm" disabled={profileLoading}>
                      {profileLoading ? 'Saving…' : 'Save'}
                    </button>
                  </form>
                </div>
                <div id="password" className="card account-edit-card">
                  <h3>Change password</h3>
                  <form onSubmit={handleChangePassword}>
                    <label htmlFor="current_password">Current password</label>
                    <input
                      id="current_password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                    />
                    <label htmlFor="new_password">New password</label>
                    <input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                    />
                    <label htmlFor="confirm_password">Confirm new password</label>
                    <input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                    />
                    {passwordMsg && <p className="form-msg">{passwordMsg}</p>}
                    <button type="submit" className="btn-primary btn-sm" disabled={passwordLoading}>
                      {passwordLoading ? 'Updating…' : 'Update password'}
                    </button>
                  </form>
                </div>
              </>
            )}

            <div className="card quick-stats-card">
              <h3>QUICK STATS</h3>
              <div className="stat-row"><span>Satisfaction</span><span className="stat-value">98%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '98%' }} /></div>
              <div className="stat-row"><span>Attendance</span><span className="stat-value">100%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '100%' }} /></div>
            </div>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="profile-col-mid">
            <div className="card metric-card">
              <h3>PERFORMANCE METRIC</h3>
              <p className="total-projects">TOTAL PROJECTS: 60</p>
              <div className="metric-pills">
                <span className="pill">A</span>
                <span className="pill">B</span>
                <span className="pill">C</span>
                <span className="pill">D</span>
                <span className="pill more">+56</span>
              </div>
            </div>
            <section className="active-projects">
              <h3>• ACTIVE PROJECTS</h3>
              <div className="project-grid">
                {PLACEHOLDER_PROJECTS.map((p, i) => (
                  <div key={i} className="project-card">
                    <span className={`project-icon ${p.color}`}>{p.title[0]}</span>
                    <h4>{p.title}</h4>
                    <p>{p.desc}</p>
                    <div className="progress-bar">
                      <div className={`progress-fill ${p.color}`} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="progress-pct">{p.progress}%</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="profile-col-right">
            <div className="card summary-card">
              <h3>Performance Summary</h3>
              <div className="summary-chart">
                {[40, 55, 65, 80, 95].map((h, i) => (
                  <div key={i} className="summary-bar" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="summary-label">Excellent Growth</p>
              <p className="summary-sublabel">+12% from last quarter</p>
            </div>
            <div className="card notifications-card">
              <h3>Notifications</h3>
              <ul className="notif-list">
                {PLACEHOLDER_NOTIFICATIONS.map((n, i) => (
                  <li key={i}>
                    <span className="notif-icon">{n.icon}</span>
                    <div><p>{n.title}</p><span className="notif-time">{n.time}</span></div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <style jsx>{`
          .profile-grid { display: grid; grid-template-columns: 240px 1fr 260px; gap: 1.5rem; }
          @media (max-width: 1100px) { .profile-grid { grid-template-columns: 1fr 1fr; } .profile-col-left { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr auto; gap: 1rem; } }
          @media (max-width: 700px) { .profile-grid { grid-template-columns: 1fr; } .profile-col-left { grid-template-columns: 1fr; } }
          .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.35rem; box-shadow: var(--shadow-card); }
          .profile-card { text-align: center; }
          .profile-avatar-wrap { position: relative; display: inline-block; margin-bottom: 0.25rem; }
          .avatar-large { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--color-accent) 0%, #1d4ed8 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 600; margin: 0 auto; box-shadow: var(--shadow-md); }
          .status-dot { position: absolute; bottom: 4px; right: 4px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--color-surface); }
          .status-dot.online { background: #22c55e; }
          .profile-name { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.25rem; }
          .profile-title { font-size: 0.9rem; color: var(--color-text-muted); margin: 0; }
          .profile-email-muted { font-size: 0.85rem; color: var(--color-text-muted); margin: 0.5rem 0 0; }
          .account-edit-card { margin-top: 1rem; }
          .account-edit-card h3 { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; margin: 0 0 1rem; }
          .account-edit-card label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.35rem; }
          .account-edit-card input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--color-border-input); border-radius: var(--radius-md); font-size: 0.9rem; margin-bottom: 0.75rem; box-sizing: border-box; }
          .form-msg { font-size: 0.8rem; color: var(--color-accent); margin: -0.5rem 0 0.75rem; }
          .btn-primary { width: 100%; padding: 0.65rem 1rem; background: var(--color-accent); border: none; border-radius: var(--radius-md); color: white; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3); }
          .btn-primary:hover { background: var(--color-accent-hover); transform: translateY(-1px); }
          .btn-primary:active { transform: translateY(0); }
          .btn-sm { padding: 0.5rem 0.75rem; font-size: 0.875rem; }
          .quick-stats-card { margin-top: 1rem; }
          .quick-stats-card h3 { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; margin: 0 0 1rem; }
          .stat-row { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem; }
          .stat-value { font-weight: 600; color: var(--color-accent); }
          .progress-bar { height: 8px; background: var(--color-surface-alt); border-radius: 4px; overflow: hidden; margin-bottom: 1rem; }
          .progress-fill { height: 100%; background: var(--color-accent); transition: width 0.3s ease; }
          .progress-fill.blue { background: #3b82f6; }
          .progress-fill.purple { background: #8b5cf6; }
          .progress-fill.orange { background: #f97316; }
          .metric-card h3 { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; margin: 0 0 0.5rem; }
          .total-projects { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0 0 0.75rem; }
          .metric-pills { display: flex; gap: 0.5rem; }
          .pill { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--color-surface-alt); font-size: 0.8rem; font-weight: 600; }
          .pill.more { background: var(--color-accent); color: white; font-size: 0.7rem; }
          .active-projects { margin-top: 1.25rem; }
          .active-projects h3 { font-size: 0.85rem; font-weight: 600; margin: 0 0 0.75rem; }
          .project-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
          .project-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.15rem; transition: box-shadow 0.2s; }
          .project-card:hover { box-shadow: var(--shadow-md); }
          .project-card h4 { font-size: 0.9rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
          .project-card p { font-size: 0.8rem; color: var(--color-text-secondary); margin: 0 0 0.75rem; line-height: 1.4; }
          .progress-pct { font-size: 0.75rem; color: var(--color-text-muted); }
          .project-icon { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; color: white; font-weight: 700; }
          .project-icon.blue { background: #3b82f6; }
          .project-icon.purple { background: #8b5cf6; }
          .project-icon.orange { background: #f97316; }
          .summary-card h3, .notifications-card h3 { font-size: 0.85rem; font-weight: 600; margin: 0 0 1rem; }
          .summary-chart { display: flex; align-items: flex-end; gap: 0.5rem; height: 100px; margin-bottom: 0.75rem; }
          .summary-bar { flex: 1; background: linear-gradient(to top, #93c5fd, #3b82f6); border-radius: 4px 4px 0 0; }
          .summary-label { font-size: 0.9rem; font-weight: 600; margin: 0; }
          .summary-sublabel { font-size: 0.8rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }
          .notifications-card { margin-top: 1.25rem; }
          .notif-list { list-style: none; padding: 0; margin: 0; }
          .notif-list li { display: flex; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid var(--color-border); align-items: flex-start; }
          .notif-list li:last-child { border-bottom: none; }
          .notif-icon { font-size: 1rem; flex-shrink: 0; }
          .notif-list p { font-size: 0.82rem; margin: 0 0 0.2rem; }
          .notif-time { font-size: 0.72rem; color: var(--color-text-muted); }
        `}</style>
      </AppLayout>
    </>
  );
}
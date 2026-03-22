import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function DirectoryPage() {
  const router = useRouter();
  const { q: qFromUrl } = router.query;
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(typeof qFromUrl === 'string' ? qFromUrl : '');

  useEffect(() => {
    const q = typeof qFromUrl === 'string' ? qFromUrl : '';
    if (q !== undefined) setSearch(q);
  }, [qFromUrl]);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!meRes.ok) {
          router.replace('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        if (meData.user?.role !== 'manager') {
          router.replace('/dashboard');
          return;
        }
        const teamRes = await fetch(`${API_BASE}/api/team_members.php`, { credentials: 'include' });
        if (teamRes.ok) {
          const json = await teamRes.json();
          setMembers(json.team_members || []);
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.trim().toLowerCase();
    return members.filter((m) =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q) ||
      (m.department || '').toLowerCase().includes(q)
    );
  }, [members, search]);

  if (loading || !user) {
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

  return (
    <>
      <Head>
        <title>Company Directory — PerformancePlatform</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="directory"
        breadcrumb={<>Team <span className="sep">›</span> Company Directory</>}
        title="Company Directory"
        subtitle="Global visibility of the organization's talent pool"
      >
        <section className="manager-page-section">
          <p className="section-desc">
            Browse the organization&apos;s talent pool for staffing and cross-team visibility.
          </p>
          {members.length > 0 && (
            <div className="directory-search card">
              <label htmlFor="dir-search" className="visually-hidden">Search directory</label>
              <input
                id="dir-search"
                type="search"
                placeholder="Search by name, email, role, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <span className="search-result-count">{filtered.length} of {members.length}</span>
            </div>
          )}
          <div className="directory-grid">
            {filtered.length === 0 ? (
              <div className="card empty-state-card">
                <span className="empty-icon" aria-hidden>◉</span>
                <h3>{members.length === 0 ? 'No directory data yet' : 'No matches'}</h3>
                <p>{members.length === 0 ? 'Populate team data or connect to your HR source.' : 'Try a different search.'}</p>
              </div>
            ) : (
              filtered.map((m) => (
                <div key={m.id} className="card directory-card">
                  <div className="dir-avatar" aria-hidden>{m.name.slice(0, 2).toUpperCase()}</div>
                  <h4>{m.name}</h4>
                  <p className="dir-role">{m.role || '—'}</p>
                  <p className="dir-dept">{m.department || '—'}</p>
                  <span className="dir-email">{m.email || '—'}</span>
                </div>
              ))
            )}
          </div>
        </section>
        <style jsx>{`
          .manager-page-section { max-width: 960px; }
          .section-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 1.5rem; line-height: 1.55; }
          .directory-search { padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
          .search-input {
            width: 100%;
            max-width: 360px;
            padding: 0.6rem 1rem;
            border: 1px solid var(--color-border-input);
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
          }
          .search-input:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent-muted); }
          .search-result-count { font-size: var(--text-xs); color: var(--color-text-muted); margin-left: 1rem; }
          .directory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }
          .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
          .directory-card { padding: 1.35rem; text-align: center; }
          .dir-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--color-accent-soft);
            color: var(--color-accent);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.9rem;
            margin: 0 auto 0.75rem;
          }
          .directory-card h4 { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: var(--color-text); }
          .dir-role { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0 0 0.15rem; }
          .dir-dept { font-size: var(--text-xs); color: var(--color-text-muted); margin: 0 0 0.5rem; }
          .dir-email { font-size: var(--text-xs); color: var(--color-accent); word-break: break-all; }
          .empty-state-card { grid-column: 1 / -1; text-align: center; padding: 2.5rem 2rem; }
          .empty-icon { width: 48px; height: 48px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; background: var(--color-surface-alt); color: var(--color-accent); border-radius: var(--radius-lg); font-size: 1.25rem; }
          .empty-state-card h3 { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 600; }
          .empty-state-card p { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }
          .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
        `}</style>
      </AppLayout>
    </>
  );
}

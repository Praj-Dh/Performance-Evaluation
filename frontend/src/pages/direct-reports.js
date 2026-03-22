import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function DirectReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [filterReview, setFilterReview] = useState('');
  const [search, setSearch] = useState('');

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
          // Debug: log what fields your backend actually returns
          if (json.team_members?.length) console.log('team_members sample:', json.team_members[0]);
          setMembers(json.team_members || []);
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const roles = useMemo(() => {
    const set = new Set(members.map((m) => m.role).filter(Boolean));
    return Array.from(set).sort();
  }, [members]);

  const managerDepartment = useMemo(() => {
    if (!user) return null;
    const meRow = members.find(
      (m) =>
        (m.user_id && m.user_id === user.id) ||
        (m.email && m.email === user.email)
    );
    return meRow?.department || null;
  }, [members, user]);

  const filtered = useMemo(() => {
    let list = members;

    // Restrict to the manager's department and exclude the manager themself
    if (managerDepartment) {
      list = list.filter(
        (m) =>
          (m.department || '') === managerDepartment &&
          (m.user_id || m.id) !== user.id
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) =>
        // Support both display_name and name in case backend field differs
        (m.display_name || m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q)
      );
    }
    if (filterRole) list = list.filter((m) => (m.role || '') === filterRole);
    if (filterReview) {
      if (filterReview === 'reviewed') list = list.filter((m) => m.review_status === 'completed' || m.last_review_date);
      if (filterReview === 'due') list = list.filter((m) => !m.review_status && !m.last_review_date);
    }
    return list;
  }, [members, search, filterRole, filterReview, managerDepartment, user]);

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
        <title>Direct Reports — PerformancePlatform</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="direct-reports"
        breadcrumb={<>Team <span className="sep">›</span> Direct Reports</>}
        title="Direct Reports"
        subtitle="Filter by job title, score, and review status. Compare team members fairly."
      >
        <section className="manager-page-section">
          <p className="section-desc">
            Manage and evaluate your direct reports. Write reviews and make objective, data-backed decisions.
          </p>

          <div className="filters-bar card">
            <div className="filter-search">
              <label htmlFor="dr-search" className="visually-hidden">Search by name, email, role, or department</label>
              <input
                id="dr-search"
                type="search"
                placeholder="Search by name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-row">
              <label htmlFor="dr-role">Job title</label>
              <select id="dr-role" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="">All</option>
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <label htmlFor="dr-review">Review status</label>
              <select id="dr-review" value={filterReview} onChange={(e) => setFilterReview(e.target.value)}>
                <option value="">All</option>
                <option value="due">Review due</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
            <p className="filter-result-count">{filtered.length} of {members.length} report(s)</p>
          </div>

          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role / Title</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      {members.length === 0
                        ? 'No direct reports loaded. Team data comes from your backend.'
                        : 'No report(s) match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id}>
                      {/* Use display_name with fallback to name in case backend field name differs */}
                      <td><strong>{m.display_name || m.name || '—'}</strong></td>
                      <td>{m.role || '—'}</td>
                      <td>{m.department || '—'}</td>
                      <td><span className="email-cell">{m.email || '—'}</span></td>
                      <td>
                        <div className="actions-cell">
                          {/* Use user_id for the Users table PK, fall back to id if not present */}
                          <Link
                            href={{ pathname: '/profile', query: { id: m.user_id || m.id } }}
                            className="action-link"
                          >
                            View details
                          </Link>
                          <Link href="/write-review" className="action-link">Write review</Link>
                          <Link
                            href={{
                              pathname: '/peers/chat',
                              query: {
                                with: m.user_id || m.id,
                                name: m.display_name || m.name || '',
                              },
                            }}
                            className="action-link"
                          >
                            Chat
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <style jsx>{`
          .manager-page-section { max-width: 1000px; }
          .section-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 1.5rem; line-height: 1.55; }
          .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
          .filters-bar { padding: 1.25rem; margin-bottom: 1.25rem; }
          .filter-search { margin-bottom: 1rem; }
          .search-input {
            width: 100%;
            max-width: 320px;
            padding: 0.6rem 1rem;
            border: 1px solid var(--color-border-input);
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
          }
          .search-input:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent-muted); }
          .filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
          .filter-row label { font-size: var(--text-sm); font-weight: 500; color: var(--color-text); }
          .filter-row select {
            padding: 0.5rem 0.75rem;
            border: 1px solid var(--color-border-input);
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
          }
          .filter-result-count { font-size: var(--text-xs); color: var(--color-text-muted); margin: 0.75rem 0 0; }
          .table-card { overflow: hidden; }
          .data-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
          .data-table th {
            text-align: left;
            padding: 0.75rem 1.25rem;
            background: var(--color-surface-alt);
            font-weight: 600;
            color: var(--color-text-muted);
            font-size: var(--text-xs);
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .data-table td { padding: 0.75rem 1.25rem; border-top: 1px solid var(--color-border); }
          .email-cell { font-size: 0.875rem; color: var(--color-text-secondary); }
          .actions-cell {
            display: inline-flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            align-items: center;
          }
          .empty-cell { text-align: center; color: var(--color-text-muted); padding: 2.5rem 1.25rem !important; }
          .action-link {
            color: var(--color-accent);
            font-size: var(--text-sm);
            font-weight: 500;
            margin-right: 0;
            text-decoration: none;
          }
          .action-link:hover { text-decoration: underline; }
          .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
        `}</style>
      </AppLayout>
    </>
  );
}
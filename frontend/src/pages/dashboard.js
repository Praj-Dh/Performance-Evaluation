import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employeeStats, setEmployeeStats] = useState({ collaborationCount: null, reviewsCount: null, currentScore: null });
  const [managerStats, setManagerStats] = useState({ directReports: null, reviewsDue: null, goalsInProgress: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        const u = data.user;
        setUser(u);

        const isManager = u?.role === 'manager' || u?.role === 'admin';

        if (isManager) {
          const [teamsRes, notifRes] = await Promise.all([
            fetch(`${API_BASE}/api/manager/teams.php`, { credentials: 'include' }),
            fetch(`${API_BASE}/api/notifications.php`, { credentials: 'include' }),
          ]);
          let directReports = 0;
          if (teamsRes.ok) {
            const teamsData = await teamsRes.json();
            const teams = teamsData.teams || [];
            const memberPromises = teams.map((t) =>
              fetch(`${API_BASE}/api/manager/team-members.php?team_id=${t.id}`, { credentials: 'include' }).then((r) => r.json())
            );
            const memberResults = await Promise.all(memberPromises);
            const allUserIds = new Set();
            memberResults.forEach((json) => {
              (json.team_members || []).forEach((m) => {
                if (m.user_id) allUserIds.add(m.user_id);
              });
            });
            directReports = allUserIds.size;
          }
          const reviewsDue = notifRes.ok ? (await notifRes.json()).notifications?.length ?? 0 : 0;
          setManagerStats({ directReports, reviewsDue, goalsInProgress: 0 });
        } else {
          const [collabRes, reviewsRes] = await Promise.all([
            fetch(`${API_BASE}/api/collaboration-log.php`, { credentials: 'include' }),
            fetch(`${API_BASE}/api/reviews.php`, { credentials: 'include' }),
          ]);
          let collaborationCount = 0;
          let reviewsCount = 0;
          let currentScore = null;
          if (collabRes.ok) {
            const collabData = await collabRes.json();
            const events = collabData.events || [];
            collaborationCount = events.filter((e) => e.status === 'submitted').length;
          }
          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            const reviews = reviewsData.reviews || [];
            reviewsCount = reviewsData.total_reviews ?? reviews.length;
            currentScore = reviewsData.avg_score ?? (reviews[0]?.score ?? null);
          }
          setEmployeeStats({ collaborationCount, reviewsCount, currentScore });
        }
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
          .loading-state { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        `}</style>
      </div>
    );
  }

  if (!user) return null;

  const isManager = user.role === 'manager' || user.role === 'admin';

  return (
    <>
      <Head>
        <title>{`${isManager ? 'Team Dashboard' : 'My Dashboard'} — PerformancePlatform`}</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="dashboard"
        breadcrumb={
          isManager
            ? <>Team <span className="sep">›</span> Management <span className="sep">›</span> Dashboard</>
            : <>Home <span className="sep">›</span> Performance <span className="sep">›</span> Dashboard</>
        }
        title={isManager ? 'Team Dashboard' : 'My Dashboard'}
        subtitle={isManager ? 'Team health and performance overview' : 'Your performance and contribution overview'}
      >
        {isManager ? <ManagerDashboardContent user={user} stats={managerStats} /> : <EmployeeDashboardContent user={user} stats={employeeStats} />}
      </AppLayout>
    </>
  );
}

function EmployeeDashboardContent({ user, stats }) {
  const { collaborationCount, reviewsCount, currentScore } = stats || {};
  return (
    <>
      <section className="dashboard-hero employee-hero">
        <p className="dashboard-hero-tag">My Work</p>
        <h2 className="dashboard-hero-title">Your contribution at a glance</h2>
        <p className="dashboard-hero-desc">
          Track personal growth and ensure mentoring, peer support, and collaboration are visible to management. Monitor scores and review feedback to align with expectations.
        </p>
        <div className="hero-stats">
          <div className="hero-stat-card">
            <span className="hero-stat-value">{currentScore != null ? currentScore : '—'}</span>
            <span className="hero-stat-label">Current score</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{collaborationCount != null ? collaborationCount : '—'}</span>
            <span className="hero-stat-label">Collaboration events</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{reviewsCount != null ? reviewsCount : '—'}</span>
            <span className="hero-stat-label">Reviews received</span>
          </div>
        </div>
      </section>

      <section className="cards-section">
        <h2 className="section-title">Quick actions</h2>
        <div className="card-grid">
          <Link href="/log-event" className="card card-action card-action-primary">
            <span className="card-action-icon" aria-hidden>+</span>
            <h3>Collaboration Log</h3>
            <p>Record mentoring, knowledge sharing, and peer support so it counts toward your review.</p>
          </Link>
          <Link href="/performance-history" className="card card-action">
            <span className="card-action-icon" aria-hidden>◷</span>
            <h3>Performance History</h3>
            <p>View all your performance reviews, scores, and manager feedback.</p>
          </Link>
          <Link href="/impact-trends" className="card card-action">
            <span className="card-action-icon" aria-hidden>◷</span>
            <h3>Impact Trends</h3>
            <p>Granular view of performance and contribution mix across dimensions.</p>
          </Link>
          <Link href="/reviews" className="card card-action">
            <span className="card-action-icon" aria-hidden>★</span>
            <h3>My Reviews</h3>
            <p>Read feedback history and align with company expectations.</p>
          </Link>
        </div>
      </section>

      <section className="cards-section">
        <div className="card card-tip">
          <span className="tip-icon" aria-hidden>!</span>
          <div>
            <strong>Reduce recency bias</strong>
            <p>Log collaboration events regularly so your full contribution is visible—not just recent work. Evaluations are based on longitudinal evidence.</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .dashboard-hero {
          margin-bottom: 2.5rem;
          padding: 2.25rem 2.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          position: relative;
          overflow: hidden;
        }
        .employee-hero {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
          border-color: var(--color-border);
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .employee-hero::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(105deg, transparent 30%, rgba(37, 99, 235, 0.04) 100%);
          pointer-events: none;
        }
        .dashboard-hero-tag {
          font-size: var(--text-xs);
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--color-accent);
          margin: 0 0 0.5rem;
          text-transform: uppercase;
        }
        .dashboard-hero-title {
          font-size: 1.625rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 0.5rem;
          letter-spacing: -0.03em;
          line-height: 1.25;
        }
        .dashboard-hero-desc {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin: 0 0 1.75rem;
          line-height: 1.6;
          max-width: 560px;
        }
        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 640px) {
          .hero-stats { grid-template-columns: 1fr; }
          .dashboard-hero { padding: 1.5rem 1.25rem; }
        }
        .hero-stat-card {
          background: #fff;
          border-radius: var(--radius-lg);
          padding: 1.75rem 1.5rem;
          text-align: center;
          border: 1px solid var(--color-border-light);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }
        .hero-stat-card:hover {
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.1), 0 4px 8px rgba(0, 0, 0, 0.04);
          border-color: var(--color-accent-muted);
          transform: translateY(-2px);
        }
        .hero-stat-value {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-accent);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .hero-stat-label {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--color-text-muted);
          margin-top: 0.35rem;
          display: block;
          letter-spacing: 0.02em;
        }
        .cards-section { margin-bottom: 2.25rem; }
        .section-title {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 1.25rem;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.25rem;
        }
        .card-action {
          display: block;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.75rem 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: box-shadow 0.25s ease, border-color 0.2s ease, transform 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .card-action:hover {
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1), 0 4px 12px rgba(37, 99, 235, 0.08);
          border-color: var(--color-accent-muted);
          text-decoration: none;
          transform: translateY(-3px);
        }
        .card-action-primary {
          border-color: var(--color-accent-muted);
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1), 0 2px 4px rgba(0, 0, 0, 0.04);
        }
        .card-action-primary:hover {
          border-color: var(--color-accent);
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.18), 0 4px 8px rgba(0, 0, 0, 0.04);
        }
        .card-action-icon {
          font-size: 1.25rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: var(--color-surface-alt);
          border-radius: var(--radius-lg);
          margin-bottom: 1rem;
          color: var(--color-accent);
          transition: background 0.2s ease, color 0.2s ease;
        }
        .card-action:hover .card-action-icon {
          background: var(--color-accent-muted);
          color: var(--color-accent-hover);
        }
        .card-action-primary .card-action-icon {
          background: rgba(37, 99, 235, 0.15);
          color: var(--color-accent);
        }
        .card-action h3 {
          font-size: 1.0625rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: var(--color-text);
          letter-spacing: -0.01em;
        }
        .card-action p {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.5;
        }
        .card-tip {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid var(--color-accent-muted);
          border-radius: var(--radius-xl);
          padding: 1.75rem 1.5rem;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .tip-icon {
          font-size: 1rem;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          background: var(--color-accent-muted);
          color: var(--color-accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .card-tip strong {
          display: block;
          font-size: var(--text-sm);
          font-weight: 600;
          margin-bottom: 0.35rem;
          color: var(--color-text);
        }
        .card-tip p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: 1.55;
        }
      `}</style>
    </>
  );
}

function ManagerDashboardContent({ user, stats }) {
  const { directReports, reviewsDue, goalsInProgress } = stats || {};
  return (
    <>
      <section className="dashboard-hero manager-hero">
        <p className="dashboard-hero-tag">Team Management</p>
        <h2 className="dashboard-hero-title">Team health & performance</h2>
        <p className="dashboard-hero-desc">
          Data-backed overview for objective reviews, fair comparisons across direct reports, and defensible promotion and compensation decisions.
        </p>
        <div className="hero-stats manager-stats">
          <div className="hero-stat-card">
            <span className="hero-stat-value">{directReports != null ? directReports : '—'}</span>
            <span className="hero-stat-label">Direct reports</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{reviewsDue != null ? reviewsDue : '—'}</span>
            <span className="hero-stat-label">Reviews due</span>
          </div>
          <div className="hero-stat-card">
            <span className="hero-stat-value">{goalsInProgress != null ? goalsInProgress : '—'}</span>
            <span className="hero-stat-label">Goals in progress</span>
          </div>
        </div>
      </section>

      <section className="cards-section">
        <h2 className="section-title">Manager actions</h2>
        <div className="card-grid">
          <Link href="/direct-reports" className="card card-action card-action-primary">
            <span className="card-action-icon" aria-hidden>◉</span>
            <h3>Direct Reports</h3>
            <p>Filter by job title, score, and review status. Compare team members fairly and deep-dive into employee details.</p>
          </Link>
          <Link href="/goals" className="card card-action">
            <span className="card-action-icon" aria-hidden>◉</span>
            <h3>Goal Management</h3>
            <p>Set and track specific performance objectives for your team.</p>
          </Link>
          <Link href="/directory" className="card card-action">
            <span className="card-action-icon" aria-hidden>◉</span>
            <h3>Company Directory</h3>
            <p>Global visibility of the organization&apos;s talent pool.</p>
          </Link>
        </div>
      </section>

      <section className="cards-section">
        <div className="card card-tip manager-tip">
          <span className="tip-icon" aria-hidden>!</span>
          <div>
            <strong>Data-backed decisions</strong>
            <p>Base evaluations on longitudinal evidence—reviews, collaboration logs, and goals—so promotions and compensation are defensible and fair.</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .dashboard-hero {
          margin-bottom: 2.5rem;
          padding: 2.25rem 2.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          position: relative;
          overflow: hidden;
        }
        .manager-hero {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-color: var(--color-border);
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .dashboard-hero-tag {
          font-size: var(--text-xs);
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--color-success);
          margin: 0 0 0.5rem;
          text-transform: uppercase;
        }
        .dashboard-hero-title { font-size: 1.625rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.5rem; letter-spacing: -0.02em; }
        .dashboard-hero-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 1.75rem; line-height: 1.55; max-width: 560px; }
        .hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        @media (max-width: 640px) { .hero-stats { grid-template-columns: 1fr; } .dashboard-hero { padding: 1.5rem 1.25rem; } }
        .manager-stats .hero-stat-card {
          background: #fff;
          border: 1px solid var(--color-border-light);
          padding: 1.75rem 1.5rem;
          border-radius: var(--radius-lg);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }
        .manager-stats .hero-stat-card:hover {
          box-shadow: 0 12px 28px rgba(21, 128, 61, 0.1), 0 4px 8px rgba(0, 0, 0, 0.04);
          border-color: #bbf7d0;
          transform: translateY(-2px);
        }
        .hero-stat-card { border-radius: var(--radius-lg); text-align: center; }
        .manager-stats .hero-stat-value { color: var(--color-success); }
        .hero-stat-value { display: block; font-size: 2rem; font-weight: 700; color: var(--color-accent); letter-spacing: -0.02em; }
        .hero-stat-label { font-size: var(--text-xs); font-weight: 500; color: var(--color-text-muted); margin-top: 0.35rem; display: block; }
        .cards-section { margin-bottom: 2.5rem; }
        .dimensions-section { margin-bottom: 2.5rem; }
        .section-title {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 1.25rem;
        }
        .section-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 1.25rem; line-height: 1.55; }
        .dimension-pills { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .dimension-pill {
          padding: 0.625rem 1.25rem;
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; }
        .card-action {
          display: block;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 1.75rem 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: box-shadow 0.25s ease, border-color 0.2s ease, transform 0.2s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .card-action:hover { box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1), 0 4px 12px rgba(37, 99, 235, 0.08); border-color: var(--color-accent-muted); text-decoration: none; transform: translateY(-3px); }
        .card-action-primary { border-color: var(--color-accent-muted); background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1), 0 2px 4px rgba(0, 0, 0, 0.04); }
        .card-action-primary:hover { border-color: var(--color-accent); box-shadow: 0 12px 28px rgba(37, 99, 235, 0.18), 0 4px 8px rgba(0, 0, 0, 0.04); }
        .card-action-icon { font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #f1f5f9; border-radius: var(--radius-lg); margin-bottom: 1rem; color: var(--color-success); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
        .card-action-primary .card-action-icon { background: rgba(37, 99, 235, 0.15); color: var(--color-accent); }
        .card-action h3 { font-size: 1.0625rem; font-weight: 600; margin: 0 0 0.5rem; color: var(--color-text); }
        .card-action p { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0; line-height: 1.5; }
        .card-tip {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          border-radius: var(--radius-xl);
          padding: 1.75rem 1.5rem;
        }
        .manager-tip { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04); }
        .tip-icon { font-size: 1rem; flex-shrink: 0; width: 32px; height: 32px; background: #bbf7d0; color: var(--color-success); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .card-tip strong { display: block; font-size: var(--text-sm); font-weight: 600; margin-bottom: 0.35rem; color: var(--color-text); }
        .card-tip p { margin: 0; font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.55; }
      `}</style>
    </>
  );
}

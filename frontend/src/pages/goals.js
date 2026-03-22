import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function GoalsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        if (data.user?.role !== 'manager') {
          router.replace('/dashboard');
          return;
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

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
        <title>Goal Management — PerformancePlatform</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="goals"
        breadcrumb={<>Team <span className="sep">›</span> Goal Management</>}
        title="Goal Management"
        subtitle="Set and track performance objectives for your team"
      >
        <section className="manager-page-section">
          <p className="section-desc">
            Set and track specific performance objectives for each direct report so evaluations are aligned with clear, measurable goals.
          </p>
          <div className="card empty-state-card">
            <span className="empty-icon" aria-hidden>◉</span>
            <h3>Goal Management</h3>
            <p>Define and track individual performance goals per direct report. This view is for managers. Feature can be wired to a goals API when ready.</p>
          </div>
        </section>
        <style jsx>{`
          .manager-page-section { max-width: 640px; }
          .section-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 1.5rem; line-height: 1.55; }
          .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
          .empty-state-card {
            padding: 2.5rem 2rem;
            text-align: center;
          }
          .empty-icon {
            width: 56px;
            height: 56px;
            margin: 0 auto 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-surface-alt);
            color: var(--color-accent);
            border-radius: var(--radius-lg);
            font-size: 1.5rem;
          }
          .empty-state-card h3 { margin: 0 0 0.5rem; font-size: 1.15rem; font-weight: 600; color: var(--color-text); }
          .empty-state-card p { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.5; }
        `}</style>
      </AppLayout>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function GettingStarted() {
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

  return (
    <>
      <Head>
        <title>Getting Started — Performance Platform</title>
      </Head>
      <AppLayout
        user={user}
        breadcrumb={<><Link href="/dashboard">Dashboard</Link> <span className="sep">›</span> Help <span className="sep">›</span> Getting Started</>}
        title="Getting Started"
        subtitle="Learn how to make the most of the Performance Platform"
      >
        <div className="help-page">
          <section className="help-section">
            <h2>Welcome to the Performance Platform</h2>
            <p>
              This platform helps you track your contributions, log collaboration events, and stay aligned with your team and company goals. Your manager uses the same data for fair, evidence-based reviews.
            </p>
          </section>

          <section className="help-section">
            <h2>Quick steps</h2>
            <ol className="help-steps">
              <li>
                <strong>Log your work</strong> — Use <Link href="/log-event">Log Event</Link> to record mentoring, knowledge sharing, and peer support. Doing this regularly gives a full picture of your contribution, not just recent activity.
              </li>
              <li>
                <strong>Check your dashboard</strong> — Your <Link href="/dashboard">Dashboard</Link> shows your performance overview, quick actions, and tips to reduce recency bias.
              </li>
              <li>
                <strong>Review feedback</strong> — Visit <Link href="/reviews">My Reviews</Link> to read feedback and align with expectations. Use <Link href="/impact-trends">Impact Trends</Link> to see how your contribution mix changes over time.
              </li>
              <li>
                <strong>Stay visible</strong> — Keep your <Link href="/profile">Profile</Link> up to date and check <Link href="/settings">Settings</Link> for notifications and preferences.
              </li>
            </ol>
          </section>

          {isManager && (
            <section className="help-section">
              <h2>For managers</h2>
              <p>
                Use <Link href="/direct-reports">Direct Reports</Link> to see your team at a glance. Write reviews and track progress with <Link href="/goals">Goal Management</Link>. The <Link href="/directory">Company Directory</Link> helps you find people across the organization.
              </p>
            </section>
          )}

          <section className="help-section">
            <h2>Need more help?</h2>
            <p>
              Check the <Link href="/faq">FAQ</Link> for common questions, <Link href="/contact-support">contact support</Link> for assistance, or <Link href="/contact-sales">contact sales</Link> for plans and pricing.
            </p>
          </section>
        </div>
        <style jsx>{`
          .help-page { max-width: 720px; }
          .help-section {
            margin-bottom: 2.5rem;
            padding: 1.5rem 0;
            border-bottom: 1px solid var(--color-border-light);
          }
          .help-section:last-of-type { border-bottom: none; }
          .help-section h2 {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--color-text);
            margin: 0 0 0.75rem;
          }
          .help-section p {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            line-height: 1.6;
            margin: 0;
          }
          .help-steps {
            margin: 0;
            padding-left: 1.5rem;
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            line-height: 1.7;
          }
          .help-steps li { margin-bottom: 0.75rem; }
          .help-steps li:last-child { margin-bottom: 0; }
        `}</style>
      </AppLayout>
    </>
  );
}

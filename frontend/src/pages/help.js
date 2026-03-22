import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const HELP_LINKS = [
  { href: '/getting-started', label: 'Getting started', description: 'Guided overview and quick steps to use the platform.' },
  { href: '/faq', label: 'FAQ', description: 'Frequently asked questions and common answers.' },
  { href: '/contact-support', label: 'Contact support', description: 'Get help with technical issues, account questions, or feedback.' },
  { href: '/contact-sales', label: 'Contact sales', description: 'Inquire about plans, pricing, or enterprise options.' },
];

export default function Help() {
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

  return (
    <>
      <Head>
        <title>Help &amp; Support — Performance Platform</title>
      </Head>
      <AppLayout
        user={user}
        breadcrumb={<><Link href="/dashboard">Dashboard</Link> <span className="sep">›</span> Help</>}
        title="Help &amp; Support"
        subtitle="Find guides, FAQs, and ways to get in touch"
      >
        <div className="help-hub">
          <p className="help-hub-intro">
            Choose a topic below or reach out for assistance.
          </p>
          <ul className="help-hub-list">
            {HELP_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="help-hub-card">
                  <span className="help-hub-label">{item.label}</span>
                  <span className="help-hub-desc">{item.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <style jsx>{`
          .help-hub { max-width: 560px; }
          .help-hub-intro {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            margin: 0 0 1.5rem;
            line-height: 1.6;
          }
          .help-hub-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .help-hub-card {
            display: block;
            padding: 1.25rem 1.5rem;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            text-decoration: none;
            color: inherit;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .help-hub-card:hover {
            border-color: var(--color-accent-muted);
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
          }
          .help-hub-label {
            display: block;
            font-weight: 600;
            font-size: 1rem;
            color: var(--color-text);
            margin-bottom: 0.25rem;
          }
          .help-hub-desc {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            line-height: 1.5;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

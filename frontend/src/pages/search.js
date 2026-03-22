import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
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

  const query = (typeof q === 'string' ? q : (Array.isArray(q) ? q[0] : '') || '').trim();

  return (
    <>
      <Head>
        <title>Search{query ? `: ${query}` : ''} — Performance Platform</title>
      </Head>
      <AppLayout
        user={user}
        breadcrumb={<><Link href="/dashboard">Dashboard</Link> <span className="sep">›</span> Search</>}
        title="Search"
        subtitle={query ? `Results for “${query}”` : 'Use the search bar above to find people and content'}
      >
        <div className="search-page">
          {query ? (
            <div className="search-results-card">
              <p className="search-results-intro">
                Search across the platform for people and content. For the best experience searching by name, email, role, or department, use the Company Directory.
              </p>
              <Link
                href={user?.role === 'manager' ? `/directory?q=${encodeURIComponent(query)}` : '/dashboard'}
                className="search-result-link"
              >
                {user?.role === 'manager'
                  ? `Search Company Directory for “${query}”`
                  : 'Go to Dashboard'}
              </Link>
            </div>
          ) : (
            <p className="search-empty">
              Enter a search term in the header search bar and press Enter to see results.
            </p>
          )}
        </div>
        <style jsx>{`
          .search-page { max-width: 560px; }
          .search-results-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-xl);
            padding: 1.5rem 1.75rem;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
          }
          .search-results-intro {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            line-height: 1.6;
            margin: 0 0 1rem;
          }
          .search-result-link {
            display: inline-block;
            font-weight: 600;
            color: var(--color-accent);
            text-decoration: none;
          }
          .search-result-link:hover { text-decoration: underline; }
          .search-empty {
            font-size: var(--text-sm);
            color: var(--color-text-muted);
            margin: 0;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

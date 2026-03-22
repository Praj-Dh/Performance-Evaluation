import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function TeamMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!meRes.ok) {
          router.replace('/login');
          return;
        }
        const teamRes = await fetch(`${API_BASE}/api/team_members.php`, { credentials: 'include' });
        const json = await teamRes.json();
        if (!teamRes.ok) {
          if (teamRes.status === 401) {
            router.replace('/login');
            return;
          }
          setError(json.error || 'Failed to load team members');
          return;
        }
        setMembers(json.team_members || []);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <>
      <Head>
        <title>Team Members — PerformancePlatform</title>
      </Head>
      <main style={{ minHeight: '100vh', background: 'var(--color-surface-alt)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem' }}>Team Members API Demo</h1>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            This page calls <code>/api/team_members.php</code> and renders the JSON response in a simple table.
          </p>

          {loading && <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Loading…</p>}
          {error && !loading && <p style={{ margin: 0, color: 'var(--color-error)' }}>{error}</p>}

          {!loading && !error && (
            <div style={{ borderRadius: '12px', border: '1px solid var(--color-border)', overflowX: 'auto', background: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-alt)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Department</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '1.25rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No team members found. Add a few rows to the <code>TeamMembers</code> table in phpMyAdmin.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m.id}>
                        <td style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)' }}>{m.name}</td>
                        <td style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)' }}>{m.role || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)' }}>{m.department || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)' }}>{m.email || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}


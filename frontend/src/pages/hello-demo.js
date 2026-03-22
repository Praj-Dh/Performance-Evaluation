import { useEffect, useState } from 'react';
import Head from 'next/head';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function HelloDemo() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hello.php`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Request failed');
          return;
        }
        setData(json);
      } catch (e) {
        setError('Network error');
      }
    })();
  }, []);

  return (
    <>
      <Head>
        <title>Hello World Demo — PerformancePlatform</title>
      </Head>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-alt)' }}>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.75rem 2rem', boxShadow: 'var(--shadow-card)', maxWidth: 420, width: '100%' }}>
          <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.25rem' }}>Hello World API Demo</h1>
          {error && <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>}
          {!error && !data && <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Loading…</p>}
          {data && !error && (
            <>
              <p style={{ margin: '0 0 0.5rem' }}><strong>Message:</strong> {data.message}</p>
              <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                <strong>DB connection OK:</strong> {data.db_ok ? 'Yes' : 'No'}
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}


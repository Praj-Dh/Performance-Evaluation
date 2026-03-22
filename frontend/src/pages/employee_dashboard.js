import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Legacy route: redirect to the main dashboard so only one dashboard is available.
 */
export default function EmployeeDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="layout loading-only">
      <div className="loading-state"><p>Redirecting to dashboard…</p></div>
      <style jsx>{`
        .loading-only { display: flex; min-height: 100vh; background: var(--color-surface-alt); }
        .loading-state { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; }
      `}</style>
    </div>
  );
}

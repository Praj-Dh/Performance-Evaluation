import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirect /my-history to /performance-history (My History was removed from nav; Performance History is the single history destination).
 */
export default function MyHistoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/performance-history');
  }, [router]);
  return null;
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/** Format ISO date → "October 12, 2023" */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Get initials from name, e.g. "Sarah Miller" → "SM" */
function initials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Dimension score bar component */
function DimensionBar({ label, value, color }) {
  if (value == null) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color, whiteSpace: 'nowrap' }}>{value}/100</span>
      </div>
      <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function PerformanceHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgScore, setAvgScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');

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

        const revRes = await fetch(`${API_BASE}/api/reviews.php`, { credentials: 'include' });
        if (revRes.ok) {
          const json = await revRes.json();
          setReviews(json.reviews || []);
          setTotalReviews(json.total_reviews || 0);
          setAvgScore(json.avg_score);
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    const da = new Date(a.review_date || a.created_at);
    const db = new Date(b.review_date || b.created_at);
    return sortOrder === 'newest' ? db - da : da - db;
  });

  if (loading || !user) {
    return (
      <div className="loading-page">
        <p>Loading…</p>
        <style jsx>{`
          .loading-page {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            background: var(--color-surface-alt);
            color: var(--color-text-muted);
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Performance History — PerformancePlatform</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="performance-history"
        breadcrumb={
          <>
            My Work <span className="sep">›</span> Performance History
          </>
        }
        title=""
        subtitle=""
      >
        <section className="ph-page">
          {/* Top bar: back link + sort */}
          <div className="ph-topbar">
            <Link href="/dashboard" className="back-link">
              ← Back to Dashboard
            </Link>
            <div className="sort-wrap">
              <label htmlFor="ph-sort" className="sort-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>
              </label>
              <select
                id="ph-sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Sort By: Date (Newest)</option>
                <option value="oldest">Sort By: Date (Oldest)</option>
              </select>
            </div>
          </div>

          {/* Header: title + employee + stats */}
          <div className="ph-header">
            <div className="ph-header-left">
              <h1 className="ph-title">Performance History</h1>
              <div className="ph-employee">
                <span className="ph-avatar" aria-hidden="true">
                  {initials(user.display_name)}
                </span>
                <span className="ph-emp-label">
                  Employee: <strong>{user.display_name || user.email}</strong>
                </span>
              </div>
            </div>
            <div className="ph-stats">
              <div className="stat-card">
                <span className="stat-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
                <div className="stat-body">
                  <span className="stat-label">AVG SCORE</span>
                  <span className="stat-value">{avgScore !== null ? `${avgScore}/100` : '—'}</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
                </span>
                <div className="stat-body">
                  <span className="stat-label">TOTAL REVIEWS</span>
                  <span className="stat-value">{totalReviews}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Review cards */}
          <div className="ph-reviews">
            {sortedReviews.length === 0 && (
              <div className="empty-state">
                <p>No performance reviews found yet.</p>
              </div>
            )}
            {sortedReviews.map((rev) => {
              const tags = rev.tags ? rev.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
              return (
                <div key={rev.id} className="review-card">
                  {/* Score badge */}
                  <div className="score-badge">
                    <span className="score-number">{rev.score ?? '—'}</span>
                    <span className="score-label">SCORE</span>
                  </div>

                  {/* Review body */}
                  <div className="review-body">
                    <div className="review-top">
                      <div>
                        <h3 className="review-title">{rev.title}</h3>
                        <span className="review-date">
                          {formatDate(rev.review_date || rev.created_at)}
                        </span>
                      </div>
                      <Link href={`/reviews?id=${rev.id}`} className="view-report">View Full Report ↗</Link>
                    </div>

                    {/* Manager feedback */}
                    {rev.manager_feedback && (
                      <div className="feedback-section">
                        <div className="feedback-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          MANAGER FEEDBACK
                        </div>
                        <p className="feedback-text">{rev.manager_feedback}</p>
                      </div>
                    )}

                    {/* Dimension Scores */}
                    {(rev.score_technical != null || rev.score_impact != null || rev.score_leadership != null) && (
                      <div className="dimension-scores">
                        <div className="dimension-label">SCORE BREAKDOWN</div>
                        <div className="dimension-grid">
                          <DimensionBar label="Technical Excellence" value={rev.score_technical} color="#3b82f6" />
                          <DimensionBar label="Impact & Delivery" value={rev.score_impact} color="#10b981" />
                          <DimensionBar label="Leadership & Influence" value={rev.score_leadership} color="#f59e0b" />
                        </div>
                      </div>
                    )}

                    {/* Manager info + tags row */}
                    <div className="review-footer">
                      <div className="manager-info">
                        {rev.manager_name && (
                          <>
                            <span className="manager-avatar" aria-hidden="true">
                              {initials(rev.manager_name)}
                            </span>
                            <div className="manager-meta">
                              <span className="manager-name">{rev.manager_name}</span>
                              {rev.manager_role && (
                                <span className="manager-role">
                                  {rev.manager_role === 'manager' ? 'Manager' : rev.manager_role}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="tag-list">
                        {tags.map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <style jsx>{`
          /* ===== Page layout ===== */
          .ph-page {
            width: 100%;
          }

          /* ===== Top bar ===== */
          .ph-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.25rem;
          }
          .back-link {
            font-size: var(--text-sm);
            color: var(--color-accent);
            text-decoration: none;
            font-weight: 500;
          }
          .back-link:hover {
            text-decoration: underline;
          }
          .sort-wrap {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: 0.4rem 0.75rem;
            background: var(--color-surface);
          }
          .sort-icon {
            display: flex;
            align-items: center;
            color: var(--color-text-muted);
          }
          .sort-wrap select {
            border: none;
            background: none;
            font-size: var(--text-sm);
            color: var(--color-text);
            font-weight: 500;
            cursor: pointer;
            padding-right: 0.25rem;
          }
          .sort-wrap select:focus {
            outline: none;
          }

          /* ===== Header ===== */
          .ph-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .ph-title {
            font-size: 1.75rem;
            font-weight: 700;
            margin: 0 0 0.5rem;
            color: var(--color-text);
          }
          .ph-employee {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .ph-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--color-accent-muted);
            color: var(--color-accent);
            font-size: 0.65rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ph-emp-label {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
          }
          .ph-emp-label strong {
            color: var(--color-text);
          }
          .ph-stats {
            display: flex;
            gap: 0.75rem;
          }
          .stat-card {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: 0.75rem 1rem;
            background: var(--color-surface);
          }
          .stat-icon {
            color: var(--color-text-muted);
            display: flex;
          }
          .stat-label {
            display: block;
            font-size: 0.65rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            color: var(--color-text-muted);
            text-transform: uppercase;
          }
          .stat-value {
            display: block;
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--color-text);
          }

          /* ===== Review cards ===== */
          .ph-reviews {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .empty-state {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--color-text-muted);
          }
          .review-card {
            display: flex;
            gap: 0;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-surface);
            box-shadow: var(--shadow-card);
            overflow: hidden;
          }

          /* Score badge (left blue column) */
          .score-badge {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-width: 100px;
            padding: 1.5rem 0.75rem;
            background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
            color: #fff;
            flex-shrink: 0;
          }
          .score-number {
            font-size: 2rem;
            font-weight: 700;
            line-height: 1;
          }
          .score-label {
            font-size: 0.6rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            margin-top: 0.3rem;
            opacity: 0.85;
          }

          /* Review body (right side) */
          .review-body {
            flex: 1;
            padding: 1.25rem 1.5rem;
            min-width: 0;
          }
          .review-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.75rem;
          }
          .review-title {
            font-size: 1.05rem;
            font-weight: 600;
            margin: 0;
            color: var(--color-text);
          }
          .review-date {
            font-size: var(--text-sm);
            color: var(--color-text-muted);
          }
          .view-report {
            font-size: var(--text-sm);
            color: var(--color-accent);
            font-weight: 500;
            white-space: nowrap;
            flex-shrink: 0;
            text-decoration: none;
          }
          .view-report:hover {
            text-decoration: underline;
            color: var(--color-accent-hover);
          }

          /* Feedback section */
          .feedback-section {
            margin-bottom: 1rem;
          }
          .feedback-label {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            color: var(--color-accent);
            text-transform: uppercase;
            margin-bottom: 0.4rem;
          }
          .feedback-text {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            margin: 0;
            line-height: 1.6;
          }

          /* Footer: manager + tags */
          .review-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.75rem;
            padding-top: 0.75rem;
            border-top: 1px solid var(--color-border-light);
          }
          .manager-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .manager-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--color-accent-muted);
            color: var(--color-accent);
            font-size: 0.65rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .manager-meta {
            display: flex;
            flex-direction: column;
          }
          .manager-name {
            font-size: var(--text-sm);
            font-weight: 600;
            color: var(--color-text);
          }
          .manager-role {
            font-size: 0.75rem;
            color: var(--color-text-muted);
          }
          .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
          }
          .tag {
            font-size: 0.7rem;
            font-weight: 500;
            letter-spacing: 0.03em;
            padding: 0.25rem 0.6rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            color: var(--color-text-secondary);
            background: var(--color-surface);
            text-transform: uppercase;
          }

          /* ===== Dimension Scores ===== */
          .dimension-scores {
            margin-bottom: 1rem;
          }
          .dimension-label {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            color: var(--color-text-muted);
            text-transform: uppercase;
            margin-bottom: 0.6rem;
          }
          .dimension-grid {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .dim-bar-row {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .dim-bar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .dim-bar-label {
            font-size: 0.8rem;
            color: var(--color-text-secondary);
            font-weight: 500;
          }
          .dim-bar-value {
            font-size: 0.8rem;
            font-weight: 700;
          }
          .dim-bar-track {
            height: 6px;
            background: var(--color-surface-alt);
            border-radius: 3px;
            overflow: hidden;
          }
          .dim-bar-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.5s ease;
          }

          /* ===== Responsive ===== */
          @media (max-width: 640px) {
            .ph-header {
              flex-direction: column;
            }
            .ph-stats {
              width: 100%;
            }
            .stat-card {
              flex: 1;
            }
            .review-card {
              flex-direction: column;
            }
            .score-badge {
              flex-direction: row;
              min-width: unset;
              padding: 0.75rem 1.25rem;
              gap: 0.5rem;
            }
            .score-label {
              margin-top: 0;
            }
            .review-footer {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}

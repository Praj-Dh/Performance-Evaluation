import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const SAMPLE_STRENGTHS = 'Consistently demonstrates high quality and mentorship. A go-to person for complex decisions within the team.';
const SAMPLE_GROWTH = 'Could improve on proactive cross-functional communication during early project scoping to avoid late-stage requirement shifts.';

export default function Reviews() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [feedbackRequests, setFeedbackRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchFeedbackRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/feedback_requests.php`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFeedbackRequests(data.feedback_requests || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [meRes, reviewsRes, feedbackRes] = await Promise.all([
          fetch(`${API_BASE}/api/me.php`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/reviews.php`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/feedback_requests.php`, { credentials: 'include' }),
        ]);
        if (!meRes.ok) {
          router.replace('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        if (reviewsRes.ok) {
          const revData = await reviewsRes.json();
          setReviews(revData.reviews || []);
        }
        if (feedbackRes.ok) {
          const fbData = await feedbackRes.json();
          setFeedbackRequests(fbData.feedback_requests || []);
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const openFeedbackModal = () => {
    setRequestMessage('');
    setRequestError(null);
    setSuccessMessage(null);
    setFeedbackModalOpen(true);
  };

  const closeFeedbackModal = () => {
    setFeedbackModalOpen(false);
    setRequestMessage('');
    setRequestSubmitting(false);
    setRequestError(null);
  };

  const openReviewModal = (review) => {
    setSelectedReview(review);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedReview(null);
  };

  const handleRequestFeedback = async (e) => {
    e.preventDefault();
    setRequestError(null);
    setRequestSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/feedback_requests.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: requestMessage || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRequestError(data.error || 'Request failed');
        setRequestSubmitting(false);
        return;
      }
      setFeedbackRequests((prev) => [data.feedback_request, ...prev]);
      closeFeedbackModal();
      setSuccessMessage('Feedback request sent. Your manager will be notified.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch {
      setRequestError('Something went wrong. Please try again.');
    } finally {
      setRequestSubmitting(false);
    }
  };

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

  const strengthsContent = reviews.find(r => r.rating && r.rating >= 4)?.content || SAMPLE_STRENGTHS;
  const growthContent = reviews.find(r => r.rating && r.rating <= 3)?.content || SAMPLE_GROWTH;

  return (
    <>
      <Head>
        <title>Performance Reviews — PerformancePlatform</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="reviews"
        breadcrumb={<><Link href="/dashboard">My Work</Link> <span className="sep">›</span> My Reviews</>}
        title="My Reviews"
        subtitle="Review feedback history and align with company expectations"
      >
        <div className="reviews-header">
          <span className="cycle-badge">Cycle Q4 2023</span>
          <div className="header-actions">
            <button type="button" className="btn-outline">Export Report ↓</button>
            <button type="button" className="btn-primary" onClick={openFeedbackModal}>+ Request Feedback</button>
          </div>
        </div>
        {successMessage && (
          <div className="reviews-success-msg" role="status">
            {successMessage}
          </div>
        )}
        {feedbackRequests.filter((r) => r.status === 'pending').length > 0 && (
          <p className="reviews-pending-hint">
            You have {feedbackRequests.filter((r) => r.status === 'pending').length} pending feedback request(s).
          </p>
        )}

        <div className="reviews-grid">
          <div className="reviews-main">
            <section className="feedback-section">
              <h2 className="section-heading">
                <span className="section-icon" aria-hidden>◉</span>
                Recent 360° feedback
              </h2>
              <div className="feedback-cards">
                <div className="feedback-card strengths">
                  <span className="feedback-card-icon">📈</span>
                  <h3>Key Strengths</h3>
                  <p>{strengthsContent}</p>
                  <div className="contributors">+{reviews.length || 3} contributors</div>
                </div>
                <div className="feedback-card growth">
                  <span className="feedback-card-icon">💡</span>
                  <h3>Growth Areas</h3>
                  <p>{growthContent}</p>
                  <span className="priority-badge">PRIORITY: MEDIUM</span>
                </div>
              </div>
            </section>

            <section className="history-section">
              <h2 className="section-heading">
                <span className="section-icon" aria-hidden>◷</span>
                Review history
              </h2>
              <div className="table-wrap">
                <table className="reviews-table">
                  <thead>
                    <tr>
                      <th>REVIEW CYCLE</th>
                      <th>REVIEWER</th>
                      <th>STATUS</th>
                      <th>WEIGHTED SCORE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-cell">
                          No reviews yet. Request feedback to get started.
                        </td>
                      </tr>
                    ) : (
                      reviews.slice(0, 5).map((r) => (
                        <tr key={r.id}>
                          <td>{r.title}<br /><small>{r.updated_at?.slice(0, 10)}</small></td>
                          <td><span className="reviewer-badge">SM</span> Manager</td>
                          <td><span className="status-pill completed">COMPLETED</span></td>
                          <td>
                            <span className="score">{r.rating ?? '—'}</span>
                            {r.rating != null && <div className="score-bar" style={{ width: `${(r.rating / 5) * 100}%` }} />}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="action-link action-link-button"
                              onClick={() => openReviewModal(r)}
                            >
                              VIEW
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="reviews-sidebar">
            <div className="metric-card">
              <h3>TECHNICAL PERFORMANCE</h3>
              <ul className="metric-list">
                <li><strong>Total PRs</strong> <span>142 <small className="positive">↑12%</small></span></li>
                <li><strong>Approval Rate</strong> <span>94%</span></li>
                <li><strong>Avg. Comments/PR</strong> <span>2.4</span></li>
                <li><strong>Merging Velocity</strong> <span>1.2 Days</span></li>
              </ul>
            </div>
            <div className="metric-card">
              <h3>COMMIT FREQUENCY (6M)</h3>
              <div className="bar-chart-placeholder">
                <div className="bar" style={{ height: '40%' }} />
                <div className="bar" style={{ height: '55%' }} />
                <div className="bar" style={{ height: '70%' }} />
                <div className="bar" style={{ height: '60%' }} />
                <div className="bar" style={{ height: '85%' }} />
                <div className="bar active" style={{ height: '100%' }} />
              </div>
              <div className="bar-labels">
                <span>JUL</span><span>AUG</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span>
              </div>
            </div>
            <div className="metric-card">
              <h3>REVIEWER BREAKDOWN</h3>
              <div className="donut-placeholder">
                <span className="donut-center">12 Total</span>
              </div>
              <div className="donut-legend">
                <span><i className="dot blue" /> Peers 60%</span>
                <span><i className="dot dark" /> Manager 40%</span>
              </div>
            </div>
          </aside>
        </div>

        {feedbackModalOpen && (
          <div className="reviews-modal-overlay" onClick={closeFeedbackModal} role="presentation">
            <div className="reviews-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="request-feedback-title" aria-modal="true">
              <h2 id="request-feedback-title" className="reviews-modal-title">Request Feedback</h2>
              <p className="reviews-modal-desc">
                Request feedback from your manager for this cycle. They will be notified and can provide input for your review.
              </p>
              {user.manager_id && user.manager_display_name ? (
                <p className="reviews-modal-manager">Request from: <strong>{user.manager_display_name}</strong></p>
              ) : (
                <p className="reviews-modal-no-manager">No manager assigned. You must be in a team with a manager to request feedback.</p>
              )}
              <form onSubmit={handleRequestFeedback} className="reviews-modal-form">
                <label htmlFor="feedback-request-message" className="reviews-modal-label">Message (optional)</label>
                <textarea
                  id="feedback-request-message"
                  className="reviews-modal-textarea"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="e.g. Focus on Q4 deliverables and collaboration."
                  rows={3}
                  disabled={!user.manager_id}
                />
                {requestError && <p className="reviews-modal-error">{requestError}</p>}
                <div className="reviews-modal-actions">
                  <button type="button" className="btn-outline" onClick={closeFeedbackModal} disabled={requestSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={requestSubmitting || !user.manager_id}>
                    {requestSubmitting ? 'Sending…' : 'Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {reviewModalOpen && selectedReview && (
          <div className="reviews-modal-overlay" onClick={closeReviewModal} role="presentation">
            <div
              className="reviews-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="review-detail-title"
              aria-modal="true"
            >
              <h2 id="review-detail-title" className="reviews-modal-title">
                {selectedReview.title}
              </h2>
              <p className="reviews-modal-desc">
                {selectedReview.manager_name
                  ? `Review from ${selectedReview.manager_name}`
                  : 'Performance review'}
                {selectedReview.review_date && (
                  <>
                    {' · '}
                    {selectedReview.review_date}
                  </>
                )}
              </p>

              <div className="review-detail-grid">
                <div className="review-detail-item">
                  <span className="detail-label">Weighted score</span>
                  <span className="detail-value">{selectedReview.rating ?? '—'}</span>
                </div>
                <div className="review-detail-item">
                  <span className="detail-label">Technical Excellence</span>
                  <span className="detail-value">{selectedReview.score_technical ?? '—'}</span>
                </div>
                <div className="review-detail-item">
                  <span className="detail-label">Impact &amp; Delivery</span>
                  <span className="detail-value">{selectedReview.score_impact ?? '—'}</span>
                </div>
                <div className="review-detail-item">
                  <span className="detail-label">Leadership &amp; Influence</span>
                  <span className="detail-value">{selectedReview.score_leadership ?? '—'}</span>
                </div>
              </div>

              {selectedReview.manager_feedback && (
                <div className="review-detail-section">
                  <h3 className="detail-section-title">Manager feedback</h3>
                  <p className="detail-text">{selectedReview.manager_feedback}</p>
                </div>
              )}
              {selectedReview.content && (
                <div className="review-detail-section">
                  <h3 className="detail-section-title">Summary</h3>
                  <p className="detail-text">{selectedReview.content}</p>
                </div>
              )}

              <div className="reviews-modal-actions">
                <button type="button" className="btn-outline" onClick={closeReviewModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .reviews-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .cycle-badge { font-size: 0.9rem; color: var(--color-text-muted); }
          .header-actions { display: flex; gap: 0.75rem; }
          .btn-outline {
            padding: 0.55rem 1.1rem;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-accent);
            font-size: var(--text-sm);
            font-weight: 500;
            cursor: pointer;
            transition: background var(--transition-fast), border-color var(--transition-fast);
          }
          .btn-outline:hover {
            background: var(--color-accent-soft);
            border-color: var(--color-accent);
          }
          .btn-primary {
            padding: 0.55rem 1.1rem;
            background: var(--color-accent);
            border: none;
            border-radius: var(--radius-md);
            color: white;
            font-size: var(--text-sm);
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
            transition: background var(--transition-fast), transform var(--transition-fast);
          }
          .btn-primary:hover {
            background: var(--color-accent-hover);
            transform: translateY(-1px);
          }
          .btn-primary:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }
          .reviews-success-msg {
            padding: 0.75rem 1rem;
            background: #dcfce7;
            color: #166534;
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
            margin-bottom: 1rem;
          }
          .reviews-pending-hint {
            font-size: var(--text-sm);
            color: var(--color-text-muted);
            margin: -0.5rem 0 1rem;
          }
          .reviews-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }
          .reviews-modal {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-xl);
            padding: 1.75rem;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }
          .reviews-modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0 0 0.5rem;
            color: var(--color-text);
          }
          .reviews-modal-desc {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            margin: 0 0 1rem;
            line-height: 1.5;
          }
          .reviews-modal-manager,
          .reviews-modal-no-manager {
            font-size: var(--text-sm);
            margin: 0 0 1rem;
          }
          .reviews-modal-no-manager { color: var(--color-text-muted); }
          .reviews-modal-form { margin-top: 0.5rem; }
          .reviews-modal-label {
            display: block;
            font-size: var(--text-sm);
            font-weight: 500;
            color: var(--color-text);
            margin-bottom: 0.35rem;
          }
          .reviews-modal-textarea {
            width: 100%;
            padding: 0.6rem 0.75rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
            font-family: inherit;
            resize: vertical;
            margin-bottom: 1rem;
          }
          .reviews-modal-textarea:disabled { background: var(--color-surface-alt); cursor: not-allowed; }
          .reviews-modal-error {
            font-size: var(--text-sm);
            color: #dc2626;
            margin: -0.5rem 0 0.75rem;
          }
          .reviews-modal-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
          }
          .reviews-grid {
            display: grid;
            grid-template-columns: 1fr 280px;
            gap: 1.5rem;
          }
          @media (max-width: 900px) {
            .reviews-grid { grid-template-columns: 1fr; }
          }
          .reviews-main { min-width: 0; }
          .section-heading {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            color: var(--color-text);
            margin: 0 0 1rem;
          }
          .section-icon { font-size: 1.1rem; }
          .feedback-section { margin-bottom: 2rem; }
          .feedback-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
          @media (max-width: 600px) { .feedback-cards { grid-template-columns: 1fr; } }
          .feedback-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: 1.5rem;
            box-shadow: var(--shadow-card);
          }
          .feedback-card-icon { font-size: 1.25rem; }
          .feedback-card h3 { font-size: 0.95rem; margin: 0.5rem 0 0.5rem; }
          .feedback-card p { font-size: 0.9rem; color: var(--color-text-muted); margin: 0; line-height: 1.45; }
          .contributors { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.75rem; }
          .priority-badge { font-size: 0.75rem; color: #ea580c; font-weight: 600; margin-top: 0.5rem; display: inline-block; }
          .history-section { margin-bottom: 1rem; }
          .table-wrap { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
          .reviews-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
          .reviews-table th {
            text-align: left;
            padding: 0.75rem 1rem;
            background: var(--color-surface-alt);
            font-weight: 600;
            color: var(--color-text-muted);
            text-transform: uppercase;
            font-size: 0.75rem;
          }
          .reviews-table td { padding: 0.75rem 1rem; border-top: 1px solid var(--color-border); }
          .reviews-table small { color: var(--color-text-muted); }
          .reviewer-badge {
            display: inline-block;
            background: var(--color-accent);
            color: white;
            font-size: 0.65rem;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            margin-right: 0.35rem;
          }
          .status-pill {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .status-pill.completed { background: #dcfce7; color: #166534; }
          .score { margin-right: 0.5rem; }
          .score-bar { height: 6px; background: var(--color-accent); border-radius: 3px; margin-top: 0.25rem; max-width: 80px; }
          .action-link { color: var(--color-accent); text-decoration: none; font-weight: 500; }
          .action-link-button {
            background: none;
            border: 0;
            padding: 0;
            cursor: pointer;
            font: inherit;
          }
          .empty-cell { color: var(--color-text-muted); text-align: center; padding: 1.5rem; }
          .positive { color: #16a34a; }
          .reviews-sidebar { display: flex; flex-direction: column; gap: 1rem; }
          .metric-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: 1.35rem;
            box-shadow: var(--shadow-card);
          }
          .metric-card h3 {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--color-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin: 0 0 1rem;
          }
          .metric-list { list-style: none; padding: 0; margin: 0; }
          .metric-list li {
            display: flex;
            justify-content: space-between;
            padding: 0.35rem 0;
            font-size: 0.9rem;
          }
          .metric-list strong { color: var(--color-text); }
          .bar-chart-placeholder {
            display: flex;
            align-items: flex-end;
            gap: 0.5rem;
            height: 80px;
            margin-bottom: 0.5rem;
          }
          .bar-chart-placeholder .bar {
            flex: 1;
            background: #bfdbfe;
            border-radius: 4px 4px 0 0;
          }
          .bar-chart-placeholder .bar.active { background: var(--color-accent); }
          .bar-labels {
            display: flex;
            justify-content: space-between;
            font-size: 0.7rem;
            color: var(--color-text-muted);
          }
          .donut-placeholder {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 8px solid var(--color-border);
            margin: 0 auto 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .donut-legend { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem; color: var(--color-text-muted); }
          .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.35rem; vertical-align: middle; }
          .dot.blue { background: var(--color-accent); }
          .dot.dark { background: #1e3a5f; }
          .review-detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.75rem;
            margin: 1rem 0 1.25rem;
          }
          .review-detail-item {
            padding: 0.75rem 0.85rem;
            border-radius: var(--radius-md);
            background: var(--color-surface-alt);
            border: 1px solid var(--color-border-light);
          }
          .detail-label {
            display: block;
            font-size: 0.75rem;
            color: var(--color-text-muted);
            margin-bottom: 0.15rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .detail-value {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--color-text);
          }
          .review-detail-section {
            margin: 0.75rem 0 0.5rem;
          }
          .detail-section-title {
            font-size: 0.85rem;
            font-weight: 600;
            margin: 0 0 0.25rem;
            color: var(--color-text);
          }
          .detail-text {
            margin: 0;
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            line-height: 1.5;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

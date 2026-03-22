import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const DIMENSIONS = [
  { id: 'technical', label: 'Technical Excellence', key: 'score_technical' },
  { id: 'impact', label: 'Impact & Delivery', key: 'score_impact' },
  { id: 'leadership', label: 'Leadership & Influence', key: 'score_leadership' },
];

export default function WriteReviewPage() {
  const router = useRouter();
  const { feedback_request_id } = router.query;
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [managerFeedback, setManagerFeedback] = useState('');
  const [score, setScore] = useState('');
  const [rating, setRating] = useState('');
  const [dimensionScores, setDimensionScores] = useState({ technical: '', impact: '', leadership: '' });
  const [reviewType, setReviewType] = useState('annual');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchTeams = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/manager/teams.php`, { credentials: 'include' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.teams || [];
  }, []);

  const fetchTeamMembers = useCallback(async (tid) => {
    if (!tid) return [];
    const res = await fetch(`${API_BASE}/api/manager/team-members.php?team_id=${tid}`, { credentials: 'include' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.team_members || [];
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    (async () => {
      try {
        const meRes = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!meRes.ok) {
          router.replace('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        if (meData.user?.role !== 'manager' && meData.user?.role !== 'admin') {
          router.replace('/dashboard');
          return;
        }
        const teamList = await fetchTeams();
        setTeams(teamList);
        const qTeam = router.query.team_id;
        const qEmp = router.query.employee_id;
        if (qTeam && teamList.some((t) => String(t.id) === String(qTeam))) {
          setTeamId(String(qTeam));
        } else if (teamList.length === 1) {
          setTeamId(String(teamList[0].id));
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, router.query.team_id, router.query.employee_id, router, fetchTeams]);

  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      setSelectedUserId('');
      return;
    }
    let cancelled = false;
    const qEmp = router.query.employee_id;
    fetchTeamMembers(teamId).then((list) => {
      if (!cancelled) {
        setMembers(list);
        if (qEmp && list.some((m) => String(m.user_id) === String(qEmp))) {
          setSelectedUserId(String(qEmp));
        } else {
          setSelectedUserId((prev) => (list.some((m) => String(m.user_id) === prev) ? prev : ''));
        }
      }
    });
    return () => { cancelled = true; };
  }, [teamId, fetchTeamMembers, router.query.employee_id]);

  const handleDimensionChange = (key, value) => {
    const v = value === '' ? '' : Math.min(100, Math.max(0, parseInt(value, 10) || 0));
    setDimensionScores((prev) => ({ ...prev, [key]: v === '' ? '' : String(v) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!selectedUserId || !teamId || !title.trim()) {
      setMessage({ type: 'error', text: 'Select team, member, and enter a title.' });
      return;
    }
    const scoreNum = score === '' ? null : Math.min(100, Math.max(0, parseInt(score, 10) || 0));
    const ratingNum = rating === '' ? null : Math.min(5, Math.max(1, parseInt(rating, 10) || 1));
    setSubmitting(true);
    try {
      const body = {
        user_id: parseInt(selectedUserId, 10),
        team_id: parseInt(teamId, 10),
        title: title.trim(),
        content: content.trim() || null,
        manager_feedback: managerFeedback.trim() || null,
        score: scoreNum,
        rating: ratingNum,
        score_technical: dimensionScores.technical === '' ? null : parseInt(dimensionScores.technical, 10),
        score_impact: dimensionScores.impact === '' ? null : parseInt(dimensionScores.impact, 10),
        score_leadership: dimensionScores.leadership === '' ? null : parseInt(dimensionScores.leadership, 10),
        review_type: reviewType,
      };
      if (feedback_request_id) body.feedback_request_id = parseInt(feedback_request_id, 10);
      const res = await fetch(`${API_BASE}/api/manager/reviews.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save review' });
        setSubmitting(false);
        return;
      }
      setMessage({ type: 'success', text: 'Review saved successfully.' });
      setTimeout(() => router.push('/direct-reports'), 1500);
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    }
    setSubmitting(false);
  };

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
        <title>Write Review — PerformancePlatform</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="write-review"
        breadcrumb={<>Team <span className="sep">›</span> Write Review</>}
        title="Write Review"
        subtitle="Write a performance review for a team member. Only members of teams you manage can be reviewed."
      >
        <section className="write-review-section">
          {teams.length === 0 ? (
            <div className="card" style={{ padding: '1.5rem' }}>
              <p className="form-message">You are not assigned as manager of any team. Only managers of a team can write reviews for that team&apos;s members.</p>
              <Link href="/direct-reports" className="btn-outline">Back to Direct Reports</Link>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="write-review-form card">
            <h3 className="form-heading">New review</h3>

            {teams.length > 1 && (
              <div className="form-group">
                <label htmlFor="wr-team">Team</label>
                <select
                  id="wr-team"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                >
                  <option value="">Select team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.department ? ` — ${t.department}` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {teams.length === 1 && <p className="form-hint">Team: <strong>{teams[0]?.name}</strong></p>}

            <div className="form-group">
              <label htmlFor="wr-member">Team member</label>
              <select
                id="wr-member"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={!teamId}
              >
                <option value="">Select member...</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.display_name}{m.role ? ` (${m.role})` : ''}</option>
                ))}
              </select>
              {teamId && members.length === 0 && (
                <p className="form-hint muted">No members with accounts in this team.</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="wr-title">Review title *</label>
              <input
                id="wr-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 2024 Performance Review"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="wr-type">Review type</label>
                <select id="wr-type" value={reviewType} onChange={(e) => setReviewType(e.target.value)}>
                  <option value="annual">Annual</option>
                  <option value="mid-year">Mid-year</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="wr-score">Overall score (0–100)</label>
                <input
                  id="wr-score"
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div className="form-group">
                <label htmlFor="wr-rating">Rating (1–5)</label>
                <input
                  id="wr-rating"
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>

            <div className="dimensions-row">
              {DIMENSIONS.map((d) => (
                <div key={d.id} className="form-group compact">
                  <label htmlFor={`wr-${d.key}`}>{d.label} (0–100)</label>
                  <input
                    id={`wr-${d.key}`}
                    type="number"
                    min={0}
                    max={100}
                    value={dimensionScores[d.id]}
                    onChange={(e) => handleDimensionChange(d.id, e.target.value)}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="wr-content">Summary / notes (optional)</label>
              <textarea
                id="wr-content"
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Brief summary or context..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="wr-feedback">Manager feedback *</label>
              <textarea
                id="wr-feedback"
                rows={4}
                value={managerFeedback}
                onChange={(e) => setManagerFeedback(e.target.value)}
                placeholder="Detailed feedback for the employee..."
              />
            </div>

            {message.text && (
              <p className={`form-message ${message.type}`}>{message.text}</p>
            )}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save review'}
              </button>
              <Link href="/direct-reports" className="btn-outline">Cancel</Link>
            </div>
          </form>
          )}
        </section>
        <style jsx>{`
          .write-review-section { max-width: 640px; }
          .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
          .write-review-form { padding: 1.5rem 1.75rem; }
          .form-heading { font-size: 1.1rem; font-weight: 600; margin: 0 0 1.25rem; color: var(--color-text); }
          .form-group { margin-bottom: 1.25rem; }
          .form-group.compact { margin-bottom: 1rem; }
          .form-group label {
            display: block;
            font-size: var(--text-sm);
            font-weight: 500;
            color: var(--color-text);
            margin-bottom: 0.4rem;
            overflow-wrap: break-word;
            word-wrap: break-word;
            line-height: 1.45;
          }
          .form-group select,
          .form-group input,
          .form-group textarea {
            width: 100%;
            padding: 0.6rem 0.75rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: var(--text-sm);
          }
          .form-group textarea { resize: vertical; min-height: 60px; }
          .form-hint { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0.5rem 0 0; }
          .form-hint.muted { color: var(--color-text-muted); }
          .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
          .dimensions-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .dimensions-row .form-group {
            min-width: 0;
          }
          .dimensions-row .form-group label {
            min-height: 2.6em;
          }
          @media (max-width: 768px) {
            .dimensions-row { grid-template-columns: 1fr; }
            .dimensions-row .form-group label { min-height: 0; }
          }
          @media (max-width: 640px) {
            .form-row { grid-template-columns: 1fr; }
          }
          .form-message { font-size: var(--text-sm); margin: 0 0 1rem; }
          .form-message.success { color: #166534; }
          .form-message.error { color: #dc2626; }
          .form-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.25rem; }
          .btn-primary {
            padding: 0.6rem 1.25rem;
            background: var(--color-accent);
            color: white;
            border: none;
            border-radius: var(--radius-md);
            font-weight: 600;
            font-size: var(--text-sm);
            cursor: pointer;
          }
          .btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
          .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
          .btn-outline {
            padding: 0.6rem 1.25rem;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text);
            font-size: var(--text-sm);
            font-weight: 500;
            text-decoration: none;
          }
          .btn-outline:hover { background: var(--color-surface-alt); text-decoration: none; }
        `}</style>
      </AppLayout>
    </>
  );
}

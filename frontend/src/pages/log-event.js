import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const EVENT_TYPES = [
  { id: 'mentorship', label: 'Mentorship', icon: '🎓' },
  { id: 'peer_support', label: 'Peer Support', icon: '👥' },
  { id: 'knowledge', label: 'Knowledge', icon: '💡' },
  { id: 'cross_dept', label: 'Cross-Dept', icon: '↔' },
];

const PLACEHOLDER_ACTIVITY = [
  { type: 'MENTORSHIP', title: 'Career roadmap chat w/ Tom', meta: 'Reviewed backend tech stack...', date: 'Yesterday', tag: 'yellow' },
  { type: 'PEER SUPPORT', title: 'Fixing production memory leak', meta: 'Identified circular dependency...', date: 'May 22', tag: 'blue' },
  { type: 'KNOWLEDGE', title: 'Documentation: API v2 Patterns', meta: 'Updated central wiki...', date: 'May 20', tag: 'green' },
];

export default function LogEvent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [eventType, setEventType] = useState('mentorship');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [taggedPeers, setTaggedPeers] = useState('');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/api/me.php`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/collaboration-log.php`, { credentials: 'include' }),
        ]);
        if (!meRes.ok) {
          router.replace('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        if (eventsRes.ok) {
          const ev = await eventsRes.json();
          setEvents(ev.events || []);
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const hoursThisWeek = events.filter(e => e.status === 'submitted').length * 1.5;
  const lastWeek = Math.max(0, events.length - 5);
  const pct = lastWeek > 0 ? Math.round(((events.length - lastWeek) / lastWeek) * 100) : 14;

  const handleSubmit = async (asDraft) => {
    setMessage({ type: '', text: '' });
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Event title is required.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/collaboration-log.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          event_type: eventType,
          title: title.trim(),
          event_date: eventDate,
          description: description.trim(),
          tagged_peers: taggedPeers.trim(),
          status: asDraft ? 'draft' : 'submitted',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save.' });
        setSaving(false);
        return;
      }
      setMessage({ type: 'success', text: asDraft ? 'Saved as draft.' : 'Log submitted.' });
      setTitle('');
      setDescription('');
      setTaggedPeers('');
      setEvents(prev => [{ id: data.id, event_type: eventType, title: title.trim(), event_date: eventDate, description: description.trim(), status: asDraft ? 'draft' : 'submitted', created_at: new Date().toISOString() }, ...prev]);
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    }
    setSaving(false);
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

  const rightSidebar = (
    <div className="unified-sidebar">
      <div className="widget">
        <h3>THIS WEEK AT A GLANCE</h3>
        <p className="widget-big">{hoursThisWeek.toFixed(1)} Collaboration Hours</p>
        <p className="widget-trend positive">+{pct}% vs last week</p>
        <div className="mini-bars">
          {[60, 80, 45, 90, 70, 100].map((h, i) => (
            <div key={i} className="mini-bar" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="widget border-top">
        <div className="widget-head">
          <h3>Recent Activity</h3>
          <Link href="/performance-history" className="view-all">View All</Link>
        </div>
        <ul className="activity-list">
          {(events.length ? events.slice(0, 3) : PLACEHOLDER_ACTIVITY).map((a, i) => (
            <li key={a.id || i}>
              <span className={`activity-tag ${(a.event_type || a.type || a.tag || 'blue').toLowerCase().replace(/[_ ]/g, '-')}`}>
                {a.event_type || a.type}
              </span>
              <p>{a.title}</p>
              <span className="activity-meta">{a.event_date || a.date}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="widget pro-tip border-top">
        <p><strong>Pro tip</strong></p>
        <p>Be specific about outcomes. Instead of &quot;helped with bug&quot;, try &quot;reduced app latency by 200ms through joint refactoring&quot;.</p>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Log Collaboration Event — Performance Platform</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="log-event"
        breadcrumb={<>Collaboration <span className="sep">/</span> New Collaboration Log</>}
        title="Log Collaboration Event"
        subtitle="Document your mentorship, knowledge sharing, and peer support to visualize team impact."
        rightSidebar={rightSidebar}
      >
        <section className="log-event-page">
          <div className="log-event-card">
            <p className="log-event-intro">
              Record a collaboration event so it counts toward your performance story. Choose the type, add a title and date, and optionally describe what happened and tag peers.
            </p>
            <div className="log-form-wrap">
              <h2 className="form-section-title">Event type</h2>
              <div className="event-type-row">
                <div className="event-type-btns">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`event-type-btn ${eventType === t.id ? 'active' : ''}`}
                      onClick={() => setEventType(t.id)}
                    >
                      <span className="et-icon">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="form-divider" />

              <h2 className="form-section-title">Details</h2>
              <div className="field">
                <label htmlFor="event-title">Event title</label>
                <input
                  id="event-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Performance optimization session with Alex"
                />
              </div>
              <div className="field field-row">
                <div className="field-half">
                  <label htmlFor="event-date">Date</label>
                  <input
                    id="event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="event-desc">What happened?</label>
                <textarea
                  id="event-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what was solved and the impact it had..."
                />
              </div>
              <div className="field">
                <label htmlFor="tag-peers">Tag peers (optional)</label>
                <div className="input-with-prefix">
                  <span className="input-prefix" aria-hidden>🔍</span>
                  <input
                    id="tag-peers"
                    type="text"
                    value={taggedPeers}
                    onChange={(e) => setTaggedPeers(e.target.value)}
                    placeholder="Search by name or email..."
                  />
                </div>
              </div>
              {message.text && (
                <p className={`form-message ${message.type}`} role="alert">{message.text}</p>
              )}
              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => handleSubmit(true)} disabled={saving}>
                  Save as draft
                </button>
                <button type="button" className="btn-primary" onClick={() => handleSubmit(false)} disabled={saving}>
                  Submit log
                </button>
              </div>
            </div>
          </div>
        </section>

        <style jsx>{`
          .log-event-page {
            max-width: 680px;
          }
          .log-event-card {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-card);
            padding: 1.75rem 2rem;
          }
          .log-event-intro {
            font-size: var(--text-sm);
            color: var(--color-text-secondary);
            line-height: 1.55;
            margin: 0 0 1.75rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--color-border-light);
          }
          .log-form-wrap {
            max-width: 100%;
          }
          .form-section-title {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--color-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin: 0 0 0.75rem;
          }
          .form-divider {
            border: none;
            border-top: 1px solid var(--color-border-light);
            margin: 1.5rem 0;
          }
          .form-section-title + .event-type-row { margin-top: 0; }
          .event-type-row {
            margin-bottom: 0.25rem;
          }
          .event-type-btns {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.75rem;
          }
          @media (max-width: 560px) {
            .event-type-btns { grid-template-columns: repeat(2, 1fr); }
          }
          .event-type-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.4rem;
            padding: 1rem 0.5rem;
            background: var(--color-surface-alt);
            border: 2px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            color: var(--color-text-secondary);
            cursor: pointer;
            transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
          }
          .event-type-btn:hover {
            border-color: var(--color-accent);
            color: var(--color-text);
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
          }
          .event-type-btn.active {
            border-color: var(--color-accent);
            background: var(--color-accent-soft);
            color: var(--color-accent);
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
          }
          .et-icon { font-size: 1.5rem; }
          .field {
            margin-top: 1.25rem;
          }
          .field-row {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
          }
          .field-half {
            flex: 1;
            min-width: 140px;
          }
          .field label {
            display: block;
            font-size: var(--text-sm);
            font-weight: 500;
            color: var(--color-text);
            margin-bottom: 0.4rem;
          }
          .field input,
          .field textarea {
            width: 100%;
            padding: 0.7rem 1rem;
            border: 1px solid var(--color-border-input);
            border-radius: var(--radius-md);
            font-size: var(--text-base);
            font-family: inherit;
            background: var(--color-surface);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .field textarea {
            resize: vertical;
            min-height: 110px;
          }
          .field input:focus,
          .field textarea:focus {
            outline: none;
            border-color: var(--color-accent);
            box-shadow: 0 0 0 3px var(--color-accent-muted);
          }
          .input-with-prefix {
            display: flex;
            align-items: center;
            border: 1px solid var(--color-border-input);
            border-radius: var(--radius-md);
            overflow: hidden;
            background: var(--color-surface);
          }
          .input-prefix {
            padding: 0 0.875rem;
            background: var(--color-surface-alt);
            color: var(--color-text-muted);
            font-size: 1rem;
          }
          .input-with-prefix input {
            flex: 1;
            border: none;
            padding: 0.7rem 1rem;
            background: transparent;
          }
          .form-message {
            margin-top: 1rem;
            font-size: var(--text-sm);
            padding: 0.5rem 0;
          }
          .form-message.success { color: var(--color-success); }
          .form-message.error { color: var(--color-error); }
          .form-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.75rem;
            padding-top: 1.25rem;
            border-top: 1px solid var(--color-border-light);
          }
          .btn-outline {
            padding: 0.65rem 1.35rem;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text);
            font-weight: 500;
            cursor: pointer;
            font-size: 0.9375rem;
            transition: background 0.2s ease, border-color 0.2s ease;
          }
          .btn-outline:hover:not(:disabled) {
            background: var(--color-surface-alt);
            border-color: var(--color-text-muted);
          }
          .btn-primary {
            padding: 0.65rem 1.35rem;
            background: var(--color-accent);
            border: none;
            border-radius: var(--radius-md);
            color: white;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.9375rem;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
            transition: background 0.2s ease, transform 0.1s ease;
          }
          .btn-primary:hover:not(:disabled) {
            background: var(--color-accent-hover);
            transform: translateY(-1px);
          }
          .btn-primary:active:not(:disabled) { transform: translateY(0); }
          @media (max-width: 640px) {
            .log-event-card { padding: 1.25rem 1.5rem; }
          }
          .unified-sidebar {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-card);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .widget {
            padding: 1.5rem;
          }
          .border-top {
            border-top: 1px solid var(--color-border-light);
          }
          .widget h3 {
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            color: var(--color-text-muted);
            margin: 0 0 0.75rem;
          }
          .widget-big {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-accent);
            margin: 0 0 0.25rem;
          }
          .widget-trend {
            font-size: var(--text-sm);
            margin: 0 0 0.75rem;
          }
          .widget-trend.positive { color: var(--color-success); }
          .mini-bars {
            display: flex;
            align-items: flex-end;
            gap: 4px;
            height: 48px;
          }
          .mini-bar {
            flex: 1;
            background: var(--color-accent-muted);
            border-radius: 4px 4px 0 0;
          }
          .mini-bar:last-child {
            background: var(--color-accent);
          }
          .widget-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }
          .widget-head h3 { margin: 0; }
          .view-all {
            font-size: 0.8rem;
            color: var(--color-accent);
          }
          .activity-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .activity-list li {
            padding: 0.6rem 0;
            border-bottom: 1px solid var(--color-border-light);
          }
          .activity-list li:last-child { border-bottom: none; }
          .activity-tag {
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            margin-right: 0.5rem;
          }
          .activity-tag.mentorship { background: #f5f5f7; color: #1d1d1f; border: 1px solid #d2d2d7; }
          .activity-tag.peer-support { background: #e5f0fa; color: #0066cc; border: 1px solid #b3d4f5; }
          .activity-tag.knowledge { background: #f0f7ff; color: #004c99; border: 1px solid #cce0ff; }
          .activity-tag.cross-dept { background: #f5f5f7; color: #515154; border: 1px solid #e5e5ea; }
          .activity-tag.yellow { background: #f5f5f7; color: #1d1d1f; border: 1px solid #d2d2d7; }
          .activity-tag.blue { background: #e5f0fa; color: #0066cc; border: 1px solid #b3d4f5; }
          .activity-tag.green { background: #f0f7ff; color: #004c99; border: 1px solid #cce0ff; }
          .activity-list p {
            margin: 0.35rem 0 0;
            font-size: 0.9rem;
          }
          .activity-meta {
            font-size: 0.75rem;
            color: var(--color-text-muted);
          }
          .pro-tip {
            background: var(--color-accent);
            color: white;
            border-color: var(--color-accent-hover);
          }
          .pro-tip p {
            margin: 0 0 0.35rem;
            font-size: 0.9rem;
          }
          .pro-tip strong { display: block; margin-bottom: 0.25rem; }
        `}</style>
      </AppLayout>
    </>
  );
}

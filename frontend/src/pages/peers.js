import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STORY_TASK_CARDS = [
  {
    title: 'Highlight important dates',
    description: 'As a peer, I can flag milestone dates so the whole team keeps deadlines visible.',
  },
  {
    title: 'Comment on a date',
    description: 'As a peer, I can leave context on a specific day so updates stay tied to the right date.',
  },
  {
    title: 'Review team context',
    description: 'As a peer, I can open any date and see notes so coordination stays clear and async.',
  },
];

function formatDateKey(year, monthIndex, day) {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  const startPad = first.getDay();
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export default function Peers() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [peers, setPeers] = useState([]);
  const [teamName, setTeamName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [importantDates, setImportantDates] = useState({});
  const [commentsByDate, setCommentsByDate] = useState({});
  const [commentDraft, setCommentDraft] = useState('');
  const [calendarReady, setCalendarReady] = useState(false);

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
        // Peers page is for employees; managers can still see their team peers if in a team
        const peersRes = await fetch(`${API_BASE}/api/peers.php`, { credentials: 'include' });
        if (peersRes.ok) {
          const data = await peersRes.json();
          setPeers(data.peers || []);
          setTeamName(data.team_name || null);
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const storageKey = useMemo(() => {
    const safeTeam = (teamName || 'team').toLowerCase().replace(/\s+/g, '-');
    return `peers-shared-calendar:${safeTeam}`;
  }, [teamName]);

  useEffect(() => {
    if (!teamName) return;
    setCalendarReady(false);
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setImportantDates({});
        setCommentsByDate({});
        setCalendarReady(true);
        return;
      }
      const parsed = JSON.parse(raw);
      setImportantDates(parsed.importantDates || {});
      setCommentsByDate(parsed.commentsByDate || {});
    } catch {
      setImportantDates({});
      setCommentsByDate({});
    } finally {
      setCalendarReady(true);
    }
  }, [storageKey, teamName]);

  useEffect(() => {
    if (!teamName || !calendarReady) return;
    const payload = JSON.stringify({ importantDates, commentsByDate });
    localStorage.setItem(storageKey, payload);
  }, [storageKey, teamName, calendarReady, importantDates, commentsByDate]);

  const filtered = useMemo(() => {
    if (!search.trim()) return peers;
    const q = search.trim().toLowerCase();
    return peers.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.display_name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.role || '').toLowerCase().includes(q)
    );
  }, [peers, search]);
  const monthDays = useMemo(
    () => getDaysInMonth(calendarMonth.year, calendarMonth.month),
    [calendarMonth]
  );
  const selectedComments = commentsByDate[selectedDate] || [];

  const prevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const toggleImportant = () => {
    setImportantDates((prev) => {
      const next = { ...prev };
      if (next[selectedDate]) delete next[selectedDate];
      else next[selectedDate] = true;
      return next;
    });
  };

  const addComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    const comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      author: user?.display_name || user?.email || 'Team member',
      createdAt: new Date().toISOString(),
    };
    setCommentsByDate((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), comment],
    }));
    setCommentDraft('');
  };

  const removeComment = (id) => {
    setCommentsByDate((prev) => {
      const existing = prev[selectedDate] || [];
      const nextList = existing.filter((c) => c.id !== id);
      const next = { ...prev };
      if (nextList.length === 0) delete next[selectedDate];
      else next[selectedDate] = nextList;
      return next;
    });
  };

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
        <title>Peers — Performance Platform</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="peers"
        breadcrumb={<>People <span className="sep">›</span> Peers</>}
        title="Peers"
        subtitle={teamName ? `Your team: ${teamName}. Chat and coordinate with teammates.` : 'View and connect with your team'}
      >
        <section className="peers-page-section">
          <p className="section-desc">
            See who’s on your team. Start a conversation or open the shared calendar to coordinate.
          </p>

          <div className="peers-actions-bar">
            <Link href="/peers/calendar" className="peers-calendar-link card">
              <span className="peers-action-icon" aria-hidden>📅</span>
              <span className="peers-action-label">Shared calendar</span>
              <span className="peers-action-desc">View team availability and events</span>
            </Link>
            {peers.length > 0 && (
              <div className="peers-search card">
                <label htmlFor="peers-search-input" className="visually-hidden">Search peers</label>
                <input
                  id="peers-search-input"
                  type="search"
                  placeholder="Search by name, email, or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
                <span className="search-result-count">{filtered.length} of {peers.length}</span>
              </div>
            )}
          </div>

          <div className="peers-grid">
            {filtered.length === 0 ? (
              <div className="card empty-state-card">
                <span className="empty-icon" aria-hidden>👥</span>
                <h3>{peers.length === 0 ? 'No teammates yet' : 'No matches'}</h3>
                <p>
                  {peers.length === 0
                    ? "You're not in a team yet, or you're the only member with an account. Ask your admin to add you to a team."
                    : 'Try a different search.'}
                </p>
                <Link href="/peers/calendar" className="btn btn-secondary">Open shared calendar</Link>
              </div>
            ) : (
              filtered.map((peer) => (
                <div key={peer.user_id} className="card peer-card">
                  <div className="peer-avatar" aria-hidden>
                    {(peer.display_name || peer.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="peer-name">{peer.display_name || peer.name}</h4>
                  <p className="peer-role">{peer.role || '—'}</p>
                  <p className="peer-email">{peer.email || '—'}</p>
                  <div className="peer-actions">
                    <Link
                      href={`/peers/chat?with=${peer.user_id}&name=${encodeURIComponent(peer.display_name || peer.name)}`}
                      className="peer-btn peer-btn-chat"
                    >
                      <span className="peer-btn-icon" aria-hidden>💬</span>
                      Chat
                    </Link>
                    <Link href="/peers/calendar" className="peer-btn peer-btn-calendar">
                      <span className="peer-btn-icon" aria-hidden>📅</span>
                      Calendar
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <section className="calendar-section">
            <div className="calendar-head">
              <div>
                <h3>Shared calendar</h3>
                <p>
                  Team members can flag important dates and leave comments directly on the date.
                </p>
              </div>
              <Link href="/peers/calendar" className="btn btn-secondary">Open full calendar view</Link>
            </div>

            <div className="task-cards">
              {STORY_TASK_CARDS.map((card) => (
                <article key={card.title} className="card task-card">
                  <h4>{card.title}</h4>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>

            <div className="calendar-workspace">
              <div className="card mini-calendar-card">
                <div className="mini-calendar-header">
                  <button type="button" className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">‹</button>
                  <strong>{MONTHS[calendarMonth.month]} {calendarMonth.year}</strong>
                  <button type="button" className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">›</button>
                </div>

                <div className="mini-calendar-grid">
                  {DAYS.map((d) => (
                    <div key={d} className="mini-calendar-day">{d}</div>
                  ))}
                  {monthDays.map((day, i) => {
                    if (day === null) {
                      return <div key={`empty-${i}`} className="mini-calendar-cell empty" />;
                    }
                    const key = formatDateKey(calendarMonth.year, calendarMonth.month, day);
                    const isSelected = selectedDate === key;
                    const isImportant = Boolean(importantDates[key]);
                    const commentCount = (commentsByDate[key] || []).length;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`mini-calendar-cell ${isSelected ? 'selected' : ''} ${isImportant ? 'important' : ''}`}
                        onClick={() => setSelectedDate(key)}
                      >
                        <span className="mini-date">{day}</span>
                        <span className="mini-markers">
                          {isImportant && <span className="marker marker-important" title="Important date">!</span>}
                          {commentCount > 0 && <span className="marker marker-comments" title={`${commentCount} comment(s)`}>{commentCount}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card calendar-detail-card">
                <h4>{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</h4>
                <div className="calendar-detail-actions">
                  <button type="button" className={`btn btn-secondary ${importantDates[selectedDate] ? 'btn-important' : ''}`} onClick={toggleImportant}>
                    {importantDates[selectedDate] ? 'Unmark important' : 'Mark as important'}
                  </button>
                </div>

                <div className="comment-form">
                  <label htmlFor="date-comment">Comment for this date</label>
                  <textarea
                    id="date-comment"
                    rows={3}
                    placeholder="Add context, reminders, or blockers..."
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                  />
                  <button type="button" className="btn btn-primary" onClick={addComment}>Add comment</button>
                </div>

                {selectedComments.length === 0 ? (
                  <p className="calendar-empty-text">No comments on this date yet.</p>
                ) : (
                  <ul className="calendar-comments">
                    {selectedComments.map((comment) => (
                      <li key={comment.id}>
                        <p>{comment.text}</p>
                        <div className="comment-meta">
                          <span>{comment.author}</span>
                          <span>{new Date(comment.createdAt).toLocaleString()}</span>
                          <button type="button" className="comment-delete" onClick={() => removeComment(comment.id)}>Remove</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </section>
        <style jsx>{`
          .peers-page-section { max-width: 960px; }
          .section-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 1.5rem; line-height: 1.55; }
          .peers-actions-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
          .peers-calendar-link {
            display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;
            background: var(--color-accent-soft); border: 1px solid var(--color-accent-muted);
            border-radius: var(--radius-lg); color: var(--color-accent); text-decoration: none;
            font-weight: var(--font-semibold); transition: background var(--transition-fast), border-color var(--transition-fast);
          }
          .peers-calendar-link:hover { background: var(--color-accent-muted); border-color: var(--color-accent); }
          .peers-action-icon { font-size: 1.25rem; }
          .peers-action-label { font-size: var(--text-sm); }
          .peers-action-desc { font-size: var(--text-xs); color: var(--color-text-muted); margin-left: 0.25rem; }
          @media (max-width: 640px) { .peers-action-desc { display: none; } }
          .peers-search { padding: 0.6rem 1rem; flex: 1; min-width: 200px; }
          .search-input {
            width: 100%; max-width: 280px; padding: 0.5rem 0.75rem;
            border: 1px solid var(--color-border-input); border-radius: var(--radius-md);
            font-size: var(--text-sm);
          }
          .search-input:focus { outline: none; border-color: var(--color-accent); }
          .search-result-count { font-size: var(--text-xs); color: var(--color-text-muted); margin-left: 0.75rem; }
          .peers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
          .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
          .peer-card { padding: 1.35rem; text-align: center; }
          .peer-avatar {
            width: 52px; height: 52px; border-radius: 50%; background: var(--color-accent-soft);
            color: var(--color-accent); display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 1rem; margin: 0 auto 0.75rem;
          }
          .peer-name { margin: 0 0 0.25rem; font-size: 1.05rem; font-weight: 600; color: var(--color-text); }
          .peer-role { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0 0 0.15rem; }
          .peer-email { font-size: var(--text-xs); color: var(--color-text-muted); margin: 0 0 1rem; word-break: break-all; }
          .peer-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
          .peer-btn {
            display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.85rem;
            border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: var(--font-medium);
            text-decoration: none; transition: background var(--transition-fast), color var(--transition-fast);
          }
          .peer-btn-chat { background: var(--color-accent); color: #fff; border: 1px solid var(--color-accent); }
          .peer-btn-chat:hover { background: var(--color-accent-hover); border-color: var(--color-accent-hover); color: #fff; }
          .peer-btn-calendar { background: var(--color-surface-alt); color: var(--color-text); border: 1px solid var(--color-border); }
          .peer-btn-calendar:hover { background: var(--color-border-light); border-color: var(--color-border-input); }
          .peer-btn-icon { font-size: 0.95rem; }
          .empty-state-card { grid-column: 1 / -1; text-align: center; padding: 2.5rem 2rem; }
          .empty-icon { font-size: 2.5rem; margin: 0 auto 1rem; display: block; }
          .empty-state-card h3 { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 600; }
          .empty-state-card p { margin: 0 0 1rem; font-size: var(--text-sm); color: var(--color-text-muted); }
          .btn { display: inline-block; padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: var(--font-medium); text-decoration: none; }
          .btn-primary { background: var(--color-accent); color: #fff; border: 1px solid var(--color-accent); cursor: pointer; }
          .btn-primary:hover { background: var(--color-accent-hover); border-color: var(--color-accent-hover); }
          .btn-secondary { background: var(--color-surface-alt); color: var(--color-accent); border: 1px solid var(--color-border); }
          .btn-secondary:hover { background: var(--color-accent-soft); }

          .calendar-section { margin-top: 2rem; }
          .calendar-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
          .calendar-head h3 { margin: 0 0 0.35rem; }
          .calendar-head p { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); }
          .task-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.9rem; margin-bottom: 1rem; }
          .task-card { padding: 1rem; }
          .task-card h4 { margin: 0 0 0.35rem; font-size: 0.95rem; }
          .task-card p { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); line-height: 1.45; }

          .calendar-workspace { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; }
          .mini-calendar-card { padding: 1rem; }
          .mini-calendar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
          .calendar-nav-btn {
            width: 32px; height: 32px; border-radius: var(--radius-sm);
            border: 1px solid var(--color-border); background: var(--color-surface-alt);
            font-size: 1.2rem; cursor: pointer;
          }
          .mini-calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.35rem; }
          .mini-calendar-day { text-align: center; font-size: 0.72rem; color: var(--color-text-muted); font-weight: 600; }
          .mini-calendar-cell {
            min-height: 56px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
            background: var(--color-surface-alt); cursor: pointer; display: flex; flex-direction: column;
            align-items: flex-start; justify-content: space-between; padding: 0.35rem;
          }
          .mini-calendar-cell.empty { border-color: transparent; background: transparent; cursor: default; }
          .mini-calendar-cell.selected { outline: 2px solid var(--color-accent); outline-offset: -1px; }
          .mini-calendar-cell.important { border-color: #f59e0b; background: #fffbeb; }
          .mini-date { font-size: 0.8rem; font-weight: 600; color: var(--color-text); }
          .mini-markers { display: inline-flex; align-items: center; gap: 0.2rem; }
          .marker { border-radius: 999px; font-size: 0.64rem; padding: 0.1rem 0.35rem; line-height: 1; }
          .marker-important { background: #f59e0b; color: #fff; font-weight: 700; }
          .marker-comments { background: #dbeafe; color: #1d4ed8; font-weight: 600; }

          .calendar-detail-card { padding: 1rem; }
          .calendar-detail-card h4 { margin: 0 0 0.75rem; }
          .calendar-detail-actions { margin-bottom: 0.75rem; }
          .btn-important { background: #fffbeb; border-color: #f59e0b; color: #b45309; }
          .comment-form { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
          .comment-form label { font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); }
          .comment-form textarea {
            width: 100%; resize: vertical; border: 1px solid var(--color-border-input);
            border-radius: var(--radius-md); padding: 0.6rem 0.75rem; font-size: var(--text-sm);
          }
          .calendar-empty-text { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); }
          .calendar-comments { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.65rem; }
          .calendar-comments li { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.65rem; background: var(--color-surface-alt); }
          .calendar-comments p { margin: 0 0 0.45rem; font-size: var(--text-sm); color: var(--color-text); white-space: pre-wrap; }
          .comment-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; font-size: var(--text-xs); color: var(--color-text-muted); }
          .comment-delete { margin-left: auto; border: none; background: transparent; color: #b91c1c; cursor: pointer; font-size: var(--text-xs); }

          @media (max-width: 900px) {
            .calendar-workspace { grid-template-columns: 1fr; }
          }
          .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
        `}</style>
      </AppLayout>
    </>
  );
}

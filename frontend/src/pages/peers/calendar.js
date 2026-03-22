import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDateKey(year, monthIndex, day) {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

const todayRef = new Date();
const DEMO_YEAR = todayRef.getFullYear();
const DEMO_MONTH = todayRef.getMonth();

// Frontend demo calendar events. These are also mirrored in the backend seed script.
const DUMMY_EVENTS = [
  {
    id: 1,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 3),
    time: '09:30',
    timeRange: '09:30–10:00',
    title: 'Weekly team standup',
    type: 'meeting',
  },
  {
    id: 2,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 4),
    time: '16:00',
    timeRange: '16:00–17:00',
    title: 'Focus block – code review',
    type: 'focus',
  },
  {
    id: 3,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 5),
    time: '14:00',
    timeRange: '14:00–14:30',
    title: '1:1 with manager',
    type: 'one_on_one',
  },
  {
    id: 4,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 7),
    time: '11:00',
    timeRange: '11:00–12:00',
    title: 'Project sync: Q2 goals',
    type: 'meeting',
  },
  {
    id: 5,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 9),
    time: '15:00',
    timeRange: '15:00–16:00',
    title: 'Design review with Product',
    type: 'meeting',
  },
  {
    id: 6,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 12),
    time: '13:00',
    timeRange: '13:00–15:00',
    title: 'Focus time (no meetings)',
    type: 'focus',
  },
  {
    id: 7,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 15),
    time: '10:00',
    timeRange: '10:00–11:00',
    title: 'Cross-team demo',
    type: 'meeting',
  },
  {
    id: 8,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 18),
    time: '09:30',
    timeRange: '09:30–10:00',
    title: 'Weekly team standup',
    type: 'meeting',
  },
  {
    id: 9,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 19),
    time: '17:00',
    timeRange: '17:00–17:30',
    title: '1:1 with mentor',
    type: 'one_on_one',
  },
  {
    id: 10,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 22),
    time: 'All day',
    timeRange: 'All day',
    title: 'Out of office — PTO',
    type: 'ooo',
  },
  {
    id: 11,
    date: formatDateKey(DEMO_YEAR, DEMO_MONTH, 25),
    time: '11:30',
    timeRange: '11:30–12:00',
    title: 'Peer pairing session',
    type: 'meeting',
  },
];

const EVENT_TYPE_LABELS = {
  meeting: 'Team meeting',
  one_on_one: '1:1',
  ooo: 'Out of office',
  focus: 'Focus time',
};

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  const startPad = first.getDay();
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export default function PeersCalendar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        setUser((await res.json()).user);
        const peersRes = await fetch(`${API_BASE}/api/peers.php`, { credentials: 'include' });
        if (peersRes.ok) {
          const data = await peersRes.json();
          setTeamName(data.team_name || 'Team');
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const today = new Date();
  const days = getDaysInMonth(date.year, date.month);
  const isToday = (day) => day !== null && date.year === today.getFullYear() && date.month === today.getMonth() && day === today.getDate();

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
  const eventsForSelectedDate = DUMMY_EVENTS.filter((e) => e.date === selectedDate);

  const prevMonth = () => {
    setDate((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setDate((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
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
        <title>Shared Calendar — Peers</title>
      </Head>
      <AppLayout
        user={user}
        activeNav="peers"
        breadcrumb={
          <>
            <Link href="/peers">People › Peers</Link>
            <span className="sep">›</span> Shared calendar
          </>
        }
        title="Shared calendar"
        subtitle={teamName ? `${teamName} — team availability and events` : 'Team availability and events'}
      >
        <section className="peers-calendar-section">
          <div className="calendar-actions">
            <Link href="/peers" className="back-link">← Back to Peers</Link>
            <p className="calendar-hint">View your team’s shared calendar. In a full implementation, events and availability would sync from your calendar provider.</p>
          </div>

          <div className="calendar-layout">
            <div className="card calendar-card">
              <div className="calendar-header">
                <button type="button" onClick={prevMonth} className="calendar-nav" aria-label="Previous month">
                  ‹
                </button>
                <h2 className="calendar-title">
                  {MONTHS[date.month]} {date.year}
                </h2>
                <button type="button" onClick={nextMonth} className="calendar-nav" aria-label="Next month">
                  ›
                </button>
              </div>
              <div className="calendar-grid-wrapper">
                <div className="calendar-grid">
                  {DAYS.map((d) => (
                    <div key={d} className="calendar-day-header">
                      {d}
                    </div>
                  ))}
                  {days.map((day, i) => {
                    if (day === null) {
                      return <div key={i} className="calendar-cell cell-empty" />;
                    }
                    const cellDateKey = formatDateKey(date.year, date.month, day);
                    const cellEvents = DUMMY_EVENTS.filter((e) => e.date === cellDateKey);
                    const hasEvents = cellEvents.length > 0;
                    const isSelected = selectedDate === cellDateKey;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`calendar-cell cell-clickable ${isToday(day) ? 'cell-today' : ''} ${hasEvents ? 'cell-has-events' : ''} ${isSelected ? 'cell-selected' : ''}`}
                        onClick={() => setSelectedDate(cellDateKey)}
                      >
                        <span className="cell-date-number">{day}</span>
                        {hasEvents && (
                          <div className="cell-events">
                            {cellEvents.slice(0, 2).map((event) => (
                              <span
                                key={event.id}
                                className={`event-pill event-pill-${event.type}`}
                                title={`${event.timeRange} · ${event.title}`}
                              >
                                <span className="event-pill-time">
                                  {event.time === 'All day' ? 'All day' : event.time}
                                </span>
                                <span className="event-pill-label">
                                  {event.title}
                                </span>
                              </span>
                            ))}
                            {cellEvents.length > 2 && (
                              <span className="event-more">+{cellEvents.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="calendar-legend">
                <span className="legend-today">Today</span>
                <span className="legend-item">
                  <span className="legend-dot legend-dot-meeting" /> Team meeting
                </span>
                <span className="legend-item">
                  <span className="legend-dot legend-dot-one-on-one" /> 1:1
                </span>
                <span className="legend-item">
                  <span className="legend-dot legend-dot-ooo" /> Out of office
                </span>
                <span className="legend-item">
                  <span className="legend-dot legend-dot-focus" /> Focus time
                </span>
              </div>
            </div>

            <div className="card day-detail-card">
              <h3 className="day-detail-title">
                {selectedDateObj
                  ? selectedDateObj.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Select a day'}
              </h3>
              {eventsForSelectedDate.length === 0 ? (
                <p className="day-detail-empty">
                  No team events on this day. Use it for focus work or schedule a 1:1 with a peer.
                </p>
              ) : (
                <ul className="day-detail-list">
                  {eventsForSelectedDate.map((event) => (
                    <li key={event.id} className="day-detail-item">
                      <span className={`day-detail-badge event-pill-${event.type}`}>
                        {EVENT_TYPE_LABELS[event.type] || 'Event'}
                      </span>
                      <span className="day-detail-text">
                        <span className="day-detail-time">
                          {event.timeRange || event.time}
                        </span>
                        <span className="day-detail-title-text">{event.title}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
        <style jsx>{`
          .peers-calendar-section { max-width: 960px; }
          .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
          .calendar-actions { margin-bottom: 1rem; }
          .back-link { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
          .calendar-hint { margin: 0.5rem 0 0; font-size: var(--text-sm); color: var(--color-text-muted); }
          .calendar-layout {
            display: flex;
            flex-direction: row;
            gap: 1rem;
            align-items: flex-start;
          }
          .calendar-card { padding: 1.25rem; flex: 2; min-width: 0; }
          .calendar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
          .calendar-nav {
            width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
            background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md);
            font-size: 1.25rem; color: var(--color-text); cursor: pointer;
          }
          .calendar-nav:hover { background: var(--color-border-light); }
          .calendar-title { margin: 0; font-size: 1.25rem; font-weight: 600; }
          .calendar-grid-wrapper {
            width: 100%;
            overflow-x: auto;
          }
          .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(40px, 1fr)); gap: 2px; min-width: 480px; }
          .calendar-day-header { padding: 0.5rem; font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); text-align: center; }
          .calendar-cell {
            min-height: 64px;
            padding: 0.35rem 0.5rem;
            font-size: var(--text-sm);
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            border-radius: var(--radius-sm);
            background: var(--color-surface-alt);
            border: 1px solid transparent;
          }
          .cell-clickable { cursor: pointer; }
          .cell-empty { background: transparent; }
          .cell-today { background: var(--color-accent-soft); color: var(--color-accent); font-weight: var(--font-semibold); }
          .cell-has-events { border-color: var(--color-border); background: #f8fafc; }
          .cell-selected { outline: 2px solid var(--color-accent); outline-offset: -2px; }
          .cell-date-number { font-size: var(--text-xs); font-weight: 600; margin-bottom: 0.2rem; }
          .cell-events { display: flex; flex-direction: column; gap: 0.15rem; width: 100%; }
          .event-pill {
            display: inline-block;
            padding: 0.1rem 0.4rem;
            border-radius: 999px;
            font-size: 0.65rem;
            font-weight: 500;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .event-pill-time { margin-right: 0.25rem; font-weight: 600; }
          .event-pill-label { opacity: 0.9; }
          .event-pill-meeting {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
          }
          .event-pill-one_on_one {
            background: #ecfdf5;
            color: #15803d;
            border: 1px solid #bbf7d0;
          }
          .event-pill-ooo {
            background: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
          }
          .event-pill-focus {
            background: #fefce8;
            color: #b45309;
            border: 1px solid #fde68a;
          }
          .event-more { font-size: 0.65rem; color: var(--color-text-muted); }
          .calendar-legend {
            margin-top: 1rem;
            font-size: var(--text-xs);
            color: var(--color-text-muted);
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
          }
          .legend-today { display: inline-block; padding: 0.2rem 0.5rem; background: var(--color-accent-soft); color: var(--color-accent); border-radius: var(--radius-sm); }
          .legend-item { display: inline-flex; align-items: center; gap: 0.25rem; }
          .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: var(--color-border);
          }
          .legend-dot-meeting { background: #1d4ed8; }
          .legend-dot-one-on-one { background: #16a34a; }
          .legend-dot-ooo { background: #b91c1c; }
          .legend-dot-focus { background: #b45309; }
          .day-detail-card { margin-top: 0; padding: 1rem 1.25rem; flex: 1; min-width: 0; }
          .day-detail-title { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; }
          .day-detail-empty { margin: 0; font-size: var(--text-sm); color: var(--color-text-muted); }
          .day-detail-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
          .day-detail-item { display: flex; align-items: center; gap: 0.5rem; }
          .day-detail-badge {
            font-size: 0.7rem;
            border-radius: 999px;
            padding: 0.1rem 0.5rem;
          }
          .day-detail-text { font-size: var(--text-sm); display: inline-flex; flex-wrap: wrap; gap: 0.25rem; align-items: center; }
          .day-detail-time { font-weight: 600; color: var(--color-text-secondary); }
          .day-detail-title-text { }

          @media (max-width: 768px) {
            .calendar-layout {
              flex-direction: column;
            }
            .calendar-card {
              padding: 1rem;
            }
            .calendar-grid {
              min-width: 100%;
            }
            .calendar-cell {
              min-height: 56px;
            }
            .day-detail-card {
              margin-top: 1rem;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/* ── design tokens (matching Figma) ── */
const T = {
  blue: '#2563eb',
  blueLight: '#3b82f6',
  bluePale: '#eff6ff',
  blueBorder: '#bfdbfe',
  green: '#059669',
  greenLight: '#10b981',
  greenPale: '#ecfdf5',
  greenBorder: '#a7f3d0',
  amber: '#d97706',
  amberLight: '#f59e0b',
  amberPale: '#fffbeb',
  amberBorder: '#fde68a',
  purple: '#7c3aed',
  purplePale: '#f5f3ff',
  red: '#dc2626',
  redPale: '#fef2f2',
  text: '#111827',
  textSec: '#4b5563',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  surface: '#ffffff',
  surfaceAlt: '#f9fafb',
  bg: '#f1f5f9',
  radius: 12,
  radiusSm: 8,
  shadow: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
  shadowMd: '0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -1px rgba(0,0,0,.04)',
};

/* ── helpers ── */
function shortMonth(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

/* ── SVG icon components ── */
function IconTrend({ up }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={up ? 'M3 12L8 5l5 7' : 'M3 4l5 7 5-7'} stroke={up ? T.green : T.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   Performance Score Trend — Interactive Line Chart
   ═══════════════════════════════════════════════════ */
function LineChart({ reviews }) {
  const wrapRef = useRef(null);
  const scrollRef = useRef(null);
  const [containerW, setContainerW] = useState(700);
  const [zoom, setZoom] = useState(1);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [hiddenLines, setHiddenLines] = useState({});
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, scrollX: 0, scrollY: 0 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  if (!reviews || reviews.length < 2) return null;
  const sorted = [...reviews].filter((r) => r.score != null)
    .sort((a, b) => new Date(a.review_date || a.created_at) - new Date(b.review_date || b.created_at));
  if (sorted.length < 2) return null;

  const PX = 48, PY = 28, PB = 36;
  const BASE_H = 300;
  const svgW = containerW * zoom, svgH = BASE_H * zoom;
  const chartW = svgW - PX * 2, chartH = svgH - PY - PB;

  const all = sorted.flatMap((r) => [r.score, r.score_technical, r.score_impact, r.score_leadership].filter((v) => v != null));
  const minY = Math.max(0, Math.floor((Math.min(...all) - 8) / 5) * 5);
  const maxY = Math.min(100, Math.ceil((Math.max(...all) + 5) / 5) * 5);
  const yRange = maxY - minY || 1;
  const n = sorted.length;
  const getX = (i) => PX + (i / (n - 1)) * chartW;
  const getY = (v) => PY + chartH - ((v - minY) / yRange) * chartH;

  const pts = sorted.map((r, i) => ({
    x: getX(i), y: getY(r.score), score: r.score,
    tech: r.score_technical, impact: r.score_impact, lead: r.score_leadership,
    label: shortMonth(r.review_date || r.created_at),
    fullDate: fmtDate(r.review_date || r.created_at), title: r.title,
  }));

  const dimLines = [
    { key: 'score_technical', field: 'tech', color: T.blueLight, label: 'Technical' },
    { key: 'score_impact', field: 'impact', color: T.greenLight, label: 'Impact' },
    { key: 'score_leadership', field: 'lead', color: T.amberLight, label: 'Leadership' },
  ];

  function buildPath(field) {
    const ps = pts.filter((p) => p[field] != null);
    if (ps.length < 2) return null;
    return ps.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${getY(p[field])}`).join(' ');
  }

  const overallPath = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const areaPath = overallPath + ` L${pts[n - 1].x},${PY + chartH} L${pts[0].x},${PY + chartH} Z`;

  const step = zoom >= 2.5 ? 2 : zoom >= 1.5 ? 5 : 10;
  const gridYs = []; for (let v = minY; v <= maxY; v += step) gridYs.push(v);

  function onWheel(e) {
    e.preventDefault();
    const el = scrollRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const fracX = (e.clientX - rect.left + el.scrollLeft) / (containerW * zoom);
    const fracY = (e.clientY - rect.top + el.scrollTop) / (BASE_H * zoom);
    const next = Math.max(1, Math.min(5, zoom + (e.deltaY < 0 ? 0.3 : -0.3)));
    setZoom(next);
    requestAnimationFrame(() => {
      el.scrollLeft = fracX * containerW * next - (e.clientX - rect.left);
      el.scrollTop = fracY * BASE_H * next - (e.clientY - rect.top);
    });
  }

  function onDown(e) {
    if (zoom <= 1) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, scrollX: scrollRef.current.scrollLeft, scrollY: scrollRef.current.scrollTop };
  }
  function onMove(e) { if (!dragging) return; const el = scrollRef.current; el.scrollLeft = dragRef.current.scrollX - (e.clientX - dragRef.current.startX); el.scrollTop = dragRef.current.scrollY - (e.clientY - dragRef.current.startY); }
  function onUp() { setDragging(false); }
  function toggle(key) { setHiddenLines((p) => ({ ...p, [key]: !p[key] })); }

  const hov = hoveredIdx != null ? pts[hoveredIdx] : null;
  const dotR = Math.max(3.5, 4.5 * Math.min(zoom, 2));
  const fs = Math.max(9.5, 10.5 * Math.min(zoom, 1.6));

  return (
    <div ref={wrapRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, minHeight: 20 }}>
        <span style={{ fontSize: '0.7rem', color: T.textMuted, letterSpacing: '0.01em' }}>
          Scroll to zoom{zoom > 1 ? ' · Drag to pan' : ''} · Hover for details
        </span>
        {zoom > 1 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: T.textSec, fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => { setZoom(1); const el = scrollRef.current; if (el) { el.scrollLeft = 0; el.scrollTop = 0; } }}
              style={{ fontSize: '0.7rem', color: T.blue, background: T.bluePale, border: `1px solid ${T.blueBorder}`, borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontWeight: 600 }}>
              Reset
            </button>
          </div>
        )}
      </div>

      <div ref={scrollRef} onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
        onMouseLeave={() => { onUp(); setHoveredIdx(null); }}
        style={{
          overflow: zoom > 1 ? 'auto' : 'hidden', borderRadius: T.radiusSm, border: `1px solid ${T.border}`,
          background: '#fafbfd', position: 'relative', maxHeight: 400,
          cursor: dragging ? 'grabbing' : zoom > 1 ? 'grab' : 'crosshair', userSelect: 'none',
        }}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
          {gridYs.map((v) => { const y = getY(v); return (
            <g key={v}>
              <line x1={PX} y1={y} x2={svgW - PX} y2={y} stroke={T.borderLight} strokeWidth="1" />
              <text x={PX - 8} y={y + 3.5} textAnchor="end" fill={T.textMuted} fontSize={fs} fontFamily="system-ui, -apple-system, sans-serif">{v}</text>
            </g>
          ); })}

          {!hiddenLines.overall && <path d={areaPath} fill="rgba(37,99,235,0.04)" />}

          {dimLines.map((l) => { if (hiddenLines[l.key]) return null; const d = buildPath(l.field);
            return d ? <path key={l.key} d={d} fill="none" stroke={l.color} strokeWidth={Math.max(1.5, 1.8 * Math.min(zoom, 1.5))} strokeDasharray="5,4" opacity="0.5" /> : null;
          })}

          {!hiddenLines.overall && <path d={overallPath} fill="none" stroke={T.blue} strokeWidth={Math.max(2, 2.5 * Math.min(zoom, 1.5))} strokeLinejoin="round" strokeLinecap="round" />}

          {pts.map((p, i) => (
            <rect key={`h${i}`} x={p.x - chartW / n / 2} y={PY} width={chartW / n} height={chartH}
              fill="transparent" style={{ cursor: 'pointer' }} onMouseEnter={() => { if (!dragging) setHoveredIdx(i); }} />
          ))}

          {hov && !dragging && <line x1={hov.x} y1={PY} x2={hov.x} y2={PY + chartH} stroke={T.border} strokeWidth="1" strokeDasharray="4,3" />}

          {!hiddenLines.overall && pts.map((p, i) => (
            <circle key={`d${i}`} cx={p.x} cy={p.y} r={hoveredIdx === i ? dotR + 2 : dotR}
              fill={T.surface} stroke={T.blue} strokeWidth={hoveredIdx === i ? 2.5 : 2} style={{ transition: 'r 0.12s' }} />
          ))}

          {hov && !dragging && dimLines.map((l) => {
            if (hiddenLines[l.key] || hov[l.field] == null) return null;
            return <circle key={l.key} cx={hov.x} cy={getY(hov[l.field])} r={dotR} fill={l.color} stroke={T.surface} strokeWidth="1.5" />;
          })}

          {!hiddenLines.overall && pts.map((p, i) => (
            <text key={`t${i}`} x={p.x} y={p.y - dotR - 7} textAnchor="middle" fill={T.text} fontSize={fs} fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">{p.score}</text>
          ))}

          {pts.map((p, i) => (
            <text key={`x${i}`} x={p.x} y={svgH - 10} textAnchor="middle" fill={T.textMuted} fontSize={fs} fontFamily="system-ui, -apple-system, sans-serif">{p.label}</text>
          ))}
        </svg>

        {hov && !dragging && (
          <div style={{
            position: 'absolute', top: Math.max(8, hov.y - 70),
            left: hov.x > svgW / 2 ? hov.x - 210 : hov.x + 16,
            width: 196, background: T.text, color: '#fff', borderRadius: 10,
            padding: '12px 16px', fontSize: '0.78rem', pointerEvents: 'none', zIndex: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.2)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 2, fontSize: '0.82rem' }}>{hov.title || hov.fullDate}</div>
            <div style={{ color: T.textMuted, marginBottom: 10, fontSize: '0.68rem' }}>{hov.fullDate}</div>
            <TipRow label="Overall" value={hov.score} color="#fff" bold />
            {hov.tech != null && <TipRow label="Technical" value={hov.tech} color="#93c5fd" />}
            {hov.impact != null && <TipRow label="Impact" value={hov.impact} color="#6ee7b7" />}
            {hov.lead != null && <TipRow label="Leadership" value={hov.lead} color="#fcd34d" />}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 10 }}>
        <LegendBtn color={T.blue} label="Overall" dashed={false} on={!hiddenLines.overall} onClick={() => toggle('overall')} />
        {dimLines.map((l) => <LegendBtn key={l.key} color={l.color} label={l.label} dashed on={!hiddenLines[l.key]} onClick={() => toggle(l.key)} />)}
      </div>
    </div>
  );
}

function TipRow({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: '0.76rem' }}>
      <span style={{ color }}>{label}</span><span style={{ fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function LegendBtn({ color, label, dashed, on, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 500,
      color: on ? T.textSec : '#d1d5db', background: 'none', border: 'none',
      cursor: 'pointer', padding: '3px 6px', borderRadius: 4,
      textDecoration: on ? 'none' : 'line-through', transition: 'all 0.15s',
    }}>
      <span style={{ width: 16, height: 0, borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${on ? color : '#d1d5db'}`, display: 'inline-block' }} />
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   Dimension Averages
   ═══════════════════════════════════════════════════ */
function DimensionBars({ reviews }) {
  const scored = reviews.filter((r) => r.score_technical != null || r.score_impact != null || r.score_leadership != null);
  if (scored.length === 0) return <p style={{ color: T.textMuted, fontSize: '0.85rem' }}>No dimension data yet.</p>;

  const avg = (key) => { const v = scored.map((r) => r[key]).filter((x) => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };

  const dims = [
    { label: 'Technical Excellence', value: avg('score_technical'), color: T.blue, bg: T.bluePale, border: T.blueBorder },
    { label: 'Impact & Delivery', value: avg('score_impact'), color: T.green, bg: T.greenPale, border: T.greenBorder },
    { label: 'Leadership & Influence', value: avg('score_leadership'), color: T.amber, bg: T.amberPale, border: T.amberBorder },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {dims.map((d) => d.value != null ? (
        <div key={d.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: T.text }}>{d.label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: d.color, background: d.bg, border: `1px solid ${d.border}`, borderRadius: 6, padding: '2px 8px' }}>{d.value}/100</span>
          </div>
          <div style={{ height: 8, background: T.borderLight, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${d.value}%`, background: d.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      ) : null)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Collaboration Donut
   ═══════════════════════════════════════════════════ */
function DonutChart({ events }) {
  const byType = events.reduce((acc, e) => { acc[e.event_type] = (acc[e.event_type] || 0) + 1; return acc; }, {});
  const types = [
    { key: 'mentorship', label: 'Mentorship', color: T.blue },
    { key: 'peer_support', label: 'Peer Support', color: T.greenLight },
    { key: 'knowledge', label: 'Knowledge', color: T.amberLight },
    { key: 'cross_dept', label: 'Cross Dept', color: T.purple },
  ];
  const total = events.length || 1;
  const R = 56, r = 38, cx = 72, cy = 72;

  if (events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
        <svg width="144" height="144" viewBox="0 0 144 144"><circle cx={cx} cy={cy} r={R} fill="none" stroke={T.borderLight} strokeWidth={R - r} /></svg>
        <p style={{ color: T.textMuted, fontSize: '0.82rem', marginTop: 8 }}>No events logged yet.</p>
        <Link href="/log-event" style={{ color: T.blue, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>+ Log your first event</Link>
      </div>
    );
  }

  let angle = -90;
  const arcs = types.filter((t) => byType[t.key] > 0).map((t) => {
    const pct = byType[t.key] / total; const s = angle; angle += pct * 360;
    return { ...t, count: byType[t.key], startAngle: s, sweep: pct * 360 };
  });

  function arcPath(sd, sw) {
    if (sw >= 360) sw = 359.99;
    const s = (Math.PI / 180) * sd, e = (Math.PI / 180) * (sd + sw);
    const x1 = cx + R * Math.cos(s), y1 = cy + R * Math.sin(s), x2 = cx + R * Math.cos(e), y2 = cy + R * Math.sin(e);
    const x3 = cx + r * Math.cos(e), y3 = cy + r * Math.sin(e), x4 = cx + r * Math.cos(s), y4 = cy + r * Math.sin(s);
    return `M${x1},${y1} A${R},${R} 0 ${sw > 180 ? 1 : 0} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${sw > 180 ? 1 : 0} 0 ${x4},${y4} Z`;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <svg width="144" height="144" viewBox="0 0 144 144">
        {arcs.map((a) => <path key={a.key} d={arcPath(a.startAngle, a.sweep)} fill={a.color} />)}
        <text x={cx} y={cy - 3} textAnchor="middle" fill={T.text} fontSize="20" fontWeight="700" fontFamily="system-ui">{events.length}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={T.textMuted} fontSize="8.5" fontWeight="600" letterSpacing="0.08em" fontFamily="system-ui">EVENTS</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {types.map((t) => (
          <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: T.textSec, minWidth: 85 }}>{t.label}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: T.text }}>{byType[t.key] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Activity Timeline
   ═══════════════════════════════════════════════════ */
function ActivityTimeline({ events }) {
  if (events.length === 0) return null;
  const sorted = [...events].sort((a, b) => new Date(b.event_date) - new Date(a.event_date)).slice(0, 6);
  const tc = { mentorship: T.blue, peer_support: T.greenLight, knowledge: T.amberLight, cross_dept: T.purple };
  const tl = { mentorship: 'Mentorship', peer_support: 'Peer Support', knowledge: 'Knowledge', cross_dept: 'Cross Dept' };
  const tbg = { mentorship: T.bluePale, peer_support: T.greenPale, knowledge: T.amberPale, cross_dept: T.purplePale };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {sorted.map((ev, i) => (
        <div key={ev.id || i} style={{ display: 'flex', gap: 16, paddingBottom: i < sorted.length - 1 ? 20 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0, paddingTop: 2 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: tc[ev.event_type] || T.textMuted, flexShrink: 0, border: `2px solid ${T.surface}`, boxShadow: `0 0 0 2px ${tc[ev.event_type] || T.textMuted}` }} />
            {i < sorted.length - 1 && <div style={{ width: 1.5, flex: 1, background: T.border, marginTop: 6 }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: i < sorted.length - 1 ? 4 : 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: tc[ev.event_type] || T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', background: tbg[ev.event_type] || T.surfaceAlt, padding: '2px 8px', borderRadius: 4 }}>
                {tl[ev.event_type] || ev.event_type}
              </span>
              <span style={{ fontSize: '0.72rem', color: T.textMuted }}>{fmtDate(ev.event_date)}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: T.text, lineHeight: 1.4 }}>{ev.title}</p>
            {ev.description && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: T.textSec, lineHeight: 1.45 }}>{ev.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════ */
export default function ImpactTrends() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('charts');

  useEffect(() => {
    (async () => {
      try {
        const [meRes, evRes, revRes] = await Promise.all([
          fetch(`${API_BASE}/api/me.php`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/collaboration-log.php`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/reviews.php`, { credentials: 'include' }),
        ]);
        if (!meRes.ok) { router.replace('/login'); return; }
        setUser((await meRes.json()).user);
        if (evRes.ok) setEvents((await evRes.json()).events || []);
        if (revRes.ok) { const j = await revRes.json(); setReviews(j.reviews || []); }
      } catch { router.replace('/login'); }
      finally { setLoading(false); }
    })();
  }, [router]);

  if (loading) {
    return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: T.bg }}><p style={{ color: T.textMuted }}>Loading…</p></div>;
  }
  if (!user) return null;

  const scored = reviews.filter((r) => r.score != null);
  const avgScore = scored.length ? Math.round(scored.reduce((a, r) => a + r.score, 0) / scored.length) : null;
  const latestScore = scored.length ? [...scored].sort((a, b) => new Date(b.review_date || b.created_at) - new Date(a.review_date || a.created_at))[0].score : null;
  const trend = (() => {
    if (scored.length < 2) return null;
    const s = [...scored].sort((a, b) => new Date(a.review_date || a.created_at) - new Date(b.review_date || b.created_at));
    return s[s.length - 1].score - s[s.length - 2].score;
  })();

  return (
    <>
      <Head><title>Impact Trends — Performance Platform</title></Head>
      <AppLayout user={user} activeNav="impact-trends"
        breadcrumb={<><Link href="/dashboard">My Work</Link> <span className="sep">›</span> Impact Trends</>}
        title="Impact Trends"
        subtitle="Track your performance scores, dimension breakdown, and collaboration trends over time"
      >
        {/* top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link href="/dashboard" style={{ fontSize: '0.82rem', color: T.blue, textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back to Dashboard
          </Link>
          <div style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: 3 }}>
            {['charts', 'timeline'].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer',
                background: view === v ? T.blue : 'transparent', color: view === v ? '#fff' : T.textMuted,
                transition: 'all 0.15s',
              }}>{v === 'charts' ? 'Charts' : 'Timeline'}</button>
            ))}
          </div>
        </div>

        {/* stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <StatCard icon="⭐" label="Latest Score" value={latestScore ?? '—'} sub="/100" color={T.blue} bg={T.bluePale} />
          <StatCard icon="📊" label="Avg Score" value={avgScore ?? '—'} sub="/100" color={T.green} bg={T.greenPale} />
          <StatCard icon={trend != null && trend >= 0 ? '↗' : '↘'} label="Trend"
            value={trend != null ? (trend >= 0 ? `+${trend}` : `${trend}`) : '—'}
            sub={trend != null ? (trend >= 0 ? 'vs previous' : 'vs previous') : ''}
            color={trend != null ? (trend >= 0 ? T.green : T.red) : T.textMuted}
            bg={trend != null ? (trend >= 0 ? T.greenPale : T.redPale) : T.surfaceAlt} />
          <StatCard icon="📝" label="Events Logged" value={events.length} sub="total" color={T.purple} bg={T.purplePale} />
        </div>

        {view === 'charts' ? (
          <>
            <Card title="Performance Score Trend" subtitle="Overall and dimension scores across review cycles">
              {scored.length >= 2
                ? <LineChart reviews={reviews} />
                : <EmptyState text="Need at least 2 reviews to display the trend chart." />}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
              <Card title="Dimension Averages" subtitle="Average scores across all reviews">
                <DimensionBars reviews={reviews} />
              </Card>
              <Card title="Collaboration Breakdown" subtitle="Events distributed by category">
                <DonutChart events={events} />
              </Card>
            </div>
          </>
        ) : (
          <Card title="Recent Activity" subtitle="Your latest collaboration events">
            {events.length > 0 ? <ActivityTimeline events={events} /> : (
              <EmptyState text="No collaboration events yet.">
                <Link href="/log-event" style={{ color: T.blue, fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>+ Log your first event</Link>
              </EmptyState>
            )}
          </Card>
        )}
      </AppLayout>
    </>
  );
}

/* ── Shared components ── */
function StatCard({ icon, label, value, sub, color, bg }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
      padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 4,
      boxShadow: T.shadow, transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.85rem', width: 22, height: 22, borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: '0.75rem', color: T.textMuted }}>{sub}</span>}
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius,
      padding: '1.25rem 1.5rem', boxShadow: T.shadow,
    }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: T.text, margin: '0 0 2px', lineHeight: 1.3 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '0.76rem', color: T.textMuted, margin: '0 0 1rem', lineHeight: 1.4 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function EmptyState({ text, children }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <p style={{ color: T.textMuted, fontSize: '0.85rem', margin: 0 }}>{text}</p>
      {children}
    </div>
  );
}

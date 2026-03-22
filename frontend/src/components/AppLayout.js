import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';

const iconProps = { strokeWidth: 2.25, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
const ICONS = {
  plus: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>),
  grid: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>),
  clock: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><circle cx="12" cy="12" r="9.5" /><polyline points="12 6 12 12 16 14" /></svg>),
  trend: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>),
  star: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>),
  users: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.5" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  user: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="3.5" /></svg>),
  gear: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>),
  search: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>),
  bell: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>),
  help: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><circle cx="12" cy="12" r="9.5" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>),
  chart: (<svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
  clipboard: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14l2 2 4-4" /></svg>),
  target: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="12" r="5.5" /><circle cx="12" cy="12" r="1.5" /></svg>),
  directory: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>),
  shield: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  chevronLeft: (<svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><polyline points="15 18 9 12 15 6" /></svg>),
  chevronRight: (<svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><polyline points="9 18 15 12 9 6" /></svg>),
  chevronDown: (<svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><polyline points="6 9 12 15 18 9" /></svg>),
  logOut: (<svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
  home: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>),
  menu: (<svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...iconProps}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>),
};

// Employee: track growth, log collaboration, view own reviews & trends
const WORKSPACE_ITEMS_EMPLOYEE = [
  { id: 'dashboard', label: 'Home', href: '/dashboard', iconKey: 'home' },
  { id: 'log-event', label: 'Log Event', href: '/log-event', iconKey: 'plus', highlight: true },
  { id: 'impact-trends', label: 'Impact Trends', href: '/impact-trends', iconKey: 'trend' },
  { id: 'reviews', label: 'My Reviews', href: '/reviews', iconKey: 'star' },
  { id: 'performance-history', label: 'Performance History', href: '/performance-history', iconKey: 'chart' },
];
const TEAM_ITEMS_EMPLOYEE = [
  { id: 'peers', label: 'Peers', href: '/peers', iconKey: 'users' },
];

// Manager: team overview, direct reports, write review, goals, directory
const WORKSPACE_ITEMS_MANAGER = [
  { id: 'dashboard', label: 'Home', href: '/dashboard', iconKey: 'home' },
  { id: 'log-event', label: 'Log Event', href: '/log-event', iconKey: 'plus', highlight: true },
  { id: 'direct-reports', label: 'Direct Reports', href: '/direct-reports', iconKey: 'users' },
  { id: 'write-review', label: 'Write Review', href: '/write-review', iconKey: 'clipboard' },
  { id: 'goals', label: 'Goal Management', href: '/goals', iconKey: 'target' },
  { id: 'directory', label: 'Company Directory', href: '/directory', iconKey: 'directory' },
];
const TEAM_ITEMS_MANAGER = [
  { id: 'peers', label: 'Peers', href: '/peers', iconKey: 'users' },
];

const WORKSPACE_ITEMS_ADMIN = [
  { id: 'dashboard', label: 'Home', href: '/dashboard', iconKey: 'home' },
  { id: 'admin', label: 'Admin', href: '/admin', iconKey: 'shield', highlight: true },
  { id: 'direct-reports', label: 'Direct Reports', href: '/direct-reports', iconKey: 'users' },
  { id: 'goals', label: 'Goal Management', href: '/goals', iconKey: 'target' },
  { id: 'directory', label: 'Company Directory', href: '/directory', iconKey: 'directory' },
];

function getNavItems(user) {
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  if (isAdmin) {
    return {
      workspace: WORKSPACE_ITEMS_ADMIN,
      team: TEAM_ITEMS_MANAGER,
      workspaceLabel: 'ADMIN',
      teamLabel: 'ACCOUNT',
    };
  }
  return {
    workspace: isManager ? WORKSPACE_ITEMS_MANAGER : WORKSPACE_ITEMS_EMPLOYEE,
    team: isManager ? TEAM_ITEMS_MANAGER : TEAM_ITEMS_EMPLOYEE,
    workspaceLabel: isManager ? 'TEAM MANAGEMENT' : 'MY WORK',
    teamLabel: isManager ? 'ACCOUNT' : 'PEOPLE',
  };
}

const API_BASE = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '') : '';

function formatNotificationTime(createdAt) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day(s) ago`;
  return d.toLocaleDateString();
}

export default function AppLayout({ user, activeNav, breadcrumb, title, subtitle, children, rightSidebar }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [hoveredNavLabel, setHoveredNavLabel] = useState(null);
  const [hoveredNavRect, setHoveredNavRect] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef(null);
  const helpRef = useRef(null);
  const profileRef = useRef(null);
  const displayName = user?.display_name || user?.email || '';
  const initials = displayName.slice(0, 2).toUpperCase();
  const nav = getNavItems(user);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/notifications.php`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((data) => {
        if (!cancelled) {
          setNotifications(data.notifications || []);
          const count = typeof data.unread_count === 'number' ? data.unread_count : (data.notifications || []).length;
          setUnreadCount(count);
        }
      })
      .catch(() => { if (!cancelled) { setNotifications([]); setUnreadCount(0); } });
    return () => { cancelled = true; };
  }, [user?.role]);

  useEffect(() => {
    if (!notificationsOpen || !user) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/notifications-seen.php`, { method: 'POST', credentials: 'include' })
      .then(() => (cancelled ? null : fetch(`${API_BASE}/api/notifications.php`, { credentials: 'include' })))
      .then((res) => (res && res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setNotifications(data.notifications || []);
          setUnreadCount(typeof data.unread_count === 'number' ? data.unread_count : 0);
        }
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [notificationsOpen, user]);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false);
      if (helpRef.current && !helpRef.current.contains(e.target)) setHelpOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const handleLogout = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${API_BASE}/api/logout.php`, { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    router.replace('/login');
  };

  const navLink = (item) => (
    <Link
      key={item.id}
      href={item.href}
      className={`nav-item ${activeNav === item.id ? 'active' : ''} ${item.highlight ? 'nav-item-highlight' : ''}`}
      /* INLINE FLEXBOX FIX APPLIED HERE */
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textDecoration: 'none',
        padding: sidebarCollapsed ? '0.75rem' : '0.625rem 0.875rem',
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
      }}
      onMouseEnter={(e) => {
        if (sidebarCollapsed) {
          setHoveredNavLabel(item.label);
          setHoveredNavRect(e.currentTarget.getBoundingClientRect());
        }
      }}
      onMouseLeave={() => {
        if (sidebarCollapsed) {
          setHoveredNavLabel(null);
          setHoveredNavRect(null);
        }
      }}
    >
      <span className="nav-icon-wrapper">
        {ICONS[item.iconKey]}
      </span>
      {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
    </Link>
  );

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top" style={{display:'flex',alignItems: sidebarCollapsed? 'center':'end',justifyContent:'space-between'}}>
          <Link href="/dashboard" className="sidebar-brand" aria-label="Go to dashboard" style={{ textDecoration: 'none' }}>
            <span className="brand-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
              <img src={`${router.basePath || ''}/Logo.png`} alt="Brand Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </span>
            {!sidebarCollapsed && <span className="brand-text">Performance Platform</span>}
          </Link>
          <button
            type="button"
            className="hamburger-btn"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {sidebarCollapsed?ICONS.chevronRight :ICONS.chevronLeft}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!sidebarCollapsed && <div className="nav-section-label">{nav.workspaceLabel}</div>}
            <div className="nav-links">
              {nav.workspace.map(navLink)}
            </div>
          </div>
          <div className="nav-section">
            {!sidebarCollapsed && <div className="nav-section-label">{nav.teamLabel}</div>}
            <div className="nav-links">
              {nav.team.map(navLink)}
            </div>
          </div>
        </nav>

      </aside>

      {sidebarCollapsed && hoveredNavLabel && hoveredNavRect && (
        <div
          className="sidebar-hover-tooltip"
          style={{
            left: hoveredNavRect.right + 10,
            top: hoveredNavRect.top + hoveredNavRect.height / 2 - 14,
          }}
          role="tooltip"
        >
          {hoveredNavLabel}
        </div>
      )}

      <div className="main-wrap">
        <header className="header">
          <div className="header-left">
            {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
            <form
              className="search-wrap"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const q = (searchQuery || '').trim();
                if (q) router.push('/search?q=' + encodeURIComponent(q));
              }}
            >
              <span className="search-icon" aria-hidden="true">{ICONS.search}</span>
              <input
                type="search"
                placeholder="Search..."
                className="search-input"
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          <div className="header-right">
            <div className="header-dropdown-wrap" ref={notifRef}>
              <button
                type="button"
                className={`icon-btn ${notificationsOpen ? 'active' : ''}`}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={(e) => { e.stopPropagation(); setNotificationsOpen(!notificationsOpen); setHelpOpen(false); setProfileOpen(false); }}
              >
                {ICONS.bell}
                {unreadCount > 0 && (
                  <span className="notification-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="header-dropdown notifications-dropdown">
                  <div className="dropdown-header">
                    <span>Notifications</span>
                  </div>
                  <div className="dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="dropdown-empty-hint">No new notifications.</div>
                    ) : (
                      notifications.map((n) => (
                        n.type === 'feedback_request' ? (
                          <Link
                            key={n.id}
                            href={n.team_id ? `/write-review?feedback_request_id=${n.feedback_request_id}&employee_id=${n.requested_by}&team_id=${n.team_id}` : `/write-review?feedback_request_id=${n.feedback_request_id}&employee_id=${n.requested_by}`}
                            className="notification-item unread"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <span className="notification-dot" />
                            <div>
                              <p className="notification-text">{n.requested_by_name} requested feedback.</p>
                              <span className="notification-time">{formatNotificationTime(n.created_at)}</span>
                              <span className="notification-action">Write review →</span>
                            </div>
                          </Link>
                        ) : n.type === 'review_ready' ? (
                          <Link
                            key={n.id}
                            href="/reviews"
                            className="notification-item unread"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <span className="notification-dot" />
                            <div>
                              <p className="notification-text">
                                Your performance review{n.manager_name ? ` from ${n.manager_name}` : ''} is ready to view.
                              </p>
                              <span className="notification-time">{formatNotificationTime(n.created_at)}</span>
                              <span className="notification-action">View review →</span>
                            </div>
                          </Link>
                        ) : (
                          <div key={n.id} className="notification-item">
                            <span className="notification-dot" />
                            <div>
                              <p className="notification-text">{n.message || 'Notification'}</p>
                              <span className="notification-time">{formatNotificationTime(n.created_at)}</span>
                            </div>
                          </div>
                        )
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="header-dropdown-wrap" ref={helpRef}>
              <button
                type="button"
                className={`icon-btn ${helpOpen ? 'active' : ''}`}
                aria-label="Help"
                aria-expanded={helpOpen}
                onClick={(e) => { e.stopPropagation(); setHelpOpen(!helpOpen); setNotificationsOpen(false); setProfileOpen(false); }}
              >
                {ICONS.help}
              </button>
              {helpOpen && (
                <div className="header-dropdown help-dropdown">
                  <div className="dropdown-header"><span>Help & support</span></div>
                  <div className="dropdown-body dropdown-body-help">
                    <Link href="/help" className="dropdown-item" onClick={() => setHelpOpen(false)}>
                      <span className="dropdown-item-text">Help</span>
                    </Link>
                    <Link href="/getting-started" className="dropdown-item" onClick={() => setHelpOpen(false)}>
                      <span className="dropdown-item-text">Getting started</span>
                    </Link>
                    <Link href="/faq" className="dropdown-item" onClick={() => setHelpOpen(false)}>
                      <span className="dropdown-item-text">FAQ</span>
                    </Link>
                    <Link href="/contact-support" className="dropdown-item" onClick={() => setHelpOpen(false)}>
                      <span className="dropdown-item-text">Contact support</span>
                    </Link>
                    <Link href="/contact-sales" className="dropdown-item" onClick={() => setHelpOpen(false)}>
                      <span className="dropdown-item-text">Contact sales</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="header-dropdown-wrap profile-dropdown-wrap" ref={profileRef}>
              <button
                type="button"
                className="profile-trigger"
                aria-label="Account menu"
                aria-expanded={profileOpen}
                onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); setNotificationsOpen(false); setHelpOpen(false); }}
              >
                <span className="avatar avatar-sm" aria-hidden="true">{initials}</span>
                <span className={`profile-trigger-chevron ${profileOpen ? 'open' : ''}`}>{ICONS.chevronDown}</span>
              </button>
              {profileOpen && (
                <div className="header-dropdown profile-dropdown">
                  <div className="dropdown-body profile-dropdown-body">
                    <div className="profile-dropdown-header">
                      <span className="avatar avatar-md" aria-hidden="true">{initials}</span>
                      <div className="profile-dropdown-info">
                        <span className="profile-dropdown-name">{displayName}</span>
                        <span className="profile-dropdown-role">{user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Employee'}</span>
                      </div>
                    </div>
                    <div className="profile-dropdown-divider" aria-hidden="true" />
                    <div className="profile-dropdown-links">
                      <Link href="/profile" className="profile-dropdown-btn" onClick={() => setProfileOpen(false)}>
                        Profile
                      </Link>
                      <Link href="/settings" className="profile-dropdown-btn" onClick={() => setProfileOpen(false)}>
                        Settings
                      </Link>
                    </div>
                    <div className="profile-dropdown-divider" aria-hidden="true" />
                    <div className="profile-dropdown-actions">
                      <button type="button" className="profile-dropdown-btn profile-dropdown-btn-danger" onClick={() => { setProfileOpen(false); handleLogout(); }}>
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`main ${rightSidebar ? 'main-with-sidebar' : ''}`}>
          <div className="main-content">
            {(title || subtitle) && (
              <div className="page-title-wrap">
                {title && <h1 className="page-title">{title}</h1>}
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
          {rightSidebar && <aside className="right-sidebar">{rightSidebar}</aside>}
        </main>
      </div>

      <style jsx>{`
        /* ALL CSS IS IDENTICAL EXCEPT FOR THIS FIX DOWN HERE */
        .layout { display: flex; min-height: 100vh; background: var(--color-surface-alt); }
        .sidebar { width: 260px; flex-shrink: 0; background: #fff; border-right: 1px solid var(--color-border); display: flex; flex-direction: column; padding: 0; transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; box-shadow: 4px 0 20px rgba(15, 23, 42, 0.06); }
        .sidebar:not(.collapsed)::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--color-accent); opacity: 0.85; }
        .sidebar.collapsed { width: 80px; background: #fff; box-shadow: 4px 0 24px rgba(15, 23, 42, 0.08); }
        .sidebar-top { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 0.75rem 1rem 1.25rem; border-bottom: 1px solid var(--color-border-light); min-height: 72px; flex-shrink: 0; }
        .sidebar.collapsed .sidebar-top { padding: 1rem 0.75rem; justify-content: center; flex-direction: column; gap: 0.5rem; min-height: auto; }
        .sidebar-brand { display: flex; align-items: center; gap: 1rem; min-height: 44px; transition: all 0.25s ease; text-decoration: none; color: inherit; flex: 1; min-width: 0; }
        .sidebar.collapsed .sidebar-brand { flex: none; justify-content: center; }
        .hamburger-btn { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 36px; height: 36px; padding: 0; border: 1px solid var(--color-border); border-radius: 8px; background: transparent; color: var(--color-text-muted); cursor: pointer; transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
        .hamburger-btn:hover { background: var(--color-accent-soft); color: var(--color-accent); border-color: var(--color-accent-muted); }
        .hamburger-btn :global(svg) { width: 18px; height: 18px; }
        .brand-icon { width: 42px; height: 42px; background: var(--color-accent); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25); transition: width 0.25s ease, height 0.25s ease; }
        .sidebar.collapsed .brand-icon { width: 44px; height: 44px; }
        .brand-icon :global(svg) { width: 22px; height: 22px; }
        .sidebar.collapsed .brand-icon :global(svg) { width: 24px; height: 24px; }
        .brand-text { font-weight: 700; font-size: 0.9375rem; color: var(--color-text); letter-spacing: -0.02em; line-height: 1.2; white-space: nowrap; transition: opacity 0.2s ease; }
        .sidebar.collapsed .brand-text { display: none; }
        .sidebar-nav { flex: 1; padding: 1.25rem 1rem; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; }
        .sidebar.collapsed .sidebar-nav { padding: 1.25rem 0.875rem; }
        .sidebar-hover-tooltip { position: fixed; transform: translateY(-50%); padding: 0.5rem 0.75rem; background: var(--color-text); color: #fff; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 1000; pointer-events: none; }
        .nav-section { margin-bottom: 1.5rem; display: flex; flex-direction: column; }
        .nav-section:last-of-type { margin-bottom: 0; }
        .nav-section-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-text-muted); padding: 0 0.5rem 0.5rem; margin-bottom: 0.25rem; white-space: nowrap; }
        .sidebar.collapsed .nav-section-label { display: none; }
        .nav-links { display: flex; flex-direction: column; gap: 4px; }
        .sidebar.collapsed .nav-links { gap: 8px; }
        
        /* Nav alignment CSS kept as backup, but inline styles will override */
        .nav-item { 
          display: flex; 
          align-items: center; 
          gap: 0.875rem; 
          padding: 0.625rem 0.875rem; 
          font-size: 0.875rem; 
          color: var(--color-text-secondary); 
          text-align: left; 
          width: 100%; 
          text-decoration: none; 
          border-radius: 10px; 
          transition: all 0.2s ease; 
          box-sizing: border-box; 
          position: relative; 
          font-weight: 500; 
        }
        .sidebar.collapsed .nav-item { justify-content: center; padding: 0.75rem; gap: 0; }
        .nav-item:hover { color: var(--color-text); background: var(--color-surface-alt); }
        .nav-item.active { background: var(--color-accent-soft); color: var(--color-accent); font-weight: 600; }
        .sidebar:not(.collapsed) .nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 22px; background: var(--color-accent); border-radius: 0 2px 2px 0; }
        .nav-item.active .nav-icon-wrapper { background: var(--color-accent); color: white; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25); }
        .nav-item-highlight:not(.active) { background: #fef9c3; color: #854d0e; font-weight: 600; }
        .nav-item-highlight:not(.active) .nav-icon-wrapper { background: #eab308; color: white; box-shadow: 0 2px 4px rgba(234, 179, 8, 0.2); }
        .nav-item-highlight:not(.active):hover { background: #fef08a; }
        .nav-icon-wrapper { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 36px; height: 36px; background: #f1f5f9; border-radius: 10px; color: var(--color-text-muted); transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
        .nav-icon-wrapper :global(svg) { width: 20px; height: 20px; display: block; vertical-align: middle; }
        .sidebar.collapsed .nav-icon-wrapper { width: 44px; height: 44px; }
        .sidebar.collapsed .nav-icon-wrapper :global(svg) { width: 24px; height: 24px; }
        .nav-item:hover .nav-icon-wrapper { background: var(--color-accent-muted); color: var(--color-accent); box-shadow: 0 2px 6px rgba(37, 99, 235, 0.12); }
        .nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; line-height: 1; display: inline-flex; align-items: center; }
        .sidebar.collapsed .nav-label { display: none; }
        
        .sidebar-user { display: flex; align-items: center; gap: 0.875rem; padding: 1.25rem 1rem; border-top: 1px solid var(--color-border-light); margin-top: auto; background: transparent; transition: all 0.25s ease; }
        .sidebar.collapsed .sidebar-user { justify-content: center; padding: 1rem 0.75rem; }
        .sidebar-user-info { display: flex; flex-direction: column; min-width: 0; }
        .sidebar.collapsed .sidebar-user-info { display: none; }
        .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--color-accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 600; flex-shrink: 0; }
        .sidebar.collapsed .avatar { width: 32px; height: 32px; font-size: 0.75rem; }
        .avatar-sm { width: 32px; height: 32px; font-size: 0.75rem; }
        .avatar-md { width: 40px; height: 40px; font-size: 0.875rem; }
        .sidebar-user-name { font-weight: 600; font-size: 0.875rem; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-user-role { font-size: 0.75rem; color: var(--color-text-muted); }
        .main-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 2.25rem; background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); gap: 1.5rem; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04); transition: all var(--transition-base); }
        .header-left { display: flex; align-items: center; gap: 1.5rem; flex: 1; min-width: 0; }
        .header .breadcrumb { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0; flex-shrink: 0; font-weight: 500; letter-spacing: -0.01em; }
        .header .breadcrumb .sep { margin: 0 0.5rem; opacity: 0.5; font-weight: 400; }
        .search-wrap { display: flex; align-items: center; background: var(--color-surface-alt); border: 1.5px solid transparent; border-radius: var(--radius-full); padding: 0.625rem 1.125rem; max-width: 360px; flex: 1; min-width: 0; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03); }
        .search-wrap:hover { background: #ffffff; border-color: var(--color-border); box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.04); }
        .search-wrap:focus-within { background: #ffffff; border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-soft), inset 0 1px 2px rgba(37, 99, 235, 0.08); transform: translateY(-0.5px); }
        .search-icon { display: flex; align-items: center; justify-content: center; margin-right: 0.625rem; flex-shrink: 0; color: var(--color-text-muted); transition: color var(--transition-fast); }
        .search-wrap:focus-within .search-icon { color: var(--color-accent); }
        .search-icon :global(svg) { width: 18px; height: 18px; }
        .search-input { border: none; background: none; font-size: 0.9rem; color: var(--color-text); flex: 1; min-width: 0; font-weight: 400; letter-spacing: -0.01em; }
        .search-input::placeholder { color: var(--color-text-muted); font-weight: 400; }
        .search-input:focus { outline: none; }
        .header-right { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }
        .header-dropdown-wrap { position: relative; }
        .icon-btn { background: none; border: none; padding: 0.5rem; cursor: pointer; border-radius: var(--radius-lg); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; position: relative; width: 40px; height: 40px; }
        .icon-btn :global(svg) { width: 20px; height: 20px; }
        .icon-btn:hover, .icon-btn.active { background: var(--color-accent-soft); color: var(--color-accent); }
        .notification-badge { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 2px solid #fff; }
        .header-dropdown { position: absolute; top: calc(100% + 8px); right: 0; min-width: 280px; background: #fff; border-radius: var(--radius-lg); box-shadow: 0 10px 40px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06); border: 1px solid var(--color-border); z-index: 200; overflow: hidden; animation: dropdownIn 0.2s ease; }
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .help-dropdown { min-width: 220px; }
        .profile-dropdown { min-width: 260px; right: 0; }
        .dropdown-header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light); }
        .dropdown-link-sm { background: none; border: none; font-size: 0.75rem; color: var(--color-accent); cursor: pointer; font-weight: 500; }
        .dropdown-body { display: flex; flex-direction: column; gap: 2px; padding: 0.5rem; max-height: 320px; overflow-y: auto; }
        .notification-item { display: flex; gap: 0.75rem; padding: 0.75rem; border-radius: var(--radius-md); font-size: var(--text-sm); }
        .notification-item.unread { background: var(--color-accent-soft); }
        .notifications-dropdown a.notification-item { text-decoration: none; color: inherit; }
        .notifications-dropdown a.notification-item:hover { background: var(--color-surface-alt); }
        .notification-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent); flex-shrink: 0; margin-top: 0.35rem; }
        .notification-item:not(.unread) .notification-dot { opacity: 0.3; }
        .notification-text { margin: 0 0 0.25rem; color: var(--color-text); }
        .notification-time { font-size: 0.7rem; color: var(--color-text-muted); }
        .notification-action { display: block; font-size: 0.75rem; color: var(--color-accent); margin-top: 0.25rem; }
        .dropdown-empty-hint { padding: 0.75rem; font-size: var(--text-sm); color: var(--color-text-muted); text-align: center; }
        .dropdown-item { display: flex; align-items: center; flex-direction: row; gap: 0.875rem; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem; color: var(--color-text); text-decoration: none; background: none; border: none; width: 100%; min-width: 0; cursor: pointer; text-align: left; font-family: inherit; transition: background 0.15s ease; box-sizing: border-box; }
        .dropdown-item:hover { background: var(--color-surface-alt); color: var(--color-accent); }
        .dropdown-item:hover .dropdown-item-icon { color: var(--color-accent); }
        .dropdown-item-danger:hover { color: #b91c1c; }
        .dropdown-item-danger:hover .dropdown-item-icon { color: #b91c1c; }
        .dropdown-item-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 20px; height: 20px; color: var(--color-text-muted); }
        .dropdown-item-icon :global(svg) { width: 20px; height: 20px; }
        .dropdown-item-text { flex: 1; min-width: 0; }
        .dropdown-item-danger { color: #dc2626; }
        .dropdown-item-danger .dropdown-item-icon { color: #dc2626; }
        .dropdown-divider { height: 1px; background: var(--color-border-light); margin: 0.5rem 0.75rem; }
        .profile-dropdown-body { padding: 0; gap: 0; max-height: none; }
        .profile-dropdown-header { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.25rem 1rem; }
        .profile-dropdown-info { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; }
        .profile-dropdown-name { display: block; font-weight: 600; font-size: 0.9375rem; color: var(--color-text); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .profile-dropdown-role { display: block; font-size: 0.75rem; font-weight: 500; color: var(--color-text-muted); text-transform: capitalize; letter-spacing: 0.02em; }
        .profile-dropdown-divider { height: 1px; background: var(--color-border-light); margin: 0 1rem; }
        .profile-dropdown-links { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.5rem 0.75rem; }
        .profile-dropdown-btn { display: block; width: 100%; padding: 0.625rem 0.75rem; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 500; color: var(--color-text); text-decoration: none; text-align: center; background: var(--color-surface-alt); border: 1px solid var(--color-border); cursor: pointer; font-family: inherit; transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; box-sizing: border-box; }
        .profile-dropdown-btn:hover { background: var(--color-accent-soft); border-color: var(--color-accent-muted); color: var(--color-accent); }
        .profile-dropdown-btn-danger { color: var(--color-text-secondary); background: #fff; border-color: var(--color-border); }
        .profile-dropdown-btn-danger:hover { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
        .profile-dropdown-actions { padding: 0.5rem 0.75rem 1rem; }
        .profile-trigger { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.5rem 0.25rem 0.25rem; background: none; border: 1px solid var(--color-border); border-radius: var(--radius-full); cursor: pointer; transition: all 0.2s ease; }
        .profile-trigger:hover { border-color: var(--color-accent-muted); background: var(--color-accent-soft); }
        .profile-trigger-chevron { display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); transition: transform 0.2s ease; }
        .profile-trigger-chevron :global(svg) { width: 16px; height: 16px; }
        .profile-trigger-chevron.open { transform: rotate(180deg); color: var(--color-accent); }
        .main { flex: 1; padding: 2rem 2.25rem; overflow-y: auto; }
        .main-with-sidebar { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items: start; }
        @media (max-width: 1100px) { .main-with-sidebar { grid-template-columns: 1fr; } }
        .main-content { min-width: 0; }
        .page-title-wrap { margin-bottom: 1.75rem; }
        .page-title { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text); margin: 0 0 0.25rem; letter-spacing: -0.02em; }
        .page-subtitle { font-size: var(--text-sm); color: var(--color-text-muted); margin: 0; line-height: var(--leading-normal); }
        .right-sidebar { display: flex; flex-direction: column; gap: 1rem; }
        @media (max-width: 768px) {
          .sidebar { width: 80px; }
          .sidebar.collapsed { width: 80px; }
          .sidebar-brand .brand-text, .nav-section-label, .nav-label { display: none; }
          .sidebar-brand { justify-content: center; padding: 1.25rem 1rem; }
          .nav-item { justify-content: center; padding: 0.75rem; }
          .header { padding: 0.875rem 1rem; gap: 1rem; }
          .header-left { gap: 1rem; }
          .search-wrap { max-width: 200px; padding: 0.5rem 0.875rem; }
          .header .breadcrumb { display: none; }
          .profile-trigger-chevron { display: none; }
          .icon-btn { width: 36px; height: 36px; padding: 0.5rem; }
          .icon-btn :global(svg) { width: 18px; height: 18px; }
        }
      `}</style>
    </div>
  );
}
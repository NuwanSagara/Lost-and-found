import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socket from '../socket';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace('/api', '');

/* ─── Design Tokens ────────────────────────────────────────────────── */
const C = {
  bg:       '#0D0D12',
  sidebar:  '#111118',
  card:     '#16161F',
  cardHover:'#1C1C27',
  border:   'rgba(255,255,255,0.07)',
  accent:   '#FF6B35',
  accentLo: 'rgba(255,107,53,0.12)',
  violet:   '#818CF8',
  violetLo: 'rgba(129,140,248,0.12)',
  green:    '#51CF66',
  greenLo:  'rgba(81,207,102,0.12)',
  red:      '#FF4D4D',
  redLo:    'rgba(255,77,77,0.12)',
  text:     '#F1F1F3',
  muted:    '#6B6B7A',
  muted2:   '#9090A0',
};

const NOTIFICATION_TYPES = {
  info: {
    label: 'Information',
    hint: 'General updates and announcements for all users.',
    color: C.violet,
    bg: C.violetLo,
  },
  warning: {
    label: 'Warning',
    hint: 'Important caution notices that need attention soon.',
    color: '#F59F00',
    bg: 'rgba(245,159,0,0.14)',
  },
  danger: {
    label: 'Emergency',
    hint: 'Urgent alerts that require immediate visibility.',
    color: C.red,
    bg: C.redLo,
  },
  success: {
    label: 'Success',
    hint: 'Resolved issues, recoveries, or positive system updates.',
    color: C.green,
    bg: C.greenLo,
  },
};

const FONTS = {
  body: "var(--font-body, 'Inter', 'DM Sans', sans-serif)",
  heading: "var(--font-body, 'Inter', 'DM Sans', sans-serif)",
  mono: "var(--font-mono, 'JetBrains Mono', monospace)",
};

const styles = {
  card: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: '20px 24px',
    transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
  },
  input: {
    border: `1px solid ${C.border}`,
    background: 'rgba(255,255,255,0.04)',
    color: C.text,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  badge: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 10px', borderRadius: 99,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
    color, background: bg,
  }),
  btn: (variant = 'ghost') => ({
    cursor: 'pointer', border: 'none', borderRadius: 10,
    padding: '9px 18px', fontSize: 13, fontWeight: 600,
    transition: 'all 0.15s',
    ...(variant === 'primary'
      ? { background: C.accent, color: '#fff' }
      : variant === 'danger'
      ? { background: C.redLo, color: C.red, border: `1px solid rgba(255,77,77,0.25)` }
      : { background: 'rgba(255,255,255,0.05)', color: C.text, border: `1px solid ${C.border}` }
    ),
  }),
};

/* ─── Helpers ───────────────────────────────────────────────────────── */
const rel = (v) => {
  if (!v) return 'just now';
  const d = Math.floor((Date.now() - new Date(v).getTime()) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};
const initials = (n = '') => {
  const p = n.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'AD';
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : `${p[0][0]}${p[1][0]}`.toUpperCase();
};
const validateNotification = (payload) => {
  const errors = {};
  const title = payload.title.trim();
  const message = payload.message.trim();

  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length < 5) {
    errors.title = 'Title must be at least 5 characters.';
  } else if (title.length > 120) {
    errors.title = 'Title must be 120 characters or less.';
  }

  if (!message) {
    errors.message = 'Message is required.';
  } else if (message.length < 12) {
    errors.message = 'Message must be at least 12 characters.';
  } else if (message.length > 500) {
    errors.message = 'Message must be 500 characters or less.';
  }

  if (!NOTIFICATION_TYPES[payload.type]) {
    errors.type = 'Please choose a valid notification type.';
  }

  return errors;
};
const getImageSrc = (item) => {
  const url = item?.image?.url;
  if (!url) return 'https://placehold.co/400x160/111/333?text=No+Image';
  if (url.startsWith('/uploads')) return `${API_ORIGIN}${url}`;
  return url;
};

/* ─── Sub-components ────────────────────────────────────────────────── */
const Avatar = ({ name, size = 36, color = C.accent, bg = C.accentLo }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: bg, color, display: 'grid', placeItems: 'center',
    fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
  }}>{initials(name)}</div>
);

const StatCard = ({ icon, title, value, sub, trend, trendUp, accentColor, accentBg }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...styles.card,
        background: hov ? C.cardHover : C.card,
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.35)` : 'none',
        transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: accentBg, display: 'grid', placeItems: 'center', fontSize: 20 }}>{icon}</div>
        {trend != null && (
          <span style={{ fontSize: 12, fontWeight: 600, color: trendUp ? C.green : C.red, background: trendUp ? C.greenLo : C.redLo, padding: '3px 8px', borderRadius: 99 }}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.text, fontFamily: FONTS.heading, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: C.muted2 }}>{title}</div>
      </div>
      {sub && <div style={{ fontSize: 12, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>{sub}</div>}
    </div>
  );
};

const SectionCard = ({ title, badge, action, children }) => (
  <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: FONTS.heading, letterSpacing: '-0.01em' }}>{title}</span>
        {badge}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const ActivityItem = ({ item }) => {
  const typeMap = {
    match_confirmed: { label: 'CONFIRMED', color: C.green, bg: C.greenLo },
    match_found:     { label: 'MATCH',     color: C.violet, bg: C.violetLo },
    item_reported:   { label: 'REPORT',    color: C.accent, bg: C.accentLo },
    default:         { label: 'EVENT',     color: C.muted2, bg: 'rgba(255,255,255,0.06)' },
  };
  const t = typeMap[item.type] || typeMap.default;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <Avatar name={item.actor?.name || '?'} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{rel(item.timestamp)}</div>
      </div>
      <span style={styles.badge(t.color, t.bg)}>{t.label}</span>
    </div>
  );
};

const CategoryBar = ({ category, count, max }) => {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.muted2 }}>{category}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{count}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.accent}, #FF8C55)`, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
};

/* ─── Admin Dashboard ───────────────────────────────────────────────── */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const section = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/admin/matches'))      return 'matches';
    if (p.startsWith('/admin/users'))        return 'users';
    if (p.startsWith('/admin/reports'))      return 'reports';
    if (p.startsWith('/admin/analytics'))    return 'analytics';
    if (p.startsWith('/admin/notifications'))return 'notifications';
    if (p.startsWith('/admin/logs'))         return 'logs';
    if (p.startsWith('/admin/settings'))     return 'settings';
    return 'overview';
  }, [location.pathname]);

  const [clock, setClock] = useState(new Date());
  const [stats, setStats] = useState({ totalItems: 0, openCases: 0, pendingMatches: 0, confirmedMatches: 0, totalUsers: 0, successRate: '0%', itemsThisWeek: 0, openOlderThanWeek: 0, pendingToday: 0, byCategory: [], lostCount: 0, foundCount: 0 });
  const [activity, setActivity]   = useState([]);
  const [matches, setMatches]     = useState([]);
  const [users, setUsers]         = useState([]);
  const [reports, setReports]     = useState([]);
  const [logs, setLogs]           = useState([]);
  const [settings, setSettings]   = useState({});
  const [notificationMsg, setNotificationMsg] = useState({ title: '', message: '', type: 'info' });
  const [notificationErrors, setNotificationErrors] = useState({});
  const [sendingNotification, setSendingNotification] = useState(false);
  const [matchStatus, setMatchStatus] = useState('pending');
  const [matchSort, setMatchSort]     = useState('highest');
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter]   = useState('all');
  const [page, setPage]               = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const [pages, setPages]             = useState(1);
  const [pendingBadge, setPendingBadge] = useState(0);
  const [notes, setNotes]             = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteToken, setDeleteToken] = useState('');

  const headers = useMemo(() => ({ Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' }), [user?.token]);

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search.trim()), 300); return () => clearTimeout(t); }, [search]);

  const loadOverview = async () => {
    const [a, b] = await Promise.all([
      fetch(`${API_BASE}/admin/stats`, { headers }),
      fetch(`${API_BASE}/admin/activity?limit=10`, { headers }),
    ]);
    const [sa, sb] = await Promise.all([a.json(), b.json()]);
    if (a.ok) { setStats(sa); setPendingBadge(sa.pendingMatches || 0); }
    if (b.ok) setActivity(sb.activity || []);
  };
  const loadMatches = async () => {
    const q = new URLSearchParams({ status: matchStatus === 'all' ? '' : matchStatus, sort: matchSort, page: '1', limit: '20' });
    const r = await fetch(`${API_BASE}/admin/matches?${q}`, { headers });
    const d = await r.json();
    if (r.ok) { setMatches(d.matches || []); setPendingBadge(d.pendingCount || 0); }
  };
  const loadUsers = async () => {
    const q = new URLSearchParams({ search: debouncedSearch, role: roleFilter, page: String(page), limit: '10' });
    const r = await fetch(`${API_BASE}/admin/users?${q}`, { headers });
    const d = await r.json();
    if (r.ok) { setUsers(d.users || []); setTotalCount(d.total || 0); setPages(d.pages || 1); }
  };
  const loadReports = async () => {
    const q = new URLSearchParams({ search: debouncedSearch, page: String(page), limit: '10' });
    const r = await fetch(`${API_BASE}/admin/reports?${q}`, { headers });
    const d = await r.json();
    if (r.ok) { setReports(d.reports || []); setTotalCount(d.total || 0); setPages(d.pages || 1); }
  };
  const loadLogs = async () => {
    const q = new URLSearchParams({ page: String(page), limit: '20' });
    const r = await fetch(`${API_BASE}/admin/logs?${q}`, { headers });
    const d = await r.json();
    if (r.ok) { setLogs(d.logs || []); setPages(d.pages || 1); }
  };
  const loadSettings = async () => {
    const r = await fetch(`${API_BASE}/admin/settings`, { headers });
    const d = await r.json();
    if (r.ok) setSettings(d.settings || {});
  };

  useEffect(() => { if (user?.token) loadOverview(); }, [user?.token]);
  useEffect(() => { if (user?.token && section === 'matches')  loadMatches(); }, [user?.token, section, matchStatus, matchSort]);
  useEffect(() => { if (user?.token && section === 'users')    loadUsers();   }, [user?.token, section, debouncedSearch, roleFilter, page]);
  useEffect(() => { if (user?.token && section === 'reports')  loadReports(); }, [user?.token, section, debouncedSearch, page]);
  useEffect(() => { if (user?.token && section === 'logs')     loadLogs();    }, [user?.token, section, page]);
  useEffect(() => { if (user?.token && section === 'settings') loadSettings(); }, [user?.token, section]);

  useEffect(() => {
    if (!user?._id) return;
    if (!socket.connected) socket.connect();
    socket.emit('join', user._id);
    socket.emit('joinAdmin');
    const onNewItem = ({ item }) => {
      setStats(p => ({ ...p, totalItems: p.totalItems + 1, openCases: p.openCases + 1 }));
      setActivity(p => [{ type: 'item_reported', actor: { name: item?.reportedBy?.name || 'Unknown' }, description: `${item?.reportedBy?.name || 'Someone'} reported a ${item?.type || ''} item`, timestamp: new Date().toISOString() }, ...p].slice(0, 10));
    };
    const onMatchFound = ({ count = 1 }) => { setStats(p => ({ ...p, pendingMatches: p.pendingMatches + count })); setPendingBadge(p => p + count); };
    const onMatchConfirmed = () => { setStats(p => ({ ...p, pendingMatches: Math.max(0, p.pendingMatches - 1), confirmedMatches: p.confirmedMatches + 1 })); setPendingBadge(p => Math.max(0, p - 1)); };
    socket.on('newItem', onNewItem);
    socket.on('matchFound', onMatchFound);
    socket.on('matchConfirmed', onMatchConfirmed);
    return () => { socket.off('newItem', onNewItem); socket.off('matchFound', onMatchFound); socket.off('matchConfirmed', onMatchConfirmed); };
  }, [user?._id]);

  const runMatchAction = async (id, action) => {
    const r = await fetch(`${API_BASE}/admin/matches/${id}/${action}`, { method: 'PATCH', headers, body: JSON.stringify({ adminNotes: notes[id] || '' }) });
    if (r.ok) { setMatches(p => p.filter(m => m._id !== id)); setPendingBadge(p => Math.max(0, p - 1)); }
  };
  const updateRole = async (id, role) => {
    const r = await fetch(`${API_BASE}/admin/users/${id}/role`, { method: 'PATCH', headers, body: JSON.stringify({ role }) });
    const d = await r.json();
    if (r.ok) setUsers(p => p.map(u => u._id === id ? { ...u, role: d.user.role } : u));
  };
  const toggleSuspend = async (id) => {
    const r = await fetch(`${API_BASE}/admin/users/${id}/suspend`, { method: 'PATCH', headers, body: JSON.stringify({ reason: 'Policy review' }) });
    const d = await r.json();
    if (r.ok) setUsers(p => p.map(u => u._id === id ? { ...u, status: d.user.status } : u));
  };
  const openUser = async (id) => {
    const r = await fetch(`${API_BASE}/admin/users/${id}`, { headers });
    const d = await r.json();
    if (r.ok) setSelectedUser(d);
  };
  const removeUser = async (id) => {
    const r = await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE', headers, body: JSON.stringify({ confirmationToken: deleteToken }) });
    if (r.ok) { setUsers(p => p.filter(u => u._id !== id)); setSelectedUser(null); setDeleteToken(''); }
  };
  const removeReport = async (id) => {
    if (!window.confirm('Permanently delete this report?')) return;
    const r = await fetch(`${API_BASE}/admin/reports/${id}`, { method: 'DELETE', headers });
    if (r.ok) { setReports(p => p.filter(x => x._id !== id)); setTotalCount(p => Math.max(0, p - 1)); }
  };
  const sendBroadcast = async (e) => {
    e.preventDefault();
    const payload = {
      title: notificationMsg.title.trim(),
      message: notificationMsg.message.trim(),
      type: notificationMsg.type,
    };
    const errors = validateNotification(payload);
    setNotificationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSendingNotification(true);
      const r = await fetch(`${API_BASE}/admin/notifications`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (r.ok) {
        alert('Broadcast sent!');
        setNotificationMsg({ title: '', message: '', type: 'info' });
        setNotificationErrors({});
      }
    } finally {
      setSendingNotification(false);
    }
  };
  const saveSettings = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API_BASE}/admin/settings`, { method: 'PUT', headers, body: JSON.stringify(settings) });
    if (r.ok) alert('Settings saved!');
  };

  const navItems = [
    { key: 'overview',       to: '/admin',                 icon: '📊', label: 'Overview' },
    { key: 'matches',        to: '/admin/matches',         icon: '🔍', label: 'Matches',       badge: pendingBadge },
    { key: 'users',          to: '/admin/users',           icon: '👥', label: 'Users' },
    { key: 'reports',        to: '/admin/reports',         icon: '📁', label: 'Reports' },
    { key: 'analytics',      to: '/admin/analytics',       icon: '📈', label: 'Analytics' },
    { key: 'notifications',  to: '/admin/notifications',   icon: '🔔', label: 'Notifications' },
    { key: 'logs',           to: '/admin/logs',            icon: '📋', label: 'Audit Logs' },
    { key: 'settings',       to: '/admin/settings',        icon: '⚙️', label: 'Settings' },
  ];

  const pageTitle = navItems.find(n => n.key === section)?.label || 'Overview';

  const kpiCards = [
    { icon: '📦', title: 'Total Lost Items', value: stats.lostCount, sub: `+${stats.itemsThisWeek} this week`, trend: `${stats.itemsThisWeek}`, trendUp: true, accentColor: C.red, accentBg: C.redLo },
    { icon: '✅', title: 'Total Found Items', value: stats.foundCount, sub: `${stats.totalItems} items total`, trend: null, accentColor: C.green, accentBg: C.greenLo },
    { icon: '🔗', title: 'Pending Matches', value: stats.pendingMatches, sub: `+${stats.pendingToday} today`, trend: `+${stats.pendingToday}`, trendUp: true, accentColor: C.violet, accentBg: C.violetLo },
    { icon: '🏆', title: 'Recovery Rate', value: stats.successRate, sub: `${stats.confirmedMatches} reunited`, trend: null, accentColor: C.accent, accentBg: C.accentLo },
  ];

  const categoryMax = Math.max(1, ...(stats.byCategory || []).map(c => c.count || 0));
  const notificationTypeMeta = NOTIFICATION_TYPES[notificationMsg.type] || NOTIFICATION_TYPES.info;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONTS.body, display: 'flex', lineHeight: 1.5 }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::placeholder { color: ${C.muted}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .nav-btn:hover { background: rgba(255,255,255,0.05) !important; color: ${C.text} !important; }
        .action-btn:hover { opacity: 0.85; transform: scale(0.98); }
        .table-row:hover { background: rgba(255,255,255,0.025) !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease both; }
        @media (max-width: 900px) {
          .admin-layout { flex-direction: column !important; }
          .admin-sidebar { position: static !important; width: 100% !important; height: auto !important; flex-direction: row !important; padding: 12px !important; overflow-x: auto; }
          .admin-main { padding: 20px 16px !important; }
          .kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .two-col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="admin-sidebar" style={{
        position: 'fixed', top: 0, left: 0, width: 220, height: '100vh',
        background: C.sidebar, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', padding: '20px 12px', zIndex: 100,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '4px 10px 20px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: FONTS.heading, letterSpacing: '-0.01em' }}>
            Campus<span style={{ color: C.accent }}>Found</span>
          </div>
          <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5, background: C.accentLo, color: C.accent, padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
            ADMIN
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {navItems.map(n => {
            const active = section === n.key;
            return (
              <button key={n.key} className="nav-btn" onClick={() => navigate(n.to)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', textAlign: 'left', border: 'none',
                  borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                  fontWeight: active ? 700 : 500, fontSize: 13,
                  background: active ? C.accentLo : 'transparent',
                  color: active ? C.accent : C.muted2,
                  borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 15 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge > 0 && (
                  <span style={{ background: C.accent, color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{n.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, marginBottom: 6 }}>
            <Avatar name={user?.name} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: C.muted }}>Administrator</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ width: '100%', border: 'none', background: 'transparent', color: C.red, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, fontSize: 12, textAlign: 'left', fontWeight: 600 }}>
            ← Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="admin-main" style={{ marginLeft: 220, flex: 1, padding: '32px 36px', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* Top header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: FONTS.heading, fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em' }}>{pageTitle}</h1>
            <div style={{ marginTop: 4, fontSize: 12, color: C.muted }}>{clock.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {clock.toLocaleTimeString()}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {pendingBadge > 0 && (
              <button onClick={() => navigate('/admin/matches')} style={{ ...styles.btn('ghost'), position: 'relative', padding: '8px 14px' }}>
                🔔
                <span style={{ position: 'absolute', top: -4, right: -4, background: C.accent, color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 700, width: 16, height: 16, display: 'grid', placeItems: 'center' }}>{pendingBadge}</span>
              </button>
            )}
            <Avatar name={user?.name} size={36} />
          </div>
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {section === 'overview' && <>
          {/* KPI Cards */}
          <div className="kpi-grid fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {kpiCards.map((k) => <StatCard key={k.title} {...k} />)}
          </div>

          {/* Activity + Categories row */}
          <div className="two-col fade-up" style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 16 }}>
            <SectionCard title="Recent Activity" badge={<span style={styles.badge(C.green, C.greenLo)}>● LIVE</span>}>
              {activity.length === 0
                ? <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted }}>No activity yet.</div>
                : activity.map((a, i) => <ActivityItem key={i} item={a} />)
              }
            </SectionCard>

            <SectionCard title="By Category">
              {(stats.byCategory || []).length === 0
                ? <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 13 }}>No data yet.</div>
                : (stats.byCategory || []).map(c => <CategoryBar key={c.category} category={c.category} count={c.count} max={categoryMax} />)
              }
            </SectionCard>
          </div>
        </>}

        {/* ── MATCHES ──────────────────────────────────────────────── */}
        {section === 'matches' && <div className="fade-up">
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'rejected'].map(s => (
              <button key={s} onClick={() => setMatchStatus(s)} style={{ ...styles.btn(matchStatus === s ? 'primary' : 'ghost'), padding: '7px 16px', fontSize: 12 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <select value={matchSort} onChange={e => setMatchSort(e.target.value)} style={{ ...styles.input, width: 'auto' }}>
                <option value="highest">Highest Score</option>
                <option value="recent">Most Recent</option>
              </select>
              {pendingBadge > 0 && <span style={styles.badge(C.accent, C.accentLo)}>{pendingBadge} Pending</span>}
            </div>
          </div>

          {matches.length === 0
            ? <div style={{ ...styles.card, textAlign: 'center', padding: '60px 24px', color: C.muted }}>🎉 No {matchStatus !== 'all' ? matchStatus : ''} matches found.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {matches.map(m => (
                  <div key={m._id} style={{ ...styles.card, borderColor: m.status === 'confirmed' ? 'rgba(81,207,102,0.25)' : m.status === 'rejected' ? 'rgba(255,77,77,0.2)' : C.border }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>🔗 {m.label || 'Match'}</div>
                      <span style={styles.badge(C.accent, C.accentLo)}>{Math.round(m.scores?.final || 0)}% match</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      {[m.lostItem, m.foundItem].map((it, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                          <img src={getImageSrc(it)} alt={it?.title || 'Match item'} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                          <div style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{it?.title || 'Unknown'}</div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📍 {it?.location?.name || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <textarea value={notes[m._id] || ''} onChange={e => setNotes(p => ({ ...p, [m._id]: e.target.value }))} placeholder="Admin notes..." rows={2}
                      style={{ ...styles.input, resize: 'vertical', marginBottom: 10 }} />
                    {m.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="action-btn" onClick={() => runMatchAction(m._id, 'confirm')} style={{ ...styles.btn('ghost'), background: C.greenLo, color: C.green, border: `1px solid rgba(81,207,102,0.2)`, transition: 'all 0.15s' }}>✓ Confirm Match</button>
                        <button className="action-btn" onClick={() => runMatchAction(m._id, 'reject')} style={styles.btn('danger')}>✗ Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
          }
        </div>}

        {/* ── USERS ────────────────────────────────────────────────── */}
        {section === 'users' && <div className="fade-up">
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." style={{ ...styles.input, maxWidth: 280 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'user', 'admin'].map(r => (
                <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }} style={{ ...styles.btn(roleFilter === r ? 'primary' : 'ghost'), padding: '7px 14px', fontSize: 12, textTransform: 'capitalize' }}>{r === 'all' ? 'All Roles' : r}</button>
              ))}
            </div>
            <span style={{ ...styles.badge(C.muted2, 'rgba(255,255,255,0.05)'), marginLeft: 'auto', padding: '6px 12px' }}>{totalCount} Users</span>
          </div>

          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}` }}>
                  {['User', 'Role', 'Status', 'Items', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="table-row" style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={u.name} size={32} color={u.role === 'admin' ? C.violet : C.accent} bg={u.role === 'admin' ? C.violetLo : C.accentLo} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={styles.badge(u.role === 'admin' ? C.violet : C.accent, u.role === 'admin' ? C.violetLo : C.accentLo)}>
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.status === 'suspended' ? C.red : C.green }} />
                        {u.status === 'suspended' ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: u.itemsReported > 0 ? C.accent : C.muted }}>{u.itemsReported || 0}</td>
                    <td style={{ padding: '12px 16px', color: C.muted, fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openUser(u._id)} style={{ ...styles.btn('ghost'), padding: '6px 10px', fontSize: 12 }}>View</button>
                        <select defaultValue={u.role} onChange={e => updateRole(u._id, e.target.value)} style={{ ...styles.input, width: 'auto', padding: '6px 8px', fontSize: 12 }}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => toggleSuspend(u._id)} style={{ ...styles.btn(u.status === 'suspended' ? 'ghost' : 'danger'), padding: '6px 10px', fontSize: 12 }}>
                          {u.status === 'suspended' ? 'Restore' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Showing {Math.min((page - 1) * 10 + 1, totalCount)}–{Math.min(page * 10, totalCount)} of {totalCount}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ ...styles.btn('ghost'), padding: '6px 12px', fontSize: 12 }}>← Prev</button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} style={{ ...styles.btn(page === n ? 'primary' : 'ghost'), padding: '6px 10px', fontSize: 12, minWidth: 32 }}>{n}</button>
              ))}
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} style={{ ...styles.btn('ghost'), padding: '6px 12px', fontSize: 12 }}>Next →</button>
            </div>
          </div>
        </div>}

        {/* ── REPORTS ──────────────────────────────────────────────── */}
        {section === 'reports' && <div className="fade-up">
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search reports..." style={{ ...styles.input, maxWidth: 300 }} />
            <span style={{ ...styles.badge(C.muted2, 'rgba(255,255,255,0.05)'), marginLeft: 'auto', padding: '6px 12px' }}>{totalCount} Reports</span>
          </div>
          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}` }}>
                  {['Title', 'Type', 'Category', 'Status', 'By', 'Date', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id} className="table-row" style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.title}</td>
                    <td style={{ padding: '12px 16px' }}><span style={styles.badge(r.type === 'lost' ? C.red : C.green, r.type === 'lost' ? C.redLo : C.greenLo)}>{r.type?.toUpperCase()}</span></td>
                    <td style={{ padding: '12px 16px', color: C.muted2 }}>{r.category}</td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: C.muted2 }}>{r.status}</td>
                    <td style={{ padding: '12px 16px', color: C.muted2 }}>{r.reportedBy?.name || 'Unknown'}</td>
                    <td style={{ padding: '12px 16px', color: C.muted, fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}><button onClick={() => removeReport(r._id)} style={styles.btn('danger')}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}

        {/* ── ANALYTICS ────────────────────────────────────────────── */}
        {section === 'analytics' && <div className="fade-up">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {kpiCards.map(k => <StatCard key={k.title} {...k} />)}
          </div>
          <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <SectionCard title="Category Breakdown">
              {(stats.byCategory || []).map(c => <CategoryBar key={c.category} category={c.category} count={c.count} max={categoryMax} />)}
            </SectionCard>
            <SectionCard title="Recovery Rate">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
                <div style={{ position: 'relative', width: 180, height: 180, borderRadius: '50%', background: `conic-gradient(${C.green} ${parseFloat(stats.successRate) || 0}%, rgba(255,255,255,0.05) 0)` }}>
                  <div style={{ position: 'absolute', inset: 16, background: C.card, borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                    <div style={{ fontFamily: FONTS.heading, fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>{stats.successRate}</div>
                  </div>
                </div>
                <div style={{ marginTop: 20, fontSize: 13, color: C.muted, textAlign: 'center' }}>
                  {stats.confirmedMatches} successful reunions from {(stats.openCases || 0) + (stats.confirmedMatches || 0)} total cases
                </div>
              </div>
            </SectionCard>
          </div>
        </div>}

        {/* ── NOTIFICATIONS ────────────────────────────────────────── */}
        {section === 'notifications' && <div className="fade-up" style={{ maxWidth: 600 }}>
          <SectionCard title="Broadcast Announcement">
            <form onSubmit={sendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: sendingNotification ? 0.92 : 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted2, marginBottom: 6 }}>TITLE</label>
                <input
                  required
                  maxLength={120}
                  value={notificationMsg.title}
                  onChange={e => {
                    const value = e.target.value;
                    setNotificationMsg(p => ({ ...p, title: value }));
                    setNotificationErrors(p => ({ ...p, title: undefined }));
                  }}
                  placeholder="Campus Alert: Library Closure"
                  style={{ ...styles.input, borderColor: notificationErrors.title ? 'rgba(255,77,77,0.45)' : C.border }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, gap: 12 }}>
                  <span style={{ fontSize: 11, color: notificationErrors.title ? C.red : C.muted }}>
                    {notificationErrors.title || 'Keep the title short and easy to scan.'}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>{notificationMsg.title.trim().length}/120</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted2, marginBottom: 6 }}>MESSAGE</label>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={notificationMsg.message}
                  onChange={e => {
                    const value = e.target.value;
                    setNotificationMsg(p => ({ ...p, message: value }));
                    setNotificationErrors(p => ({ ...p, message: undefined }));
                  }}
                  placeholder="Details of this announcement..."
                  style={{ ...styles.input, resize: 'vertical', borderColor: notificationErrors.message ? 'rgba(255,77,77,0.45)' : C.border }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, gap: 12 }}>
                  <span style={{ fontSize: 11, color: notificationErrors.message ? C.red : C.muted }}>
                    {notificationErrors.message || 'Include enough detail so users understand what action to take.'}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>{notificationMsg.message.trim().length}/500</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted2, marginBottom: 6 }}>TYPE</label>
                <select
                  value={notificationMsg.type}
                  onChange={e => {
                    const value = e.target.value;
                    setNotificationMsg(p => ({ ...p, type: value }));
                    setNotificationErrors(p => ({ ...p, type: undefined }));
                  }}
                  style={{
                    ...styles.input,
                    appearance: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                    borderColor: notificationErrors.type ? 'rgba(255,77,77,0.45)' : 'rgba(255,255,255,0.16)',
                  }}
                >
                  <option value="info">ℹ️ Information</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="danger">🚨 Emergency</option>
                  <option value="success">✅ Success</option>
                </select>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {Object.entries(NOTIFICATION_TYPES).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setNotificationMsg(p => ({ ...p, type: key }));
                        setNotificationErrors(p => ({ ...p, type: undefined }));
                      }}
                      style={{
                        ...styles.btn(notificationMsg.type === key ? 'primary' : 'ghost'),
                        padding: '7px 12px',
                        fontSize: 12,
                        background: notificationMsg.type === key ? meta.bg : 'rgba(255,255,255,0.04)',
                        color: notificationMsg.type === key ? meta.color : C.text,
                        border: `1px solid ${notificationMsg.type === key ? meta.color : C.border}`,
                      }}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 12, border: `1px solid ${notificationTypeMeta.bg}`, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={styles.badge(notificationTypeMeta.color, notificationTypeMeta.bg)}>{notificationTypeMeta.label}</span>
                    <span style={{ fontSize: 12, color: C.muted2 }}>Selected notification style</span>
                  </div>
                  <div style={{ fontSize: 12, color: notificationErrors.type ? C.red : C.muted }}>
                    {notificationErrors.type || notificationTypeMeta.hint}
                  </div>
                </div>
              </div>
              <button type="submit" style={{ ...styles.btn('primary'), padding: '12px', fontSize: 14 }}>🔔 Send Broadcast</button>
            </form>
          </SectionCard>
        </div>}

        {/* ── AUDIT LOGS ───────────────────────────────────────────── */}
        {section === 'logs' && <div className="fade-up">
          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}` }}>
                  {['Timestamp', 'Action', 'Performed By', 'Target', 'Metadata'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0
                  ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No audit logs yet.</td></tr>
                  : logs.map(l => (
                    <tr key={l._id} className="table-row" style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: 'background 0.1s' }}>
                      <td style={{ padding: '12px 16px', color: C.muted, fontSize: 12, fontFamily: FONTS.mono }}>{new Date(l.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}><span style={styles.badge(C.accent, C.accentLo)}>{l.action}</span></td>
                      <td style={{ padding: '12px 16px' }}>{l.performedBy?.name || 'System'}</td>
                      <td style={{ padding: '12px 16px', color: C.muted2 }}>{l.targetUser?.name || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: FONTS.mono, color: C.muted, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{JSON.stringify(l.metadata || {})}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>}

        {/* ── SETTINGS ─────────────────────────────────────────────── */}
        {section === 'settings' && <div className="fade-up" style={{ maxWidth: 560 }}>
          <SectionCard title="System Parameters">
            <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { key: 'enableNotifications', label: 'Real-time Notifications', desc: 'Allow Socket.IO to push live updates to active clients.' },
                { key: 'enableLostReporting', label: 'Accept Lost Reports', desc: 'Users can submit new lost item reports.' },
                { key: 'enableFoundReporting', label: 'Accept Found Reports', desc: 'Users can submit found item reports.' },
              ].map((opt, i) => (
                <label key={opt.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  <input type="checkbox" checked={settings[opt.key] !== false} onChange={e => setSettings(p => ({ ...p, [opt.key]: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: C.accent, cursor: 'pointer', flexShrink: 0 }} />
                </label>
              ))}
              <div style={{ padding: '16px 0' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.muted2, marginBottom: 8 }}>ITEM EXPIRY (DAYS)</label>
                <input type="number" min="1" max="365" value={settings.expiryDays || 30}
                  onChange={e => setSettings(p => ({ ...p, expiryDays: Number(e.target.value) }))}
                  style={{ ...styles.input, width: 120 }} />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Days before an unclaimed item is marked expired.</div>
              </div>
              <button type="submit" style={{ ...styles.btn('primary'), marginTop: 8, padding: '12px', fontSize: 14 }}>Save Changes</button>
            </form>
          </SectionCard>
        </div>}
      </main>

      {/* ── User Detail Modal ─────────────────────────────────────────── */}
      {selectedUser && (
        <div onClick={() => setSelectedUser(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 200, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, position: 'relative' }}>
            <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <Avatar name={selectedUser.user?.name} size={52} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, fontFamily: FONTS.heading, letterSpacing: '-0.01em' }}>{selectedUser.user?.name}</div>
                <div style={{ color: C.muted, fontSize: 13 }}>{selectedUser.user?.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[{ k: 'Reports', v: selectedUser.summary?.itemsReported }, { k: 'Matches', v: selectedUser.summary?.matchesFound }, { k: 'Claims', v: selectedUser.summary?.itemsClaimed }].map(x => (
                <div key={x.k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONTS.heading, letterSpacing: '-0.02em' }}>{x.v ?? 0}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{x.k}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: C.muted2, marginBottom: 6 }}>Type "DELETE" to confirm account removal</label>
              <input value={deleteToken} onChange={e => setDeleteToken(e.target.value)} placeholder='DELETE' style={styles.input} />
              <button onClick={() => removeUser(selectedUser.user?._id)} disabled={deleteToken !== 'DELETE'}
                style={{ ...styles.btn('danger'), marginTop: 10, width: '100%', opacity: deleteToken === 'DELETE' ? 1 : 0.4 }}>
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

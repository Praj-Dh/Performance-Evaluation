import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'teams', label: 'Teams' },
  { id: 'team_members', label: 'Team Members' },
];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editTeam, setEditTeam] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [formTeam, setFormTeam] = useState({ name: '', department: '', manager_id: '' });
  const [formMember, setFormMember] = useState({ user_id: '', team_id: '', name: '', role: '', department: '', email: '' });

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch(`${API_BASE}/api/me.php`, { credentials: 'include' });
        if (!meRes.ok) {
          router.replace('/admin/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        if (meData.user?.role !== 'admin') {
          router.replace('/dashboard');
          return;
        }
      } catch {
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users.php`, { credentials: 'include' });
      if (res.ok) setUsers((await res.json()).users || []);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    }
  };
  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/teams.php`, { credentials: 'include' });
      if (res.ok) setTeams((await res.json()).teams || []);
    } catch (e) {
      setError(e.message || 'Failed to load teams');
    }
  };
  const fetchTeamMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/team_members.php`, { credentials: 'include' });
      if (res.ok) setTeamMembers((await res.json()).team_members || []);
    } catch (e) {
      setError(e.message || 'Failed to load team members');
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'teams') fetchTeams();
    if (activeTab === 'team_members') fetchTeamMembers();
  }, [user, activeTab]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchUsers();
    fetchTeams();
  }, [user]);

  const api = (path, opts = {}) =>
    fetch(`${API_BASE}${path}`, { credentials: 'include', ...opts }).then((r) => r.json().catch(() => ({})));

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setError('');
    const data = await api('/api/admin/users.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editUser.id, role: editUser.role, display_name: editUser.display_name }) });
    if (data.error) { setError(data.error); return; }
    setEditUser(null);
    fetchUsers();
  };

  const handleVerifyUser = async (u) => {
    setError('');
    const data = await api('/api/admin/users.php', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id, email_verified: true }) });
    if (data.error) { setError(data.error); return; }
    fetchUsers();
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');
    const data = await api('/api/admin/teams.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formTeam.name, department: formTeam.department || null, manager_id: formTeam.manager_id ? parseInt(formTeam.manager_id, 10) : null }) });
    if (data.error) { setError(data.error); return; }
    setFormTeam({ name: '', department: '', manager_id: '' });
    fetchTeams();
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!editTeam) return;
    setError('');
    const data = await api('/api/admin/teams.php', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editTeam.id, name: editTeam.name, department: editTeam.department || null, manager_id: editTeam.manager_id ? parseInt(editTeam.manager_id, 10) : null }) });
    if (data.error) { setError(data.error); return; }
    setEditTeam(null);
    fetchTeams();
  };

  const handleDeleteTeam = async (team) => {
    if (!confirm(`Delete team "${team.name}"?`)) return;
    setError('');
    const data = await api(`/api/admin/teams.php?id=${team.id}`, { method: 'DELETE' });
    if (data.error) { setError(data.error); return; }
    setEditTeam(null);
    fetchTeams();
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setError('');
    const data = await api('/api/admin/team_members.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: formMember.user_id ? parseInt(formMember.user_id, 10) : null, team_id: parseInt(formMember.team_id, 10), name: formMember.name, role: formMember.role || null, department: formMember.department || null, email: formMember.email || null }) });
    if (data.error) { setError(data.error); return; }
    setFormMember({ user_id: '', team_id: '', name: '', role: '', department: '', email: '' });
    fetchTeamMembers();
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!editMember) return;
    setError('');
    const data = await api('/api/admin/team_members.php', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editMember.id, team_id: editMember.team_id, name: editMember.name, role: editMember.role || null, department: editMember.department || null, email: editMember.email || null }) });
    if (data.error) { setError(data.error); return; }
    setEditMember(null);
    fetchTeamMembers();
  };

  const handleDeleteMember = async (member) => {
    if (!confirm(`Remove "${member.name}"?`)) return;
    setError('');
    const data = await api(`/api/admin/team_members.php?id=${member.id}`, { method: 'DELETE' });
    if (data.error) { setError(data.error); return; }
    setEditMember(null);
    fetchTeamMembers();
  };

  if (loading || !user) {
    return (
      <div className="admin-wrap">
        <p>Loading…</p>
      </div>
    );
  }

  const managerUsers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  return (
    <>
      <Head>
        <title>Team Management — Admin</title>
      </Head>
      <div className="admin-wrap">
        <header className="admin-header">
          <div className="admin-header-title">
            <Link href="/dashboard" className="admin-brand" aria-label="Go to dashboard">Performance Platform</Link>
            <h1>Team Management</h1>
          </div>
          <button type="button" className="admin-logout" onClick={async () => {
            try {
              await fetch(`${API_BASE}/api/logout.php`, { method: 'POST', credentials: 'include' });
            } catch {
              // ignore
            }
            router.replace('/admin/login');
          }}>
            Log out
          </button>
        </header>

        {error && (
          <div className="admin-error">
            {error}
            <button type="button" onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="admin-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => { setActiveTab(tab.id); setError(''); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div className="admin-block">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Team</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.display_name || '—'}</td>
                    <td>{u.role}</td>
                    <td>{u.email_verified_at ? 'Yes' : <button type="button" onClick={() => handleVerifyUser(u)}>Verify</button>}</td>
                    <td>{u.team_name || '—'}</td>
                    <td><button type="button" onClick={() => setEditUser({ ...u })}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editUser && (
              <form className="admin-form" onSubmit={handleUpdateUser}>
                <h4>Edit user</h4>
                <label>Name <input type="text" value={editUser.display_name || ''} onChange={(e) => setEditUser({ ...editUser, display_name: e.target.value })} /></label>
                <label>Role
                  <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}>
                    <option value="employee">employee</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <div className="admin-form-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditUser(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="admin-block">
            <form className="admin-form inline" onSubmit={handleCreateTeam}>
              <input type="text" placeholder="Team name" value={formTeam.name} onChange={(e) => setFormTeam({ ...formTeam, name: e.target.value })} required />
              <input type="text" placeholder="Department" value={formTeam.department} onChange={(e) => setFormTeam({ ...formTeam, department: e.target.value })} />
              <select value={formTeam.manager_id} onChange={(e) => setFormTeam({ ...formTeam, manager_id: e.target.value })}>
                <option value="">Manager (optional)</option>
                {managerUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name || u.email}</option>)}
              </select>
              <button type="submit">Add team</button>
            </form>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Manager</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.department || '—'}</td>
                    <td>{t.manager_name || '—'}</td>
                    <td>
                      <button type="button" onClick={() => setEditTeam({ ...t, manager_id: t.manager_id || '' })}>Edit</button>
                      <button type="button" className="danger" onClick={() => handleDeleteTeam(t)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editTeam && (
              <form className="admin-form" onSubmit={handleUpdateTeam}>
                <h4>Edit team</h4>
                <label>Name <input type="text" value={editTeam.name} onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })} required /></label>
                <label>Department <input type="text" value={editTeam.department || ''} onChange={(e) => setEditTeam({ ...editTeam, department: e.target.value })} /></label>
                <label>Manager
                  <select value={editTeam.manager_id} onChange={(e) => setEditTeam({ ...editTeam, manager_id: e.target.value })}>
                    <option value="">—</option>
                    {managerUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name || u.email}</option>)}
                  </select>
                </label>
                <div className="admin-form-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditTeam(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'team_members' && (
          <div className="admin-block">
            <form className="admin-form inline" onSubmit={handleCreateMember}>
              <input type="text" placeholder="Name" value={formMember.name} onChange={(e) => setFormMember({ ...formMember, name: e.target.value })} required />
              <input type="email" placeholder="Email" value={formMember.email} onChange={(e) => setFormMember({ ...formMember, email: e.target.value })} />
              <select value={formMember.team_id} onChange={(e) => setFormMember({ ...formMember, team_id: e.target.value })} required>
                <option value="">Team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input type="text" placeholder="Role (job title)" value={formMember.role} onChange={(e) => setFormMember({ ...formMember, role: e.target.value })} />
              <select value={formMember.user_id} onChange={(e) => setFormMember({ ...formMember, user_id: e.target.value })}>
                <option value="">Link to user (optional)</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>
              <button type="submit">Add member</button>
            </form>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Team</th>
                  <th>Manager</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.email || '—'}</td>
                    <td>{m.role || '—'}</td>
                    <td>{m.team_name || '—'}</td>
                    <td>{m.manager_name || '—'}</td>
                    <td>
                      <button type="button" onClick={() => setEditMember({ ...m })}>Edit</button>
                      <button type="button" className="danger" onClick={() => handleDeleteMember(m)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editMember && (
              <form className="admin-form" onSubmit={handleUpdateMember}>
                <h4>Edit member</h4>
                <label>Name <input type="text" value={editMember.name} onChange={(e) => setEditMember({ ...editMember, name: e.target.value })} required /></label>
                <label>Email <input type="email" value={editMember.email || ''} onChange={(e) => setEditMember({ ...editMember, email: e.target.value })} /></label>
                <label>Team
                  <select value={editMember.team_id} onChange={(e) => setEditMember({ ...editMember, team_id: parseInt(e.target.value, 10) })}>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
                <label>Role <input type="text" value={editMember.role || ''} onChange={(e) => setEditMember({ ...editMember, role: e.target.value })} /></label>
                <label>Department <input type="text" value={editMember.department || ''} onChange={(e) => setEditMember({ ...editMember, department: e.target.value })} /></label>
                <div className="admin-form-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditMember(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-wrap {
          min-height: 100vh;
          padding: 1.5rem 2rem;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          background: #f5f5f5;
          color: #222;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #ccc;
        }
        .admin-header-title { display: flex; flex-direction: column; gap: 0.2rem; }
        .admin-brand {
          font-size: 0.82rem;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          width: fit-content;
        }
        .admin-brand:hover { color: #1d4ed8; }
        .admin-header h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
        .admin-logout {
          padding: 0.4rem 0.75rem;
          font-size: 13px;
          color: #555;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }
        .admin-logout:hover {
          background: #f0f0f0;
        }
        .admin-error {
          background: #fef2f2;
          color: #b91c1c;
          padding: 0.5rem 0.75rem;
          margin-bottom: 1rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .admin-error button {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: inherit;
        }
        .admin-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .admin-tabs button {
          padding: 0.4rem 0.8rem;
          border: 1px solid #ccc;
          background: #fff;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        .admin-tabs button:hover { background: #eee; }
        .admin-tabs button.active {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
        .admin-block {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .admin-block table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .admin-block th,
        .admin-block td {
          padding: 0.4rem 0.6rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .admin-block th { font-weight: 600; color: #555; }
        .admin-block button {
          padding: 0.2rem 0.5rem;
          margin-right: 0.25rem;
          font-size: 12px;
          border: 1px solid #ccc;
          background: #fff;
          border-radius: 3px;
          cursor: pointer;
        }
        .admin-block button:hover { background: #f0f0f0; }
        .admin-block button.danger { color: #b91c1c; border-color: #fca5a5; }
        .admin-form {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
          max-width: 320px;
        }
        .admin-form.inline {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
          max-width: none;
          border-top: none;
          padding-top: 0;
        }
        .admin-form.inline input,
        .admin-form.inline select {
          padding: 0.35rem 0.5rem;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-size: 13px;
        }
        .admin-form h4 { margin: 0 0 0.5rem; font-size: 13px; }
        .admin-form label { display: block; margin-bottom: 0.4rem; font-size: 13px; }
        .admin-form input,
        .admin-form select {
          width: 100%;
          max-width: 280px;
          padding: 0.35rem 0.5rem;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-size: 13px;
          margin-top: 0.15rem;
        }
        .admin-form-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .admin-form-actions button {
          padding: 0.35rem 0.75rem;
          font-size: 13px;
          border: 1px solid #2563eb;
          background: #2563eb;
          color: #fff;
          border-radius: 3px;
          cursor: pointer;
        }
        .admin-form-actions button:last-child {
          background: #fff;
          color: #333;
          border-color: #ccc;
        }
      `}</style>
    </>
  );
}

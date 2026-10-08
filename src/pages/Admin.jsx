import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api.js';
import { PageLoader } from '../components/common/Spinner.jsx';
import toast from 'react-hot-toast';
import { Users, Shield, Activity, Search, ChevronLeft, ChevronRight } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    success: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ pages: 1, total: 0 });

  useEffect(() => {
    adminAPI.getStats()
      .then(({ data }) => setStats(data.stats))
      .catch(() => toast.error('Failed to load admin stats'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      adminAPI.getUsers({ search: userSearch, page: userPage })
        .then(({ data }) => {
          setUsers(data.users);
          setUserPagination(data.pagination);
        })
        .catch(console.error);
    }
    if (tab === 'logs') {
      adminAPI.getLogs()
        .then(({ data }) => setLogs(data.logs))
        .catch(console.error);
    }
  }, [tab, userSearch, userPage]);

  const handleToggleUser = async (id) => {
    try {
      const { data } = await adminAPI.toggleUserStatus(id);
      setUsers(us => us.map(u => u._id === id ? data.user : u));
      toast.success(`User ${data.user.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Action failed');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      const { data } = await adminAPI.updateUserRole(id, role);
      setUsers(us => us.map(u => u._id === id ? data.user : u));
      toast.success('Role updated');
    } catch {
      toast.error('Role update failed');
    }
  };

  if (loading) return <PageLoader message="Loading admin panel..." />;

  const tabList = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'logs', label: 'Audit Logs', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Admin Panel</h2>
        <p className="text-muted mt-1">Monitor and manage the platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="primary" />
        <StatCard icon={Shield} label="Total Scans" value={stats?.totalScans || 0} color="success" />
        <StatCard icon={Activity} label="API Requests Today" value={stats?.apiUsage?.todayRequests || 0} color="warning" />
        <StatCard icon={Activity} label="Total API Requests" value={stats?.apiUsage?.totalRequests || 0} color="danger" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-surface-200 dark:border-surface-700 overflow-x-auto">
          {tabList.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-muted hover:text-surface-700 dark:hover:text-surface-300'
              }`}
              onClick={() => setTab(id)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-3">Recent Users</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        {['Name', 'Email', 'Role', 'Joined'].map(h => (
                          <th key={h} className="text-left pb-2 pr-4 font-medium text-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-700/50">
                      {(stats?.recentUsers || []).map(u => (
                        <tr key={u._id}>
                          <td className="py-2.5 pr-4 font-medium text-surface-900 dark:text-surface-100">{u.name}</td>
                          <td className="py-2.5 pr-4 text-muted">{u.email}</td>
                          <td className="py-2.5 pr-4">
                            <span className={`badge ${u.role === 'admin' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {stats?.topUsers?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-3">Top Users by Scans</h3>
                  <div className="space-y-2">
                    {stats.topUsers.map((u, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{u.user?.name}</p>
                          <p className="text-xs text-muted">{u.user?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-surface-900 dark:text-surface-100">{u.count} scans</p>
                          <p className="text-xs text-muted">avg {Math.round(u.avgScore || 0)}/100</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="text-left pb-2 pr-4 font-medium text-muted whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700/50">
                    {users.map(u => (
                      <tr key={u._id}>
                        <td className="py-3 pr-4 font-medium text-surface-900 dark:text-surface-100">{u.name}</td>
                        <td className="py-3 pr-4 text-muted">{u.email}</td>
                        <td className="py-3 pr-4">
                          <select
                            className="text-xs border border-surface-200 dark:border-surface-600 rounded px-1.5 py-0.5 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`badge ${u.isActive ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400' : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleUser(u._id)}
                            className={`text-xs btn ${u.isActive ? 'btn-danger' : 'btn-secondary'} py-1 px-2`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {userPagination.pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">{userPagination.total} total users</p>
                  <div className="flex gap-2">
                    <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage <= 1} className="btn-secondary py-1 px-2">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setUserPage(p => p + 1)} disabled={userPage >= userPagination.pages} className="btn-secondary py-1 px-2">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    {['Action', 'User', 'Resource', 'Status', 'Time'].map(h => (
                      <th key={h} className="text-left pb-2 pr-4 font-medium text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700/50">
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td className="py-2 pr-4 font-medium font-mono text-surface-700 dark:text-surface-300">{log.action}</td>
                      <td className="py-2 pr-4 text-muted">{log.user?.email || 'Guest'}</td>
                      <td className="py-2 pr-4 text-muted">{log.resource}</td>
                      <td className="py-2 pr-4">
                        <span className={`badge text-xs ${log.status === 'success' ? 'bg-secondary-100 text-secondary-700' : 'bg-danger-100 text-danger-700'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted">No logs found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

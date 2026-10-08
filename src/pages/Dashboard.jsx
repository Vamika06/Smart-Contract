import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart3, FileCode,
  BookOpen, ListChecks, GraduationCap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardAPI } from '../services/api.js';
import { PageLoader } from '../components/common/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#16a34a',
  informational: '#2563eb',
};

const RISK_COLORS = {
  excellent: '#16a34a',
  good: '#22c55e',
  moderate: '#d97706',
  high: '#ea580c',
  critical: '#dc2626',
};

function StatCard({ icon: Icon, label, value, sub, color = 'primary', trend }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    success: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400',
  };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted mb-1">{label}</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-100">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function ScoreGauge({ score }) {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const label = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Moderate' : score >= 40 ? 'High Risk' : 'Critical';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full">
          <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${score * 1.257} 125.7`}
          />
          <line
            x1="50" y1="50"
            x2={50 + 28 * Math.cos((angle * Math.PI) / 180)}
            y2={50 + 28 * Math.sin((angle * Math.PI) / 180)}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="3" fill={color} />
        </svg>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold" style={{ color }}>{score}</div>
        <div className="text-xs font-medium" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then(({ data }) => setData(data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader message="Loading dashboard..." />;

  const severityData = data ? [
    { name: 'Critical', value: data.severities?.critical || 0, color: SEVERITY_COLORS.critical },
    { name: 'High', value: data.severities?.high || 0, color: SEVERITY_COLORS.high },
    { name: 'Medium', value: data.severities?.medium || 0, color: SEVERITY_COLORS.medium },
    { name: 'Low', value: data.severities?.low || 0, color: SEVERITY_COLORS.low },
    { name: 'Info', value: data.severities?.informational || 0, color: SEVERITY_COLORS.informational },
  ].filter(d => d.value > 0) : [];

  const riskData = data ? Object.entries(data.riskDistribution || {}).map(([level, count]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: count,
    color: RISK_COLORS[level] || '#64748b',
  })) : [];

  const trendData = data?.scanTrend?.map(d => ({
    date: d._id,
    scans: d.count,
    avgScore: Math.round(d.avgScore || 0),
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Welcome back, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-muted mt-1">Here's your smart contract security overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: '/learn', icon: BookOpen, label: 'Learn Hub', grad: 'from-emerald-500 to-teal-500' },
          { to: '/templates', icon: FileCode, label: 'Templates', grad: 'from-pink-500 to-rose-500' },
          { to: '/checklist', icon: ListChecks, label: 'Checklist', grad: 'from-indigo-500 to-violet-500' },
          { to: '/academy', icon: GraduationCap, label: 'Academy', grad: 'from-amber-500 to-orange-500' },
        ].map(({ to, icon: Icon, label, grad }) => (
          <button key={to} onClick={() => navigate(to)} className={`flex items-center gap-3 p-4 rounded-xl text-white font-semibold bg-gradient-to-r ${grad} hover:scale-[1.03] hover:shadow-lg transition-all`}>
            <Icon className="w-5 h-5" /> {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FileCode} label="Total Scans" value={data?.totalScans || 0} sub="All time" color="primary" />
        <StatCard icon={Shield} label="Avg Security Score" value={`${data?.averageScore || 0}/100`} sub="Across all scans" color="success" />
        <StatCard icon={AlertTriangle} label="Critical Vulnerabilities" value={data?.severities?.critical || 0} sub="Requires immediate action" color="danger" />
        <StatCard icon={TrendingUp} label="High Severity" value={data?.severities?.high || 0} sub="Needs attention" color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 self-start">
            <BarChart3 className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Average Score</h3>
          </div>
          <ScoreGauge score={data?.averageScore || 0} />
          <div className="grid grid-cols-2 gap-3 w-full text-center">
            {[
              { label: 'Medium', value: data?.severities?.medium || 0, color: 'text-warning-600' },
              { label: 'Low', value: data?.severities?.low || 0, color: 'text-secondary-600' },
            ].map(s => (
              <div key={s.label} className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-2">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Vulnerability Distribution</h3>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {severityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted text-sm">
              No scan data yet. <button onClick={() => navigate('/scanner')} className="text-primary-600 ml-1 hover:underline">Start scanning</button>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Risk Distribution</h3>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted text-sm">No data yet</div>
          )}
        </div>
      </div>

      {trendData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Scan Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="scans" stroke="#3b82f6" fill="url(#scanGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {data?.recentScans?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Recent Scans</h3>
            <button onClick={() => navigate('/history')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</button>
          </div>
          <div className="divide-y divide-surface-200 dark:divide-surface-700">
            {data.recentScans.map((scan) => (
              <div
                key={scan._id}
                className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/scan/${scan._id}`)}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  scan.riskLevel === 'excellent' || scan.riskLevel === 'good' ? 'bg-secondary-500' :
                  scan.riskLevel === 'moderate' ? 'bg-warning-500' : 'bg-danger-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{scan.contractName}</p>
                  <p className="text-xs text-muted">{new Date(scan.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{scan.securityScore}/100</p>
                  <p className="text-xs text-muted capitalize">{scan.riskLevel}</p>
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                  {scan.summary?.total || 0} issues
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data?.totalScans && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Start securing your contracts</h3>
          <p className="text-muted mb-6 max-w-sm mx-auto">Upload or paste your Solidity smart contract to get an instant AI-powered security analysis.</p>
          <button onClick={() => navigate('/scanner')} className="btn-primary mx-auto">
            <Shield className="w-4 h-4" />
            Scan your first contract
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Trash2, Eye, ChevronLeft, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { contractAPI } from '../services/api.js';
import { PageLoader } from '../components/common/Spinner.jsx';
import toast from 'react-hot-toast';

const RISK_CONFIG = {
  excellent: { label: 'Excellent', class: 'badge bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400' },
  good: { label: 'Good', class: 'badge bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400' },
  moderate: { label: 'Moderate', class: 'badge bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' },
  high: { label: 'High Risk', class: 'badge bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400' },
  critical: { label: 'Critical', class: 'badge bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' },
};

export default function ScanHistory() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [deleting, setDeleting] = useState(null);

  const fetchScans = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await contractAPI.getHistory({
        page, limit: 10, search, riskLevel: riskFilter, sortBy, sortOrder: 'desc',
      });
      setScans(data.scans);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  }, [search, riskFilter, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => fetchScans(1), 300);
    return () => clearTimeout(timer);
  }, [fetchScans]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this scan? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await contractAPI.delete(id);
      setScans(s => s.filter(sc => sc._id !== id));
      toast.success('Scan deleted');
    } catch {
      toast.error('Failed to delete scan');
    } finally {
      setDeleting(null);
    }
  };

  const ScoreBar = ({ score }) => {
    const color = score >= 80 ? 'bg-secondary-500' : score >= 60 ? 'bg-warning-500' : 'bg-danger-500';
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-sm font-medium text-surface-900 dark:text-surface-100 w-10 text-right">{score}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Scan History</h2>
          <p className="text-muted mt-1">{pagination.total} scans total</p>
        </div>
        <button onClick={() => navigate('/scanner')} className="btn-primary self-start sm:self-auto">
          <Shield className="w-4 h-4" />
          New Scan
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search by contract name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-full sm:w-40" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="">All risk levels</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="moderate">Moderate</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical</option>
          </select>
          <select className="input w-full sm:w-40" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="createdAt">Latest first</option>
            <option value="securityScore">By score</option>
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader message="Loading scans..." />
      ) : scans.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-surface-300 mx-auto mb-3" />
          <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-1">No scans found</h3>
          <p className="text-sm text-muted">
            {search || riskFilter ? 'Try adjusting your filters.' : 'Start by scanning your first contract.'}
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-surface-400">Contract</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-surface-400 hidden md:table-cell">Risk</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-surface-400">Score</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-surface-400 hidden lg:table-cell">Issues</th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600 dark:text-surface-400 hidden lg:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-surface-600 dark:text-surface-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                  {scans.map((scan) => {
                    const risk = RISK_CONFIG[scan.riskLevel] || RISK_CONFIG.moderate;
                    return (
                      <tr
                        key={scan._id}
                        className="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/scan/${scan._id}`)}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-surface-900 dark:text-surface-100">{scan.contractName}</p>
                            <p className="text-xs text-muted">{scan.fileName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={risk.class}>{risk.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBar score={scan.securityScore || 0} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-xs">
                            {scan.summary?.critical > 0 && <span className="badge-critical">{scan.summary.critical}C</span>}
                            {scan.summary?.high > 0 && <span className="badge-high">{scan.summary.high}H</span>}
                            {scan.summary?.medium > 0 && <span className="badge-medium">{scan.summary.medium}M</span>}
                            {(!scan.summary?.total) && <span className="text-muted">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted hidden lg:table-cell">
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/scan/${scan._id}`); }}
                              className="btn-ghost p-1.5 rounded-lg"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(scan._id, e)}
                              disabled={deleting === scan._id}
                              className="btn-ghost p-1.5 rounded-lg text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchScans(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="btn-secondary py-1.5 px-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchScans(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="btn-secondary py-1.5 px-3"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

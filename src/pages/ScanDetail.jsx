import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Shield, AlertTriangle, ChevronDown, ChevronUp,
  Code, FileText, Cpu, ExternalLink, CheckCircle2, Clock, BookOpen
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { contractAPI, reportAPI } from '../services/api.js';
import { PageLoader } from '../components/common/Spinner.jsx';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  critical: { color: '#dc2626', bg: 'bg-danger-50 dark:bg-danger-900/20', border: 'border-danger-200 dark:border-danger-800', badge: 'badge-critical', label: 'Critical' },
  high: { color: '#ea580c', bg: 'bg-accent-50 dark:bg-accent-900/20', border: 'border-accent-200 dark:border-accent-800', badge: 'badge-high', label: 'High' },
  medium: { color: '#d97706', bg: 'bg-warning-50 dark:bg-warning-900/20', border: 'border-warning-200 dark:border-warning-800', badge: 'badge-medium', label: 'Medium' },
  low: { color: '#16a34a', bg: 'bg-secondary-50 dark:bg-secondary-900/20', border: 'border-secondary-200 dark:border-secondary-800', badge: 'badge-low', label: 'Low' },
  informational: { color: '#2563eb', bg: 'bg-primary-50 dark:bg-primary-900/20', border: 'border-primary-200 dark:border-primary-800', badge: 'badge-informational', label: 'Info' },
};

function ScoreGauge({ score }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const label = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Moderate Risk' : score >= 40 ? 'High Risk' : 'Critical Risk';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-surface-500">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function VulnerabilityCard({ vuln }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[vuln.severity] || SEVERITY_CONFIG.informational;

  return (
    <div className={`rounded-xl border ${cfg.border} overflow-hidden transition-all`}>
      <button
        className={`w-full flex items-start gap-3 p-4 text-left ${cfg.bg} hover:opacity-90 transition-opacity`}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cfg.badge}>{cfg.label}</span>
            {vuln.lineNumber && (
              <span className="text-xs text-surface-500 font-mono">Line {vuln.lineNumber}</span>
            )}
            <span className="text-xs text-surface-500">{vuln.cwe}</span>
            <span className="text-xs text-surface-500">{vuln.owasp}</span>
          </div>
          <h4 className="font-semibold text-surface-900 dark:text-surface-100">{vuln.name}</h4>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 line-clamp-2">{vuln.description}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-surface-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-surface-400 flex-shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 animate-fade-in">
          {vuln.codeSnippet && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> Affected Code
              </p>
              <pre className="text-xs font-mono bg-surface-50 dark:bg-surface-900 rounded-lg p-3 overflow-x-auto scrollbar-thin border border-surface-200 dark:border-surface-700">
                {vuln.codeSnippet}
              </pre>
            </div>
          )}

          {vuln.aiExplanation && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Simple Explanation
                  </p>
                  <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                    {vuln.aiExplanation.simpleExplanation}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Why Dangerous
                  </p>
                  <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                    {vuln.aiExplanation.whyDangerous}
                  </p>
                </div>
              </div>

              {vuln.aiExplanation.realWorldExample && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Real-World Attack Example</p>
                  <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-100 dark:border-danger-800">
                    <p className="text-sm text-danger-700 dark:text-danger-300">{vuln.aiExplanation.realWorldExample}</p>
                  </div>
                </div>
              )}

              {vuln.aiExplanation.secureCodeFix && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary-500" /> Secure Code Fix
                  </p>
                  <pre className="text-xs font-mono bg-surface-900 dark:bg-surface-950 text-secondary-400 rounded-lg p-3 overflow-x-auto scrollbar-thin">
                    {vuln.aiExplanation.secureCodeFix}
                  </pre>
                </div>
              )}

              {vuln.aiExplanation.bestPractices?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Best Practices</p>
                  <ul className="space-y-1">
                    {vuln.aiExplanation.bestPractices.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary-500 flex-shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {vuln.aiExplanation.exploitRisk && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-surface-500 font-medium">Exploit Risk:</span>
                  <span className="text-surface-700 dark:text-surface-300">{vuln.aiExplanation.exploitRisk}</span>
                </div>
              )}
            </>
          )}

          <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Recommendation</p>
            <p className="text-sm text-surface-700 dark:text-surface-300">{vuln.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vulnerabilities');
  const [downloading, setDownloading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    contractAPI.getById(id)
      .then(({ data }) => setScan(data.scan))
      .catch(() => { toast.error('Scan not found'); navigate('/history'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const { data } = await reportAPI.downloadPDF(id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${scan.contractName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <PageLoader message="Loading scan results..." />;
  if (!scan) return null;

  const filteredVulns = severityFilter
    ? scan.vulnerabilities?.filter(v => v.severity === severityFilter)
    : scan.vulnerabilities || [];

  const severityData = [
    { name: 'Critical', value: scan.summary?.critical || 0, color: '#dc2626' },
    { name: 'High', value: scan.summary?.high || 0, color: '#ea580c' },
    { name: 'Medium', value: scan.summary?.medium || 0, color: '#d97706' },
    { name: 'Low', value: scan.summary?.low || 0, color: '#16a34a' },
    { name: 'Info', value: scan.summary?.informational || 0, color: '#2563eb' },
  ].filter(d => d.value > 0);

  const tabs = [
    { id: 'vulnerabilities', label: `Vulnerabilities (${scan.summary?.total || 0})` },
    { id: 'assessment', label: 'AI Assessment' },
    { id: 'source', label: 'Source Code' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/history')} className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">{scan.contractName}</h2>
            <p className="text-sm text-muted">{scan.fileName} — {new Date(scan.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <button onClick={downloadPDF} disabled={downloading} className="btn-secondary self-start sm:self-auto">
          <Download className="w-4 h-4" />
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center justify-center">
          <ScoreGauge score={scan.securityScore || 0} />
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Contract Info</h3>
          </div>
          <dl className="space-y-2 text-sm">
            {[
              ['Compiler', scan.compilerVersion || 'Unknown'],
              ['Lines of Code', scan.linesOfCode || '—'],
              ['Scan Time', `${((scan.scanDuration || 0) / 1000).toFixed(1)}s`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium text-surface-900 dark:text-surface-100">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-danger-600" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Issues Found</h3>
          </div>
          <div className="space-y-2">
            {(['critical', 'high', 'medium', 'low', 'informational']).map(sev => {
              const count = scan.summary?.[sev] || 0;
              if (!count) return null;
              const cfg = SEVERITY_CONFIG[sev];
              return (
                <div key={sev} className="flex items-center justify-between">
                  <span className={cfg.badge}>{cfg.label}</span>
                  <span className="font-bold text-surface-900 dark:text-surface-100">{count}</span>
                </div>
              );
            })}
            {!scan.summary?.total && (
              <p className="text-sm text-secondary-600 dark:text-secondary-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> No issues detected
              </p>
            )}
          </div>
        </div>

        <div className="card p-3">
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-secondary-500 mx-auto mb-2" />
                <p className="text-sm text-secondary-600 dark:text-secondary-400 font-medium">All Clear</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-surface-200 dark:border-surface-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-muted hover:text-surface-700 dark:hover:text-surface-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'vulnerabilities' && (
            <div className="space-y-4">
              {scan.vulnerabilities?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSeverityFilter('')}
                    className={`badge cursor-pointer transition-all ${!severityFilter ? 'bg-surface-800 text-white dark:bg-surface-200 dark:text-surface-900' : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300'}`}
                  >
                    All ({scan.summary?.total || 0})
                  </button>
                  {['critical', 'high', 'medium', 'low', 'informational'].map(sev => {
                    const count = scan.summary?.[sev] || 0;
                    if (!count) return null;
                    return (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev === severityFilter ? '' : sev)}
                        className={`${SEVERITY_CONFIG[sev].badge} cursor-pointer transition-all ${severityFilter === sev ? 'ring-2 ring-current ring-offset-1' : ''}`}
                      >
                        {SEVERITY_CONFIG[sev].label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredVulns.length > 0 ? (
                <div className="space-y-3">
                  {filteredVulns.map((vuln) => (
                    <VulnerabilityCard key={vuln.id || vuln._id} vuln={vuln} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-secondary-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-1">
                    {severityFilter ? `No ${severityFilter} vulnerabilities` : 'No vulnerabilities found!'}
                  </h3>
                  <p className="text-sm text-muted">
                    {severityFilter ? 'Try selecting a different filter.' : 'This contract passed all automated security checks.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assessment' && (
            <div className="space-y-6">
              {scan.aiAssessment ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                      <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary-600" />
                        Contract Purpose
                      </h4>
                      <p className="text-sm text-surface-700 dark:text-surface-300">
                        {scan.aiAssessment.contractPurpose || 'Not determined'}
                      </p>
                    </div>
                    <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                      <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary-600" />
                        Deployment Readiness
                      </h4>
                      <p className="text-sm text-surface-700 dark:text-surface-300">
                        {scan.aiAssessment.deploymentReadiness || 'Not assessed'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-3">Overall Risk Assessment</h4>
                    <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed bg-surface-50 dark:bg-surface-700/50 p-4 rounded-xl">
                      {scan.aiAssessment.overallRisk}
                    </p>
                  </div>

                  {scan.aiAssessment.keyFindings?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-3">Key Findings</h4>
                      <ul className="space-y-2">
                        {scan.aiAssessment.keyFindings.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                            <ExternalLink className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scan.aiAssessment.recommendations?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {scan.aiAssessment.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-secondary-500 flex-shrink-0 mt-0.5" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted text-sm">AI assessment not available for this scan.</p>
              )}
            </div>
          )}

          {activeTab === 'source' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted font-mono">{scan.fileName} — {scan.linesOfCode} lines</span>
                <span className="text-xs badge bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
                  {scan.compilerVersion}
                </span>
              </div>
              <pre className="text-xs font-mono bg-surface-900 dark:bg-surface-950 text-surface-100 rounded-xl p-4 overflow-auto max-h-[600px] scrollbar-thin leading-relaxed">
                {scan.sourceCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

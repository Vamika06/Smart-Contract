import { useMemo, useState } from 'react';
import { Search, BookOpen, Copy, Check, Lightbulb, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { VULNS, SEV_STYLE } from '../data/vulnerabilities.js';

function VulnCard({ v }) {
  const [open, setOpen] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fixed ? v.fixed : v.vulnerable);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left p-5 flex items-start gap-4">
        <div className="text-3xl">{v.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-surface-900 dark:text-white">{v.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${SEV_STYLE[v.severity].badge}`}>{v.severity}</span>
          </div>
          <p className="text-sm text-muted mt-1">{v.summary}</p>
        </div>
        <span className={`text-violet-500 text-xl transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 animate-fade-in">
          <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span><b>Impact:</b> {v.impact}</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex rounded-lg p-1 bg-surface-100 dark:bg-surface-700 text-xs font-semibold">
                <button onClick={() => setFixed(false)} className={`px-3 py-1 rounded-md ${!fixed ? 'bg-red-500 text-white' : 'text-surface-600 dark:text-surface-300'}`}>Vulnerable</button>
                <button onClick={() => setFixed(true)} className={`px-3 py-1 rounded-md ${fixed ? 'bg-emerald-500 text-white' : 'text-surface-600 dark:text-surface-300'}`}>Fixed</button>
              </div>
              <button onClick={copy} className="btn-ghost text-xs">{copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}</button>
            </div>
            <pre className={`rounded-lg p-4 text-[13px] leading-6 font-mono overflow-auto bg-surface-950 text-surface-100 border-l-4 ${fixed ? 'border-emerald-500' : 'border-red-500'}`}><code>{fixed ? v.fixed : v.vulnerable}</code></pre>
          </div>

          <div>
            <p className="text-sm font-semibold flex items-center gap-1.5 text-surface-800 dark:text-surface-200 mb-2"><Lightbulb className="w-4 h-4 text-amber-500" /> How to prevent it</p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {v.tips.map((t) => (
                <li key={t} className="text-sm px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300">{t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearnHub() {
  const [q, setQ] = useState('');
  const [sev, setSev] = useState('all');

  const list = useMemo(() => VULNS.filter((v) =>
    (sev === 'all' || v.severity === sev) &&
    (v.title + v.summary).toLowerCase().includes(q.toLowerCase())
  ), [q, sev]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
        <BookOpen className="absolute right-6 -bottom-4 w-36 h-36 text-white/15" />
        <h2 className="text-2xl md:text-3xl font-extrabold">Learn Hub</h2>
        <p className="mt-1 text-white/90 max-w-xl">Understand how each exploit works, then see exactly how to fix it.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input className="input pl-9" placeholder="Search vulnerabilities..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
            <button key={s} onClick={() => setSev(s)} className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${sev === s ? 'bg-violet-600 text-white shadow' : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {list.map((v) => <VulnCard key={v.id} v={v} />)}
        {list.length === 0 && <p className="text-center text-muted py-12">No vulnerabilities match your search.</p>}
      </div>
    </div>
  );
}

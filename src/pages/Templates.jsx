import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCode, Copy, Check, Shield, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { TEMPLATES } from '../data/templates.js';

export default function Templates() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('All');
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(null);

  const cats = ['All', ...new Set(TEMPLATES.map((t) => t.category))];
  const list = TEMPLATES.filter((t) => cat === 'All' || t.category === cat);

  const copy = async (t) => {
    try {
      await navigator.clipboard.writeText(t.code);
      setCopied(t.id);
      toast.success('Template copied');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('Could not copy');
    }
  };

  const download = (t) => {
    const blob = new Blob([t.code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${t.name.replace(/[^a-z0-9]+/gi, '')}.sol`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const scan = (t) => navigate('/scanner', { state: { code: t.code, name: t.name.replace(/[^a-z0-9]+/gi, '') } });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 relative overflow-hidden">
        <FileCode className="absolute right-6 -bottom-4 w-36 h-36 text-white/15" />
        <h2 className="text-2xl md:text-3xl font-extrabold">Template Library</h2>
        <p className="mt-1 text-white/90 max-w-xl">Secure starting points built on proven patterns. Copy, download, or send straight to the scanner.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${cat === c ? 'bg-violet-600 text-white shadow' : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300'}`}>{c}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {list.map((t) => (
          <div key={t.id} className="card overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all">
            <div className={`h-24 bg-gradient-to-br ${t.gradient} flex items-center justify-center text-5xl`}>{t.emoji}</div>
            <div className="p-5 flex-1 flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">{t.category}</span>
              <h3 className="font-bold text-surface-900 dark:text-white mt-1">{t.name}</h3>
              <p className="text-sm text-muted mt-1 flex-1">{t.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {t.badges.map((b) => <span key={b} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">{b}</span>)}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                <button onClick={() => setPreview(t)} className="btn-secondary justify-center px-2" title="Preview"><Eye className="w-4 h-4" /></button>
                <button onClick={() => copy(t)} className="btn-secondary justify-center px-2" title="Copy">{copied === t.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}</button>
                <button onClick={() => download(t)} className="btn-secondary justify-center px-2" title="Download .sol"><Download className="w-4 h-4" /></button>
                <button onClick={() => scan(t)} className="btn-primary justify-center px-2" title="Scan this"><Shield className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreview(null)}>
          <div className="card w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
              <h3 className="font-bold text-surface-900 dark:text-white">{preview.emoji} {preview.name}</h3>
              <button onClick={() => setPreview(null)} className="btn-ghost text-xs">Close</button>
            </div>
            <pre className="p-4 overflow-auto text-[13px] leading-6 font-mono bg-surface-950 text-surface-100 rounded-b-xl"><code>{preview.code}</code></pre>
          </div>
        </div>
      )}
    </div>
  );
}

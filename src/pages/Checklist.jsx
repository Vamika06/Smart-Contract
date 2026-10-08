import { useEffect, useState } from 'react';
import { ListChecks, RotateCcw, PartyPopper } from 'lucide-react';
import { CHECKLIST, CHECKLIST_TOTAL } from '../data/checklist.js';

const KEY = 'smartaudit_checklist';

export default function Checklist() {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(done)); } catch { /* ignore */ }
  }, [done]);

  const count = Object.values(done).filter(Boolean).length;
  const pct = Math.round((count / CHECKLIST_TOTAL) * 100);
  const toggle = (k) => setDone((d) => ({ ...d, [k]: !d[k] }));
  const status = pct === 100 ? 'Ready to launch 🚀' : pct >= 70 ? 'Almost there' : pct >= 30 ? 'Making progress' : 'Just getting started';
  const c = 2 * Math.PI * 42;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <svg viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-black">{pct}%</span></div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 justify-center md:justify-start"><ListChecks className="w-7 h-7" /> Pre-Deploy Checklist</h2>
          <p className="mt-1 text-white/90">{status} · {count} of {CHECKLIST_TOTAL} checks complete</p>
        </div>
        <button onClick={() => setDone({})} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-semibold"><RotateCcw className="w-4 h-4" /> Reset</button>
      </div>

      {pct === 100 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 animate-pop-in">
          <PartyPopper className="w-6 h-6" /> <b>Every box is checked.</b> Run one last scan and you are good to deploy.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {CHECKLIST.map((g) => {
          const gDone = g.items.filter((_, i) => done[`${g.group}-${i}`]).length;
          return (
            <div key={g.group} className="card overflow-hidden">
              <div className={`px-5 py-3 bg-gradient-to-r ${g.color} text-white flex items-center justify-between`}>
                <h3 className="font-bold">{g.group}</h3>
                <span className="text-xs font-semibold bg-white/25 px-2 py-0.5 rounded-full">{gDone}/{g.items.length}</span>
              </div>
              <ul className="p-2">
                {g.items.map((item, i) => {
                  const k = `${g.group}-${i}`;
                  return (
                    <li key={k}>
                      <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50">
                        <input type="checkbox" checked={!!done[k]} onChange={() => toggle(k)} className="mt-0.5 w-4 h-4 accent-violet-600" />
                        <span className={`text-sm ${done[k] ? 'line-through text-surface-400' : 'text-surface-800 dark:text-surface-200'}`}>{item}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

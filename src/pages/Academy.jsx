import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Trophy, Flame, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { QUIZ } from '../data/quiz.js';

const KEY = 'smartaudit_academy_best';

function rank(score) {
  if (score >= 9) return { name: 'Auditor', emoji: '🏆', color: 'from-amber-400 to-orange-500' };
  if (score >= 7) return { name: 'Guardian', emoji: '🛡️', color: 'from-violet-500 to-fuchsia-500' };
  if (score >= 5) return { name: 'Apprentice', emoji: '🔧', color: 'from-cyan-500 to-blue-500' };
  return { name: 'Rookie', emoji: '🌱', color: 'from-emerald-500 to-teal-500' };
}

export default function Academy() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem(KEY) || '0', 10));

  const q = QUIZ[i];

  const choose = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) {
      setScore((s) => s + 1);
      setStreak((s) => { const n = s + 1; setBestStreak((b) => Math.max(b, n)); return n; });
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (i + 1 >= QUIZ.length) {
      const nb = Math.max(best, score);
      setBest(nb);
      try { localStorage.setItem(KEY, String(nb)); } catch { /* ignore */ }
      setFinished(true);
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };

  const restart = () => { setI(0); setPicked(null); setScore(0); setStreak(0); setBestStreak(0); setFinished(false); };

  if (finished) {
    const r = rank(score);
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className={`rounded-3xl p-10 text-white bg-gradient-to-br ${r.color} shadow-xl`}>
          <div className="text-7xl animate-pop-in">{r.emoji}</div>
          <p className="mt-2 text-sm uppercase tracking-widest text-white/80">Your rank</p>
          <h2 className="text-4xl font-black">{r.name}</h2>
          <p className="mt-3 text-white/90">You scored <b>{score}/{QUIZ.length}</b> · best streak <b>{bestStreak}</b></p>
        </div>
        <p className="text-sm text-muted">Personal best: {best}/{QUIZ.length}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={restart} className="btn-secondary"><RotateCcw className="w-4 h-4" /> Try again</button>
          <button onClick={() => navigate('/learn')} className="btn-primary">Review in Learn Hub <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 relative overflow-hidden">
        <GraduationCap className="absolute right-4 -bottom-4 w-32 h-32 text-white/15" />
        <h2 className="text-2xl md:text-3xl font-extrabold">Security Academy</h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
          <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4" /> Best: {best}/{QUIZ.length}</span>
          <span className="flex items-center gap-1.5"><Flame className="w-4 h-4" /> Streak: {streak}</span>
          <span>Score: {score}</span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${((i + (picked !== null ? 1 : 0)) / QUIZ.length) * 100}%` }} />
      </div>

      <div key={i} className="card p-6 md:p-8 animate-slide-up">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Question {i + 1} of {QUIZ.length}</p>
        <h3 className="mt-2 text-xl font-bold text-surface-900 dark:text-white">{q.q}</h3>

        <div className="mt-5 space-y-3">
          {q.options.map((o, idx) => {
            const isRight = idx === q.answer;
            const isPicked = idx === picked;
            let cls = 'border-surface-200 dark:border-surface-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10';
            if (picked !== null) {
              if (isRight) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
              else if (isPicked) cls = 'border-red-500 bg-red-50 dark:bg-red-500/10';
              else cls = 'border-surface-200 dark:border-surface-700 opacity-60';
            }
            return (
              <button key={o} onClick={() => choose(idx)} disabled={picked !== null} className={`w-full flex items-center gap-3 text-left p-4 rounded-xl border-2 transition-all text-surface-800 dark:text-surface-200 ${cls}`}>
                <span className="w-7 h-7 shrink-0 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-xs font-bold">{String.fromCharCode(65 + idx)}</span>
                <span className="flex-1 text-sm font-medium">{o}</span>
                {picked !== null && isRight && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {picked !== null && isPicked && !isRight && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-5 animate-fade-in">
            <p className="text-sm p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300"><b>{picked === q.answer ? 'Correct! ' : 'Not quite. '}</b>{q.why}</p>
            <button onClick={next} className="btn-primary mt-4 ml-auto">{i + 1 >= QUIZ.length ? 'See results' : 'Next question'} <ArrowRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

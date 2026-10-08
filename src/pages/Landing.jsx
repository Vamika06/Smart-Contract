import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Zap, Bug, BookOpen, FileCode, ListChecks, GraduationCap, Sparkles,
  ArrowRight, Menu, X, Sun, Moon, Play, ChevronDown, Lock, Cpu, BarChart3, FileText,
  CheckCircle2, Rocket, Pencil, Code2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { VULNS, SEV_STYLE } from '../data/vulnerabilities.js';
import { DEMO_SAMPLE, DEMO_SAFE, runDemoScan } from '../data/demoRules.js';

/* ---------- helpers ---------- */

function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, seen];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, seen] = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${seen ? 'in-view' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function Counter({ to, suffix = '', duration = 1600 }) {
  const [ref, seen] = useInView();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function SectionTitle({ eyebrow, title, sub }) {
  return (
    <Reveal className="text-center max-w-2xl mx-auto mb-12">
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 mb-3">
        {eyebrow}
      </span>
      <h2 className="text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-white">{title}</h2>
      {sub && <p className="mt-3 text-surface-600 dark:text-surface-400">{sub}</p>}
    </Reveal>
  );
}

/* ---------- navbar ---------- */

function LandingNav() {
  const { toggleTheme, isDark } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    ['Live Demo', '#demo'], ['Features', '#features'], ['Vulnerabilities', '#vulns'],
    ['Toolkit', '#toolkit'], ['FAQ', '#faq'],
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'glass bg-white/80 dark:bg-surface-950/80 shadow-sm border-b border-surface-200/60 dark:border-surface-800' : ''}`}>
      <div className="max-w-7xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-surface-900 dark:text-white">SmartAudit</span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="px-3 py-2 text-sm font-medium text-surface-600 hover:text-violet-600 dark:text-surface-300 dark:hover:text-violet-300 transition-colors">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800" aria-label="Toggle theme">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90">
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex px-3 py-2 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:text-violet-600">Log in</Link>
              <Link to="/register" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 shadow-lg shadow-fuchsia-500/25">
                Get started free
              </Link>
            </>
          )}
          <button className="md:hidden p-2 text-surface-700 dark:text-surface-200" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass bg-white/95 dark:bg-surface-950/95 border-t border-surface-200 dark:border-surface-800 px-4 py-3 space-y-1 animate-fade-in">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800">{label}</a>
          ))}
          <div className="flex gap-2 pt-2">
            {user ? (
              <Link to="/dashboard" className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-semibold border border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-200">Log in</Link>
                <Link to="/register" className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- hero ---------- */

const ROTATING = ['Reentrancy', 'tx.origin abuse', 'Weak randomness', 'Unchecked calls', 'Access-control gaps'];

function Hero() {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ROTATING.length), 2200);
    return () => clearInterval(t);
  }, []);

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={onMove}
      className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32 bg-gradient-to-b from-violet-50 via-white to-white dark:from-surface-950 dark:via-surface-950 dark:to-surface-950"
    >
      {/* blobs */}
      <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-violet-400/40 dark:bg-violet-600/30 blur-3xl animate-blob" />
      <div className="absolute top-20 -right-24 w-[26rem] h-[26rem] rounded-full bg-fuchsia-400/40 dark:bg-fuchsia-600/25 blur-3xl animate-blob [animation-delay:-4s]" />
      <div className="absolute bottom-0 left-1/3 w-[24rem] h-[24rem] rounded-full bg-cyan-300/40 dark:bg-cyan-500/20 blur-3xl animate-blob [animation-delay:-8s]" />
      {/* cursor spotlight */}
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{ background: 'radial-gradient(400px circle at var(--mx,50%) var(--my,30%), rgba(168,85,247,0.18), transparent 60%)' }}
      />
      {/* grid */}
      <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* floating chips */}
      <div className="hidden lg:block absolute left-[6%] top-48 animate-float">
        <div className="px-3 py-2 rounded-xl bg-white/80 dark:bg-surface-800/80 glass shadow-xl border border-red-200 dark:border-red-500/30 text-xs font-semibold text-red-600 dark:text-red-300 flex items-center gap-2">
          <Bug className="w-4 h-4" /> Critical: Reentrancy
        </div>
      </div>
      <div className="hidden lg:block absolute right-[7%] top-56 animate-float-slow">
        <div className="px-3 py-2 rounded-xl bg-white/80 dark:bg-surface-800/80 glass shadow-xl border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Score 96 / 100
        </div>
      </div>
      <div className="hidden lg:block absolute left-[12%] bottom-24 animate-float-slow">
        <div className="px-3 py-2 rounded-xl bg-white/80 dark:bg-surface-800/80 glass shadow-xl border border-amber-200 dark:border-amber-500/30 text-xs font-semibold text-amber-600 dark:text-amber-300 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Scanned in 3.2s
        </div>
      </div>
      <div className="hidden lg:block absolute right-[10%] bottom-28 animate-float">
        <div className="px-3 py-2 rounded-xl bg-white/80 dark:bg-surface-800/80 glass shadow-xl border border-cyan-200 dark:border-cyan-500/30 text-xs font-semibold text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
          <FileText className="w-4 h-4" /> PDF report ready
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-white/80 dark:bg-surface-800/70 glass border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 shadow-sm animate-slide-up">
          <Sparkles className="w-4 h-4" /> AI-powered smart contract security
        </div>

        <h1 className="mt-6 text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-surface-900 dark:text-white leading-[1.05] animate-slide-up">
          Ship Solidity
          <br />
          <span className="text-gradient">without the exploits</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-surface-600 dark:text-surface-300 max-w-2xl mx-auto animate-slide-up">
          Catch{' '}
          <span key={idx} className="inline-block font-bold text-fuchsia-600 dark:text-fuchsia-400 animate-pop-in">{ROTATING[idx]}</span>{' '}
          and 13+ other vulnerabilities in seconds, then learn how to fix them with guides, secure templates and a pre-deploy checklist.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up">
          <Link to={user ? '/scanner' : '/register'} className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-xl shadow-fuchsia-500/30 hover:scale-105">
            <Rocket className="w-5 h-5" /> {user ? 'Scan a contract' : 'Start scanning free'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#demo" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-surface-800 dark:text-white bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-violet-400 hover:scale-105 transition-all shadow-sm">
            <Play className="w-4 h-4 text-violet-600" /> Try the live demo
          </a>
        </div>

        <p className="mt-5 text-xs text-surface-500 dark:text-surface-400">No credit card · Paste code or drop a .sol file · Results in seconds</p>
      </div>
    </section>
  );
}

/* ---------- logo marquee / trust strip ---------- */

function Marquee() {
  const items = ['Reentrancy', 'Integer Overflow', 'tx.origin', 'Delegatecall', 'Selfdestruct', 'Front-Running', 'Weak Randomness', 'Access Control', 'Unchecked Calls', 'DoS', 'Uninitialized Storage', 'Gas Optimization', 'Timestamp Dependence'];
  const colors = ['text-violet-500', 'text-fuchsia-500', 'text-cyan-500', 'text-amber-500', 'text-emerald-500', 'text-pink-500'];
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-5 border-y border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className={`flex items-center gap-2 text-sm font-semibold ${colors[i % colors.length]}`}>
            <Bug className="w-4 h-4" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- live demo ---------- */

function ScoreRing({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const c = 2 * Math.PI * 42;
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-surface-200 dark:text-surface-700" strokeWidth="9" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-surface-900 dark:text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-surface-500">score</span>
      </div>
    </div>
  );
}

function LiveDemo() {
  const [code, setCode] = useState(DEMO_SAMPLE);
  const [phase, setPhase] = useState('edit'); // edit | scanning | done
  const [result, setResult] = useState(null);
  const [active, setActive] = useState(null);
  const lineRefs = useRef({});

  const scan = () => {
    setPhase('scanning');
    setActive(null);
    setTimeout(() => {
      setResult(runDemoScan(code));
      setPhase('done');
    }, 1600);
  };

  const jump = (line) => {
    setActive(line);
    lineRefs.current[line]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const flagged = {};
  result?.findings.forEach((f) => { flagged[f.line] = f; });
  const lines = code.split('\n');

  return (
    <section id="demo" className="py-20 md:py-28 bg-surface-50 dark:bg-surface-950 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionTitle eyebrow="Live demo" title="Scan a contract right here" sub="No signup needed for this preview. Edit the code, hit scan, and click any finding to jump to the line." />

        <Reveal>
          <div className="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 shadow-2xl shadow-violet-500/10 bg-white dark:bg-surface-900">
            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600">
              <div className="flex gap-1.5 mr-2">
                <span className="w-3 h-3 rounded-full bg-white/40" /><span className="w-3 h-3 rounded-full bg-white/40" /><span className="w-3 h-3 rounded-full bg-white/40" />
              </div>
              <span className="text-white/90 text-sm font-mono flex items-center gap-1.5"><Code2 className="w-4 h-4" /> Contract.sol</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <button onClick={() => { setCode(DEMO_SAMPLE); setPhase('edit'); setResult(null); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white">Vulnerable sample</button>
                <button onClick={() => { setCode(DEMO_SAFE); setPhase('edit'); setResult(null); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white">Safe sample</button>
                {phase === 'done' ? (
                  <button onClick={() => setPhase('edit')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-violet-700 flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit code</button>
                ) : (
                  <button onClick={scan} disabled={phase === 'scanning' || !code.trim()} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-violet-700 hover:scale-105 transition-transform flex items-center gap-1.5 disabled:opacity-60">
                    <Zap className="w-3.5 h-3.5" /> {phase === 'scanning' ? 'Scanning...' : 'Scan now'}
                  </button>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-5">
              {/* code panel */}
              <div className="lg:col-span-3 relative bg-surface-950 text-surface-100 font-mono text-[13px] h-[26rem] overflow-auto scrollbar-thin">
                {phase === 'edit' ? (
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    className="w-full h-full min-h-[26rem] bg-transparent p-4 outline-none resize-none leading-6 text-surface-100"
                  />
                ) : (
                  <div className="py-4 relative">
                    {lines.map((ln, i) => {
                      const n = i + 1;
                      const f = flagged[n];
                      return (
                        <div
                          key={n}
                          ref={(el) => (lineRefs.current[n] = el)}
                          className={`flex leading-6 border-l-4 ${f ? SEV_STYLE[f.severity].line : 'border-transparent'} ${active === n ? 'ring-1 ring-white/60' : ''}`}
                        >
                          <span className="w-10 shrink-0 text-right pr-3 text-surface-500 select-none">{n}</span>
                          <span className="whitespace-pre pr-4">{ln || ' '}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {phase === 'scanning' && (
                  <div className="absolute inset-0 bg-surface-950/40 pointer-events-none">
                    <div className="absolute left-0 right-0 h-16 bg-gradient-to-b from-transparent via-fuchsia-500/40 to-transparent animate-scan" />
                  </div>
                )}
              </div>

              {/* results panel */}
              <div className="lg:col-span-2 p-5 h-[26rem] overflow-auto scrollbar-thin bg-white dark:bg-surface-900">
                {phase === 'edit' && (
                  <div className="h-full flex flex-col items-center justify-center text-center text-surface-500 dark:text-surface-400">
                    <Cpu className="w-12 h-12 text-violet-400 mb-3 animate-float" />
                    <p className="font-semibold text-surface-700 dark:text-surface-200">Ready when you are</p>
                    <p className="text-sm mt-1">Edit the code if you like, then press <b>Scan now</b>.</p>
                  </div>
                )}
                {phase === 'scanning' && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 border-4 border-violet-200 border-t-fuchsia-500 rounded-full animate-spin mb-4" />
                    <p className="font-semibold text-surface-700 dark:text-surface-200">Analyzing patterns...</p>
                  </div>
                )}
                {phase === 'done' && result && (
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-4 mb-4">
                      <ScoreRing score={result.score} />
                      <div className="text-sm">
                        <p className="font-bold text-surface-900 dark:text-white text-base">
                          {result.findings.length === 0 ? 'No issues found' : `${result.findings.length} issue${result.findings.length > 1 ? 's' : ''} found`}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['critical', 'high', 'medium', 'low'].filter((s) => result.counts[s]).map((s) => (
                            <span key={s} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SEV_STYLE[s].badge}`}>{result.counts[s]} {s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {result.findings.length === 0 ? (
                      <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm flex gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" /> This demo engine found nothing. The full scanner runs 13+ deeper checks plus AI review.
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {result.findings.map((f, i) => (
                          <li key={i}>
                            <button onClick={() => jump(f.line)} className={`w-full text-left rounded-xl p-3 border border-surface-200 dark:border-surface-700 hover:ring-2 ${SEV_STYLE[f.severity].ring} transition-all animate-pop-in`} style={{ animationDelay: `${i * 80}ms` }}>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${SEV_STYLE[f.severity].dot}`} />
                                <span className="text-sm font-semibold text-surface-900 dark:text-white flex-1">{f.title}</span>
                                <span className="text-xs text-surface-400 font-mono">L{f.line}</span>
                              </div>
                              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 pl-4">{f.fix}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link to="/register" className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90">
                      Get the full AI report <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
        <p className="text-center text-xs text-surface-500 mt-4">The preview uses a lightweight rule engine in your browser. Your code is never uploaded.</p>
      </div>
    </section>
  );
}

/* ---------- stats ---------- */

function Stats() {
  const stats = [
    { n: 13, s: '+', label: 'Vulnerability types', grad: 'from-violet-500 to-fuchsia-500' },
    { n: 100, s: '', label: 'Point security score', grad: 'from-cyan-500 to-blue-500' },
    { n: 6, s: '', label: 'Secure templates', grad: 'from-emerald-500 to-teal-500' },
    { n: 25, s: '+', label: 'Checklist items', grad: 'from-amber-500 to-orange-500' },
  ];
  return (
    <section className="py-16 bg-white dark:bg-surface-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 100} className="text-center">
            <div className={`text-5xl md:text-6xl font-black bg-gradient-to-r ${s.grad} bg-clip-text text-transparent`}>
              <Counter to={s.n} suffix={s.s} />
            </div>
            <p className="mt-2 text-sm font-medium text-surface-600 dark:text-surface-400">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- features ---------- */

const FEATURES = [
  { icon: Bug, title: 'Deep vulnerability scan', text: 'Static analysis catches 13+ classes of bugs, from reentrancy to unchecked calls.', grad: 'from-red-500 to-rose-500' },
  { icon: Cpu, title: 'AI explanations', text: 'Every finding comes with a plain-English explanation and a concrete fix.', grad: 'from-violet-500 to-fuchsia-500' },
  { icon: BarChart3, title: 'Security score & trends', text: 'Track your 0 to 100 score over time on a colorful analytics dashboard.', grad: 'from-cyan-500 to-blue-500' },
  { icon: FileText, title: 'PDF audit reports', text: 'Export a professional report to share with your team or investors.', grad: 'from-amber-500 to-orange-500' },
  { icon: BookOpen, title: 'Learn Hub', text: 'An illustrated encyclopedia of exploits with vulnerable vs. fixed code side by side.', grad: 'from-emerald-500 to-teal-500', isNew: true },
  { icon: FileCode, title: 'Secure templates', text: 'Battle-tested starter contracts. Copy them or send them straight to the scanner.', grad: 'from-pink-500 to-rose-500', isNew: true },
  { icon: ListChecks, title: 'Pre-deploy checklist', text: 'Tick through 25+ checks and watch your launch-readiness meter fill up.', grad: 'from-indigo-500 to-violet-500', isNew: true },
  { icon: GraduationCap, title: 'Security Academy', text: 'Quiz yourself, earn a rank, and level up from Rookie to Auditor.', grad: 'from-fuchsia-500 to-pink-500', isNew: true },
];

function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-surface-50 dark:bg-surface-950 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionTitle eyebrow="Features" title="Everything you need to audit with confidence" sub="Scanning is just the start. SmartAudit also helps you learn, build and launch safer." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, text, grad, isNew }, i) => (
            <Reveal key={title} delay={(i % 4) * 90}>
              <div className="group relative h-full p-6 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300">
                {isNew && <span className="absolute top-4 right-4 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-white">New</span>}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg group-hover:rotate-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="mt-4 font-bold text-surface-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- how it works ---------- */

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Paste or upload', text: 'Drop a .sol file or paste code into the Monaco editor.', icon: Code2, grad: 'from-violet-500 to-fuchsia-500' },
    { n: '02', title: 'Get analyzed', text: 'Static rules plus AI review run together in seconds.', icon: Cpu, grad: 'from-cyan-500 to-blue-500' },
    { n: '03', title: 'Fix & learn', text: 'Apply suggested fixes and study the matching Learn Hub guide.', icon: Lock, grad: 'from-amber-500 to-orange-500' },
    { n: '04', title: 'Launch safely', text: 'Complete the checklist, export your PDF report and deploy.', icon: Rocket, grad: 'from-emerald-500 to-teal-500' },
  ];
  return (
    <section className="py-20 md:py-28 bg-white dark:bg-surface-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionTitle eyebrow="How it works" title="From code to confidence in four steps" />
        <div className="relative grid md:grid-cols-4 gap-8">
          <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 opacity-40" />
          {steps.map(({ n, title, text, icon: Icon, grad }, i) => (
            <Reveal key={n} delay={i * 120} className="relative text-center">
              <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <p className="mt-4 text-xs font-bold tracking-widest text-surface-400">{n}</p>
              <h3 className="font-bold text-lg text-surface-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- vulnerability explorer ---------- */

function VulnExplorer() {
  const [id, setId] = useState(VULNS[0].id);
  const [showFix, setShowFix] = useState(false);
  const v = VULNS.find((x) => x.id === id);

  return (
    <section id="vulns" className="py-20 md:py-28 bg-surface-50 dark:bg-surface-950 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionTitle eyebrow="Vulnerability explorer" title="Know your enemy" sub="Pick an exploit, see the vulnerable code, then flip the switch to see the fix." />
        <Reveal>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {VULNS.map((x) => (
              <button
                key={x.id}
                onClick={() => { setId(x.id); setShowFix(false); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${id === x.id ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg scale-105' : 'bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700 hover:border-violet-400'}`}
              >
                <span className="mr-1.5">{x.emoji}</span>{x.title}
              </button>
            ))}
          </div>

          <div key={v.id} className="grid lg:grid-cols-2 gap-6 rounded-2xl p-6 md:p-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl animate-fade-in">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{v.emoji}</span>
                <div>
                  <h3 className="text-2xl font-extrabold text-surface-900 dark:text-white">{v.title}</h3>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${SEV_STYLE[v.severity].badge}`}>{v.severity}</span>
                </div>
              </div>
              <p className="mt-4 text-surface-700 dark:text-surface-300">{v.summary}</p>
              <p className="mt-3 text-sm"><b className="text-red-600 dark:text-red-400">Impact:</b> <span className="text-surface-600 dark:text-surface-400">{v.impact}</span></p>
              <ul className="mt-4 space-y-2">
                {v.tips.map((t) => (
                  <li key={t} className="flex gap-2 text-sm text-surface-700 dark:text-surface-300"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />{t}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wide ${showFix ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {showFix ? '✓ Fixed version' : '✗ Vulnerable version'}
                </span>
                <button
                  onClick={() => setShowFix((s) => !s)}
                  className={`relative w-16 h-8 rounded-full transition-colors ${showFix ? 'bg-emerald-500' : 'bg-red-500'}`}
                  aria-label="Toggle fixed code"
                >
                  <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${showFix ? 'translate-x-8' : ''}`} />
                </button>
              </div>
              <pre className={`rounded-xl p-4 text-[13px] leading-6 font-mono overflow-auto bg-surface-950 text-surface-100 border-l-4 ${showFix ? 'border-emerald-500' : 'border-red-500'} min-h-[12rem]`}>
                <code>{showFix ? v.fixed : v.vulnerable}</code>
              </pre>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- toolkit ---------- */

function Toolkit() {
  const { user } = useAuth();
  const tools = [
    { icon: BookOpen, title: 'Learn Hub', text: 'Searchable exploit encyclopedia with before/after code.', to: '/learn', grad: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { icon: FileCode, title: 'Template Library', text: 'Copy audited-style starter contracts or scan them in one click.', to: '/templates', grad: 'from-pink-500 to-rose-500', bg: 'bg-pink-50 dark:bg-pink-500/10' },
    { icon: ListChecks, title: 'Deploy Checklist', text: 'Interactive launch-readiness meter that remembers your progress.', to: '/checklist', grad: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { icon: GraduationCap, title: 'Security Academy', text: '10-question quiz with streaks, ranks and instant explanations.', to: '/academy', grad: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ];
  return (
    <section id="toolkit" className="py-20 md:py-28 bg-white dark:bg-surface-900 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionTitle eyebrow="The toolkit" title="More than a scanner" sub="Four extra tools that live inside your SmartAudit workspace." />
        <div className="grid md:grid-cols-2 gap-6">
          {tools.map(({ icon: Icon, title, text, to, grad, bg }, i) => (
            <Reveal key={title} delay={(i % 2) * 120}>
              <Link to={user ? to : '/register'} className={`group flex gap-5 items-start p-6 rounded-2xl ${bg} border border-transparent hover:border-violet-300 dark:hover:border-violet-500/40 hover:-translate-y-1 hover:shadow-xl transition-all`}>
                <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-surface-900 dark:text-white flex items-center gap-2">{title} <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></h3>
                  <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">{text}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- faq ---------- */

const FAQ = [
  ['Is the live demo the real scanner?', 'The demo uses a small rule engine that runs in your browser so you can try it instantly. The full product adds 13+ analyzers, AI explanations, history and PDF reports.'],
  ['Which languages and versions are supported?', 'Solidity contracts of any version. Older pragmas (below 0.8) are flagged for missing overflow protection.'],
  ['Is my code kept private?', 'Demo code never leaves your browser. Scans you run after signing in are stored only in your account history, and you can delete them at any time.'],
  ['Can this replace a professional audit?', 'No. SmartAudit is a fast first line of defense that catches common issues early. For contracts holding significant value, pair it with a manual audit.'],
  ['Do the Learn Hub, Templates and Academy cost extra?', 'No. They are included with every account.'],
];

function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-20 md:py-28 bg-surface-50 dark:bg-surface-950 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <SectionTitle eyebrow="FAQ" title="Questions, answered" />
        <div className="space-y-3">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 60}>
              <div className={`rounded-xl border bg-white dark:bg-surface-900 transition-colors ${open === i ? 'border-violet-400 dark:border-violet-500/60' : 'border-surface-200 dark:border-surface-800'}`}>
                <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 text-left px-5 py-4">
                  <span className="font-semibold text-surface-900 dark:text-white">{q}</span>
                  <ChevronDown className={`w-5 h-5 text-violet-500 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden"><p className="px-5 pb-4 text-sm text-surface-600 dark:text-surface-400">{a}</p></div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- cta + footer ---------- */

function FinalCta() {
  const { user } = useAuth();
  return (
    <section className="px-4 md:px-6 py-16 bg-white dark:bg-surface-900">
      <Reveal>
        <div className="relative overflow-hidden max-w-5xl mx-auto rounded-3xl px-6 py-16 text-center bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-[length:200%_auto] animate-gradient shadow-2xl shadow-fuchsia-500/30">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 animate-float" />
          <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-amber-300/20 animate-float-slow" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-black text-white">Your next contract deserves a second pair of eyes</h2>
            <p className="mt-4 text-white/85 max-w-xl mx-auto">Create a free account and run your first scan in under a minute.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={user ? '/scanner' : '/register'} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-white text-violet-700 hover:scale-105 transition-transform shadow-xl">
                <Rocket className="w-5 h-5" /> {user ? 'Open scanner' : 'Create free account'}
              </Link>
              {!user && <Link to="/login" className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-white border-2 border-white/60 hover:bg-white/10">I already have an account</Link>}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-surface-500">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-surface-800 dark:text-surface-200">SmartAudit</span>
          <span>· AI smart contract security</span>
        </div>
        <div className="flex gap-5">
          <a href="#demo" className="hover:text-violet-600">Demo</a>
          <a href="#features" className="hover:text-violet-600">Features</a>
          <a href="#faq" className="hover:text-violet-600">FAQ</a>
          <Link to="/login" className="hover:text-violet-600">Log in</Link>
        </div>
        <p>© {new Date().getFullYear()} SmartAudit</p>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-100">
      <LandingNav />
      <Hero />
      <Marquee />
      <LiveDemo />
      <Stats />
      <Features />
      <HowItWorks />
      <VulnExplorer />
      <Toolkit />
      <FaqSection />
      <FinalCta />
      <Footer />
    </div>
  );
}

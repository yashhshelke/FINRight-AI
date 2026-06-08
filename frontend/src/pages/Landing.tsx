import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import {
    Shield, Zap, Brain, Target, TrendingUp,
    ArrowRight, Check, BarChart3, Lock, Sparkles,
    ChevronRight, PieChart, Wallet, Bot, FileText,
    Menu, X
} from 'lucide-react';

const C = {
    teal: '#003d3d',
    sage: '#cdface',
    rust: '#b05b36',
    cream: '#f5eee2',
    creamDark: '#ede3d3',
    charcoal: '#2a2b2f',
    muted: 'rgba(42,43,47,0.55)',
    border: 'rgba(42,43,47,0.1)',
    white: '#ffffff',
};

/* ── Animated counter ─────────────────── */
function Counter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
    const ref = useRef(null);
    const inV = useInView(ref, { once: true });
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!inV) return;
        let cur = 0; const step = end / 60;
        const t = setInterval(() => { cur = Math.min(cur + step, end); setN(Math.floor(cur)); if (cur >= end) clearInterval(t); }, 20);
        return () => clearInterval(t);
    }, [inV, end]);
    return <span ref={ref}>{prefix}{n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n}{suffix}</span>;
}

/* ── Features data ─────────────────────── */
const FEATURES = [
    { icon: Brain,      step: '01', title: 'AI Document Analysis',  desc: 'Upload any bank statement — instant expense summary, category breakdown, and personalised saving tips powered by AI.' },
    { icon: TrendingUp, step: '02', title: 'Financial Health Score', desc: 'A real-time 0–100 score across savings rate, spending habits, debt ratio, and goal progress.' },
    { icon: Target,     step: '03', title: 'Smart Goals Tracker',    desc: 'AI-calculated feasibility scores and milestone alerts to keep every saving goal on track.' },
    { icon: Shield,     step: '04', title: 'Risk Simulator',         desc: 'Stress-test income drops, job loss, or major purchases in real time before making any decision.' },
    { icon: PieChart,   step: '05', title: 'Spending Insights',      desc: 'Track categories, monthly trends, and merchant-level spend from a single beautiful dashboard.' },
    { icon: Bot,        step: '06', title: 'AI Financial Coach',     desc: 'Ask anything — get personalised advice on investments, savings, budgets, and more in plain English.' },
];

const HOW_IT_WORKS = [
    { n: '01', title: 'Connect your data', desc: 'Upload your bank statement PDF or UPI history. No login sharing required — your data stays private.' },
    { n: '02', title: 'AI analyses instantly', desc: 'Finexa categorises transactions, calculates your health score, and spots anomalies within seconds.' },
    { n: '03', title: 'Get your action plan', desc: 'Receive tailored recommendations, savings goals, and risk alerts you can act on immediately.' },
];

const TESTIMONIALS = [
    { name: 'Priya Sharma', role: 'Software Engineer, Bengaluru', quote: 'I saved ₹24,000 in the first two months just by following the AI suggestions. The health score keeps me accountable.', metric: '₹24K saved' },
    { name: 'Rahul Mehta', role: 'Freelancer, Mumbai', quote: 'The UPI analyser caught irregular merchant charges I had completely missed. Worth every rupee.', metric: '3 leaks found' },
    { name: 'Ananya Patel', role: 'Product Manager, Hyderabad', quote: 'Finexa is the first finance app that actually explains what to do instead of just showing charts.', metric: '94% health score' },
];

/* ════════════ MAIN LANDING ════════════ */
export default function Landing() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        const f = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', f, { passive: true });
        return () => window.removeEventListener('scroll', f);
    }, []);

    const bg   = isDark ? '#020c0c' : C.cream;
    const surf = isDark ? 'rgba(4,20,20,0.97)' : C.white;
    const bdr  = isDark ? 'rgba(45,212,191,0.12)' : C.border;
    const txt  = isDark ? '#f0fdf4' : C.charcoal;
    const mut  = isDark ? 'rgba(150,220,200,0.5)' : C.muted;

    return (
        <div style={{ background: bg, color: txt, fontFamily: 'Outfit, sans-serif' }}>

            {/* ═══ NAVBAR ═══ */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 transition-all duration-300"
                style={{
                    background: scrolled ? surf : 'transparent',
                    backdropFilter: scrolled ? 'blur(20px)' : 'none',
                    borderBottom: scrolled ? `1px solid ${bdr}` : '1px solid transparent',
                    boxShadow: scrolled ? '0 4px 20px rgba(42,43,47,0.06)' : 'none',
                }}>
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: C.teal }}>F</div>
                    <span className="font-display font-bold text-lg" style={{ color: isDark ? '#5eead4' : C.teal }}>Finexa AI</span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                    {[['How It Works', '/how-it-works'], ['Pricing', '/subscription'], ['FAQ', '/faq']].map(([l, h]) => (
                        <Link key={l} to={h} className="transition-colors hover:opacity-70" style={{ color: mut }}>{l}</Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    {user ? (
                        <Link to="/dashboard" className="btn text-xs px-4 py-2">
                            Dashboard <ArrowRight size={12} />
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="hidden sm:block text-sm font-medium transition-colors hover:opacity-70" style={{ color: mut }}>Log in</Link>
                            <Link to="/signup" className="btn-rust text-xs px-4 py-2 rounded-xl">
                                Start Free <ArrowRight size={12} />
                            </Link>
                        </>
                    )}
                    <button className="md:hidden p-2 rounded-xl" style={{ color: txt }}
                        onClick={() => setMobileMenu(v => !v)}>
                        {mobileMenu ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileMenu && (
                    <div className="absolute top-full left-0 right-0 p-4 space-y-2 md:hidden"
                        style={{ background: surf, borderBottom: `1px solid ${bdr}` }}>
                        {[['How It Works', '/how-it-works'], ['Pricing', '/subscription'], ['FAQ', '/faq'], ['Log In', '/login']].map(([l, h]) => (
                            <Link key={l} to={h} className="block px-4 py-2 rounded-xl text-sm font-medium"
                                style={{ color: txt }} onClick={() => setMobileMenu(false)}>{l}</Link>
                        ))}
                    </div>
                )}
            </nav>

            {/* ═══ HERO ═══ */}
            <section className="relative min-h-screen flex items-center overflow-hidden" style={{ paddingTop: 64 }}>

                {/* Background pattern */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 dots-bg" style={{ opacity: isDark ? 0.3 : 0.5 }} />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
                        style={{ background: isDark ? 'radial-gradient(circle, rgba(45,212,191,0.08), transparent 70%)' : 'radial-gradient(circle, rgba(0,61,61,0.06), transparent 70%)', transform: 'translate(20%, -20%)' }} />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
                        style={{ background: isDark ? 'radial-gradient(circle, rgba(176,91,54,0.07), transparent 70%)' : 'radial-gradient(circle, rgba(176,91,54,0.08), transparent 70%)', transform: 'translate(-30%, 30%)' }} />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                        {/* LEFT — text */}
                        <div>
                            {/* Eyebrow badge */}
                            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                                className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-xs font-semibold"
                                style={{ background: isDark ? 'rgba(45,212,191,0.1)' : 'rgba(0,61,61,0.07)', border: `1px solid ${isDark ? 'rgba(45,212,191,0.25)' : 'rgba(0,61,61,0.18)'}`, color: isDark ? '#5eead4' : C.teal }}>
                                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                                    className="w-1.5 h-1.5 rounded-full" style={{ background: isDark ? '#5eead4' : C.teal }} />
                                <Sparkles size={10} /> AI-Powered Financial Intelligence
                            </motion.div>

                            {/* Headline */}
                            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
                                className="font-display font-bold leading-tight mb-6"
                                style={{ fontSize: 'clamp(2.8rem, 5.5vw, 4.5rem)', color: isDark ? '#f0fdf4' : C.teal }}>
                                Your money,<br />
                                <em style={{ color: C.rust, fontStyle: 'italic' }}>intelligently</em><br />
                                managed.
                            </motion.h1>

                            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: mut }}>
                                AI-powered financial coaching — real-time health scoring, smart budgeting, risk simulations, and{' '}
                                <strong style={{ color: isDark ? '#5eead4' : C.teal }}>100,000 free AI credits</strong> from day one.
                            </motion.p>

                            {/* CTAs */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                                className="flex flex-wrap gap-3 mb-8">
                                <Link to="/signup" className="btn-rust text-sm px-7 py-3.5 rounded-xl font-semibold inline-flex items-center gap-2">
                                    Start Free — 100k Credits <ArrowRight size={15} />
                                </Link>
                                <Link to="/how-it-works" className="btn-outline text-sm px-7 py-3.5">
                                    See How It Works <ChevronRight size={15} />
                                </Link>
                            </motion.div>

                            {/* Trust badges */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
                                className="flex flex-wrap gap-5">
                                {[{ i: Lock, t: 'Bank-grade privacy' }, { i: Shield, t: 'No data selling' }, { i: Zap, t: 'No credit card' }].map(b => (
                                    <div key={b.t} className="flex items-center gap-1.5 text-xs" style={{ color: mut }}>
                                        <b.i size={11} style={{ color: isDark ? '#5eead4' : C.teal }} />{b.t}
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* RIGHT — dashboard preview card */}
                        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35, duration: 0.9, type: 'spring', stiffness: 70 }}
                            className="relative">

                            {/* Glow behind card */}
                            <div className="absolute -inset-8 rounded-3xl pointer-events-none"
                                style={{ background: isDark ? 'radial-gradient(ellipse at 50% 50%, rgba(0,61,61,0.3), transparent 70%)' : 'radial-gradient(ellipse at 50% 50%, rgba(0,61,61,0.12), transparent 70%)', filter: 'blur(30px)' }} />

                            {/* Card */}
                            <div className="relative rounded-3xl overflow-hidden"
                                style={{ background: C.teal, boxShadow: '0 24px 80px rgba(0,61,61,0.45)' }}>

                                {/* Header strip */}
                                <div className="p-6 pb-4">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                                                style={{ background: C.rust }}>A</div>
                                            <div>
                                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>Good morning 👋</p>
                                                <p className="text-sm font-semibold text-white">Aryan Sharma</p>
                                            </div>
                                        </div>
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center"
                                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                            <span className="text-xs text-white">🔔</span>
                                        </div>
                                    </div>

                                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Total Balance</p>
                                    <p className="font-display text-3xl font-bold text-white mb-1">₹2,84,350</p>
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                        style={{ background: 'rgba(205,250,206,0.15)', border: '1px solid rgba(205,250,206,0.25)', color: C.sage }}>
                                        ↗ +12.5%
                                    </span>

                                    <div className="flex gap-3 mt-4">
                                        {[['Income', '₹85,000', C.sage], ['Expenses', '₹24,470', '#f4a48a']].map(([l, v, c]) => (
                                            <div key={l} className="flex-1 rounded-xl p-3"
                                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</p>
                                                <p className="font-display text-sm font-bold" style={{ color: c }}>{v}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats area */}
                                <div className="rounded-t-2xl p-5" style={{ background: C.cream }}>
                                    <div className="flex gap-3 mb-4">
                                        {/* Mini gauge */}
                                        <div className="rounded-2xl p-4 flex-1" style={{ background: C.white, border: `1px solid ${C.border}` }}>
                                            <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>Financial Health</p>
                                            <div className="flex items-center gap-3">
                                                <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                                                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(42,43,47,0.1)" strokeWidth="5" />
                                                    <circle cx="22" cy="22" r="18" fill="none" stroke={C.teal} strokeWidth="5"
                                                        strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - 0.75)} strokeLinecap="round" />
                                                </svg>
                                                <div>
                                                    <p className="font-display text-xl font-bold" style={{ color: C.teal }}>75</p>
                                                    <p className="text-[9px]" style={{ color: C.rust }}>Good</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1">
                                            {[['Savings Rate', '32%'], ['Net Savings', '₹60K']].map(([l, v]) => (
                                                <div key={l} className="rounded-xl p-2.5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
                                                    <p className="text-[8px] uppercase tracking-wider" style={{ color: C.muted }}>{l}</p>
                                                    <p className="font-display text-sm font-bold" style={{ color: C.teal }}>{v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Transaction row */}
                                    {[{ n: 'Swiggy Order', c: 'Food', a: '-₹450', inc: false }, { n: 'Salary Credit', c: 'Income', a: '+₹85,000', inc: true }].map(t => (
                                        <div key={t.n} className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2"
                                            style={{ background: C.white, border: `1px solid ${C.border}` }}>
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ background: t.inc ? 'rgba(205,250,206,0.5)' : 'rgba(176,91,54,0.1)' }}>
                                                {t.inc ? <TrendingUp size={13} color={C.teal} /> : <Wallet size={13} color={C.rust} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-medium" style={{ color: C.charcoal }}>{t.n}</p>
                                                <p className="text-[9px]" style={{ color: C.muted }}>{t.c}</p>
                                            </div>
                                            <span className="text-xs font-bold" style={{ color: t.inc ? C.teal : C.rust }}>{t.a}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Floating AI bubble */}
                            <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute -bottom-4 -left-6 rounded-2xl px-4 py-3"
                                style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(42,43,47,0.15)' }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                        style={{ background: C.teal }}>
                                        <Bot size={12} color="white" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-semibold" style={{ color: C.charcoal }}>AI Insight 💡</p>
                                        <p className="text-[8px]" style={{ color: C.muted }}>Cut dining — save ₹2.4k/mo</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                    style={{ background: `linear-gradient(0deg, ${bg}, transparent)` }} />
            </section>

            {/* ═══ STATS BAR ═══ */}
            <div className="py-14 relative overflow-hidden"
                style={{ background: isDark ? 'rgba(4,20,20,0.9)' : C.white, borderTop: `1px solid ${bdr}`, borderBottom: `1px solid ${bdr}` }}>
                <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { e: 50, s: 'k+', l: 'Active Users' },
                        { e: 100, s: 'k', l: 'Free AI Credits' },
                        { e: 18, s: 'k avg', l: 'Monthly Savings' },
                        { e: 94, s: '%', l: 'Users Saving More' },
                    ].map(s => (
                        <div key={s.l}>
                            <div className="font-display font-black text-3xl mb-1" style={{ color: isDark ? '#5eead4' : C.teal }}>
                                <Counter end={s.e} suffix={s.s} prefix={s.l === 'Monthly Savings' ? '₹' : ''} />
                            </div>
                            <p className="text-xs font-medium" style={{ color: mut }}>{s.l}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ HOW IT WORKS ═══ */}
            <section className="py-24 relative overflow-hidden" id="how">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: C.rust }}>Simple by design</p>
                        <h2 className="font-display font-bold leading-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: isDark ? '#f0fdf4' : C.charcoal }}>
                            Getting started is{' '}
                            <em style={{ color: C.rust }}>easy</em>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {HOW_IT_WORKS.map((s, i) => (
                            <motion.div key={s.n}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="rounded-2xl p-8"
                                style={{ background: isDark ? 'rgba(4,22,22,0.9)' : C.white, border: `1px solid ${bdr}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 2px 16px rgba(42,43,47,0.06)' }}>
                                <p className="font-display font-bold text-3xl mb-5" style={{ color: C.rust }}>{s.n}</p>
                                <h3 className="font-display text-lg font-semibold mb-2" style={{ color: isDark ? '#f0fdf4' : C.charcoal }}>{s.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: mut }}>{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ FEATURES BENTO ═══ */}
            <section className="py-24 relative" id="features"
                style={{ background: isDark ? 'rgba(3,14,14,0.95)' : C.creamDark }}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: C.rust }}>Everything you need</p>
                        <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: isDark ? '#f0fdf4' : C.charcoal }}>
                            Powerful features.<br />
                            <span style={{ color: C.teal }}>Total financial control.</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f, i) => (
                            <motion.div key={f.title}
                                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                                className="group rounded-2xl p-6 transition-all duration-300"
                                style={{ background: isDark ? 'rgba(4,22,22,0.9)' : C.white, border: `1px solid ${bdr}`, boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.3)' : '0 2px 12px rgba(42,43,47,0.06)' }}>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                        style={{ background: isDark ? 'rgba(0,61,61,0.4)' : 'rgba(0,61,61,0.07)', border: `1px solid ${isDark ? 'rgba(45,212,191,0.2)' : 'rgba(0,61,61,0.12)'}` }}>
                                        <f.icon size={18} style={{ color: isDark ? '#5eead4' : C.teal }} />
                                    </div>
                                    <span className="font-display font-bold text-2xl" style={{ color: isDark ? 'rgba(45,212,191,0.15)' : 'rgba(0,61,61,0.08)' }}>{f.step}</span>
                                </div>
                                <h3 className="font-semibold mb-2" style={{ color: isDark ? '#f0fdf4' : C.charcoal }}>{f.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: mut }}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ TESTIMONIALS ═══ */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: C.rust }}>Real stories</p>
                        <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: isDark ? '#f0fdf4' : C.charcoal }}>
                            People who changed their <em style={{ color: C.rust }}>financial lives</em>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={t.name}
                                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="rounded-2xl p-6"
                                style={{ background: isDark ? 'rgba(4,22,22,0.9)' : C.white, border: `1px solid ${bdr}`, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 16px rgba(42,43,47,0.07)' }}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                                        style={{ background: [C.teal, C.rust, '#005f5f'][i] }}>
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: isDark ? '#f0fdf4' : C.charcoal }}>{t.name}</p>
                                        <p className="text-[11px]" style={{ color: mut }}>{t.role}</p>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed mb-5" style={{ color: mut }}>"{t.quote}"</p>
                                <div className="pt-4" style={{ borderTop: `1px solid ${bdr}` }}>
                                    <p className="font-display text-xl font-bold" style={{ color: isDark ? '#5eead4' : C.teal }}>{t.metric}</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: mut }}>Key result</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section className="py-28 relative overflow-hidden" style={{ background: C.teal }}>
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
                    style={{ background: 'rgba(205,250,206,0.06)', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
                    style={{ background: 'rgba(176,91,54,0.1)', transform: 'translate(-30%, 30%)' }} />

                <div className="relative max-w-3xl mx-auto px-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(205,250,206,0.6)' }}>Start today</p>
                    <h2 className="font-display font-bold text-white mb-6 leading-tight"
                        style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
                        Take control of your<br />
                        <em style={{ color: C.sage }}>financial future</em>
                    </h2>
                    <p className="text-base mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Join thousands of Indians building real wealth with AI — no credit card required.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                            style={{ background: C.rust, color: C.white, boxShadow: '0 8px 32px rgba(176,91,54,0.4)' }}>
                            Start Free — 100k Credits <ArrowRight size={15} />
                        </Link>
                        <Link to="/how-it-works" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: C.white }}>
                            Learn More <ChevronRight size={15} />
                        </Link>
                    </div>
                    <div className="flex justify-center gap-6 mt-8">
                        {[{ i: Lock, t: 'No credit card' }, { i: Shield, t: 'Privacy first' }, { i: Check, t: 'Free forever plan' }].map(b => (
                            <div key={b.t} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                <b.i size={11} color={C.sage} />{b.t}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className="py-14 px-6" style={{ background: isDark ? '#010a0a' : C.charcoal, color: 'rgba(255,255,255,0.5)' }}>
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                                style={{ background: C.rust }}>F</div>
                            <span className="font-display font-bold text-white">Finexa AI</span>
                            <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026</span>
                        </div>
                        <div className="flex gap-6 text-xs">
                            {[['How It Works', '/how-it-works'], ['Pricing', '/subscription'], ['FAQ', '/faq'], ['Sign In', '/login']].map(([l, h]) => (
                                <Link key={l} to={h} className="transition-colors hover:text-white">{l}</Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

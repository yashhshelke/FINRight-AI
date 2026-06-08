import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const C = {
    teal: '#003d3d',
    rust: '#b05b36',
    cream: '#f5eee2',
    charcoal: '#2a2b2f',
    muted: 'rgba(42,43,47,0.5)',
    border: 'rgba(42,43,47,0.12)',
};

function StrengthBar({ pwd }: { pwd: string }) {
    const s = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pwd)).length;
    const colors = ['transparent', '#dc2626', '#f59e0b', '#b05b36', '#003d3d'];
    if (!pwd) return null;
    return (
        <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4].map(i => (
                <motion.div key={i} className="h-1 flex-1 rounded-full"
                    animate={{ background: i <= s ? colors[s] : 'rgba(42,43,47,0.1)' }}
                    transition={{ duration: 0.25 }} />
            ))}
        </div>
    );
}

const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } } };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } };

export default function SignUp() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) return setError('Passwords do not match.');
        if (form.password.length < 8) return setError('Password must be at least 8 characters.');
        setLoading(true);
        const r = await signup(form.username, form.email, form.password);
        setLoading(false);
        if (r.success) navigate('/dashboard');
        else setError(r.error || 'Sign up failed. Please try again.');
    }

    return (
        <div className="min-h-screen flex" style={{ background: C.cream }}>
            {/* Left brand panel */}
            <div className="hidden lg:flex flex-col justify-between w-[42%] p-12 relative overflow-hidden"
                style={{ background: C.teal }}>
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/2 translate-x-1/2"
                    style={{ background: 'rgba(205,250,206,0.07)' }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-1/2 -translate-x-1/3"
                    style={{ background: 'rgba(176,91,54,0.12)' }} />

                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                        style={{ background: C.rust, color: '#fff' }}>F</div>
                    <span className="font-display text-xl font-bold text-white">Finexa AI</span>
                </div>

                <div className="relative z-10">
                    <h2 className="font-display text-4xl font-bold leading-tight text-white mb-6">
                        Start your<br />
                        <em className="not-italic" style={{ color: '#cdface' }}>financial</em><br />
                        journey.
                    </h2>
                    <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Join thousands of Indians who are growing their wealth with AI-powered insights.
                    </p>
                </div>

                <div className="space-y-3 relative z-10">
                    {[
                        '✓ 100,000 AI credits — free to start',
                        '✓ Real-time expense tracking',
                        '✓ Smart savings goals with AI suggestions',
                    ].map(f => (
                        <p key={f} className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{f}</p>
                    ))}
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full" style={{ maxWidth: 440 }}>

                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                            style={{ background: C.teal }}>F</div>
                        <span className="font-display text-lg font-bold" style={{ color: C.teal }}>Finexa AI</span>
                    </div>

                    <div className="rounded-2xl overflow-hidden"
                        style={{ background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 8px 40px rgba(42,43,47,0.1)' }}>

                        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.teal}, #005f5f, ${C.rust})` }} />

                        <motion.div className="px-8 pt-7 pb-8" variants={list} initial="hidden" animate="show">

                            <motion.div variants={item} className="mb-6">
                                <h1 className="font-display text-2xl font-bold mb-1" style={{ color: C.charcoal }}>
                                    Create account
                                </h1>
                                <p className="text-sm" style={{ color: C.muted }}>
                                    Start free — 100,000 AI credits included
                                </p>
                            </motion.div>

                            <form onSubmit={handleSubmit} className="space-y-3.5">
                                <motion.div variants={item}>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: C.muted }}>
                                        Username
                                    </label>
                                    <input type="text" className="field" placeholder="arjun_sharma"
                                        value={form.username} onChange={set('username')} required />
                                </motion.div>

                                <motion.div variants={item}>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: C.muted }}>
                                        Email
                                    </label>
                                    <input type="email" className="field" placeholder="you@example.com"
                                        value={form.email} onChange={set('email')} required />
                                </motion.div>

                                <motion.div variants={item}>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: C.muted }}>
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input type={showPwd ? 'text' : 'password'} className="field pr-10" placeholder="Min. 8 characters"
                                            value={form.password} onChange={set('password')} required />
                                        <button type="button" onClick={() => setShowPwd(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                                            style={{ color: C.muted }}>
                                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    <StrengthBar pwd={form.password} />
                                </motion.div>

                                <motion.div variants={item}>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: C.muted }}>
                                        Confirm password
                                    </label>
                                    <input type="password" className="field" placeholder="••••••••"
                                        value={form.confirm} onChange={set('confirm')} required />
                                </motion.div>

                                {error && (
                                    <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                        className="text-xs px-3 py-2.5 rounded-xl"
                                        style={{ color: '#dc2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                                        {error}
                                    </motion.p>
                                )}

                                <motion.div variants={item}>
                                    <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                        className="btn w-full py-3 text-sm font-semibold mt-1"
                                        disabled={loading}>
                                        {loading
                                            ? <div className="w-4 h-4 border-2 rounded-full animate-spin"
                                                style={{ borderColor: 'rgba(255,255,255,0.25)', borderTopColor: '#fff' }} />
                                            : <><span>Create Account</span><ArrowRight size={15} /></>}
                                    </motion.button>
                                </motion.div>
                            </form>

                            <motion.p variants={item} className="text-center text-sm mt-6" style={{ color: C.muted }}>
                                Already have an account?{' '}
                                <Link to="/login" className="font-semibold transition-colors hover:opacity-80"
                                    style={{ color: C.teal }}>
                                    Sign in
                                </Link>
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

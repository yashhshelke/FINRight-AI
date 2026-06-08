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

const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } } };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } };

export default function SignIn() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const r = await login(email, password);
        setLoading(false);
        if (r.success) navigate('/dashboard');
        else setError(r.error || 'Invalid email or password.');
    }

    return (
        <div className="min-h-screen flex" style={{ background: C.cream }}>
            {/* Left panel — brand */}
            <div className="hidden lg:flex flex-col justify-between w-[42%] p-12 relative overflow-hidden"
                style={{ background: C.teal }}>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/2 translate-x-1/2"
                    style={{ background: 'rgba(205,250,206,0.07)' }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-1/2 -translate-x-1/3"
                    style={{ background: 'rgba(176,91,54,0.12)' }} />

                {/* Logo */}
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                        style={{ background: C.rust, color: '#fff' }}>F</div>
                    <span className="font-display text-xl font-bold text-white">Finexa AI</span>
                </div>

                {/* Quote */}
                <div className="relative z-10">
                    <h2 className="font-display text-4xl font-bold leading-tight text-white mb-6">
                        Your money,<br />
                        <em className="not-italic" style={{ color: '#cdface' }}>intelligently</em><br />
                        managed.
                    </h2>
                    <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        AI-powered insights, smart budgeting, and real-time financial health — all in one place.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    {[
                        { label: 'Users saving more', value: '94%' },
                        { label: 'Avg. monthly savings', value: '₹18K' },
                    ].map(s => (
                        <div key={s.label} className="rounded-2xl p-4"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <div className="font-display text-2xl font-bold text-white">{s.value}</div>
                            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full" style={{ maxWidth: 420 }}>

                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                            style={{ background: C.teal }}>F</div>
                        <span className="font-display text-lg font-bold" style={{ color: C.teal }}>Finexa AI</span>
                    </div>

                    {/* Card */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 8px 40px rgba(42,43,47,0.1)' }}>

                        {/* Teal top strip */}
                        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.teal}, #005f5f, ${C.rust})` }} />

                        <motion.div className="px-8 pt-7 pb-8" variants={list} initial="hidden" animate="show">

                            <motion.div variants={item} className="mb-6">
                                <h1 className="font-display text-2xl font-bold mb-1" style={{ color: C.charcoal }}>
                                    Welcome back
                                </h1>
                                <p className="text-sm" style={{ color: C.muted }}>
                                    Sign in to continue to your dashboard
                                </p>
                            </motion.div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <motion.div variants={item}>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: C.muted }}>
                                        Email
                                    </label>
                                    <input type="email" className="field" placeholder="you@example.com"
                                        value={email} onChange={e => setEmail(e.target.value)} required />
                                </motion.div>

                                <motion.div variants={item}>
                                    <div className="flex justify-between mb-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
                                            Password
                                        </label>
                                        <Link to="/forgot-password" className="text-xs font-medium transition-colors hover:opacity-80"
                                            style={{ color: C.rust }}>
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <input type={showPwd ? 'text' : 'password'} className="field pr-10" placeholder="••••••••"
                                            value={password} onChange={e => setPassword(e.target.value)} required />
                                        <button type="button" onClick={() => setShowPwd(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                                            style={{ color: C.muted }}>
                                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
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
                                            : <><span>Sign In</span><ArrowRight size={15} /></>}
                                    </motion.button>
                                </motion.div>
                            </form>

                            <motion.p variants={item} className="text-center text-sm mt-6" style={{ color: C.muted }}>
                                No account?{' '}
                                <Link to="/signup" className="font-semibold transition-colors hover:opacity-80"
                                    style={{ color: C.teal }}>
                                    Sign up free
                                </Link>
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

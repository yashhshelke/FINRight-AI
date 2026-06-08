import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, ListOrdered, Trophy, MessageCircle,
    Settings, LogOut, Bell, ChevronLeft, ChevronRight,
    Menu, Sparkles, X, Plus, AlertCircle, CheckCircle,
    Info, Clock, TrendingUp, Target, PieChart, Wallet,
    FileText, Shield, BookOpen, Zap, UploadCloud
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { NotificationsAPI, HealthAPI } from '../lib/api';

const C = {
    teal: '#003d3d',
    sage: '#cdface',
    rust: '#b05b36',
    cream: '#f5eee2',
    charcoal: '#2a2b2f',
    white: '#ffffff',
    border: 'rgba(42,43,47,0.1)',
    muted: 'rgba(42,43,47,0.45)',
};

const navItems = [
    { to: '/dashboard',              icon: LayoutDashboard, label: 'Overview',    end: true  },
    { to: '/dashboard/transactions', icon: ListOrdered,     label: 'Transactions'            },
    { to: '/dashboard/goals',        icon: Target,          label: 'Goals'                   },
    { to: '/dashboard/habits',       icon: Trophy,          label: 'Challenges'              },
    { to: '/dashboard/coach',        icon: MessageCircle,   label: 'AI Coach'                },
    { to: '/dashboard/spending',     icon: PieChart,        label: 'Spending'                },
    { to: '/dashboard/budget',       icon: Zap,             label: 'Budget'                  },
    { to: '/dashboard/wallet',       icon: Wallet,          label: 'Wallet'                  },
    { to: '/dashboard/settings',     icon: Settings,        label: 'Settings'                },
];

/* ── Financial Health Score Pill ─────────────────────── */
function FinScorePill() {
    const { isDark } = useTheme();
    const [score, setScore] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        HealthAPI.getScore()
            .then(d => { if (!cancelled) setScore(d.score ?? 0); })
            .catch(() => { if (!cancelled) setScore(0); });
        return () => { cancelled = true; };
    }, []);

    const s = score ?? 0;
    const color = s >= 70 ? { r: '22', g: '163', b: '74', text: '#15803d' }
                : s >= 40 ? { r: '180', g: '83',  b: '9',  text: '#b45309' }
                :           { r: '220', g: '38',  b: '38', text: '#dc2626' };
    const rgb = `${color.r},${color.g},${color.b}`;

    return (
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{
                background: `rgba(${rgb},0.08)`,
                border: `1px solid rgba(${rgb},0.22)`,
                color: color.text,
            }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: color.text }} />
            <span className="opacity-75">Fin Score</span>
            <span className="font-bold">{score !== null ? s : '…'}</span>
        </div>
    );
}

/* ── Notifications ───────────────────────────────────── */
type NotifItem = { id: number; type: 'warning' | 'success' | 'info'; title: string; body: string; time: string; read: boolean; };
const notifIcon  = { warning: AlertCircle, success: CheckCircle, info: Info };
const notifColor = { warning: '#b45309',  success: '#15803d',  info: '#2563eb' };

function mapNotifType(t: string): 'warning' | 'success' | 'info' {
    if (t === 'warning') return 'warning';
    if (t === 'success' || t === 'goal') return 'success';
    return 'info';
}
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function NotifPanel({ open, onClose, onCountChange }: { open: boolean; onClose: () => void; onCountChange?: (n: number) => void }) {
    const [notifs, setNotifs] = useState<NotifItem[]>([]);
    const [loading, setLoading] = useState(false);
    const unread = notifs.filter(n => !n.read).length;

    const fetchNotifs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await NotificationsAPI.list();
            const arr = Array.isArray(data) ? data : (data as any)?.results ?? [];
            const mapped: NotifItem[] = arr.map((n: any) => ({
                id: n.id, type: mapNotifType(n.notification_type),
                title: n.title, body: n.message,
                time: timeAgo(n.created_at), read: n.is_read,
            }));
            setNotifs(mapped);
            onCountChange?.(mapped.filter(n => !n.read).length);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [onCountChange]);

    useEffect(() => { if (open) fetchNotifs(); }, [open, fetchNotifs]);
    useEffect(() => { fetchNotifs(); }, []);

    async function markAll() {
        try { await NotificationsAPI.markAllRead(); setNotifs(n => n.map(x => ({ ...x, read: true }))); onCountChange?.(0); } catch { /* */ }
    }
    async function dismiss(id: number) {
        try {
            await NotificationsAPI.deleteNotif(id);
            setNotifs(prev => { const next = prev.filter(x => x.id !== id); onCountChange?.(next.filter(n => !n.read).length); return next; });
        } catch { /* */ }
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, x: 16, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 16, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="fixed right-4 top-16 z-50 w-80 overflow-hidden"
                        style={{
                            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                            background: C.white, border: `1px solid ${C.border}`,
                            borderRadius: 20, boxShadow: '0 16px 48px rgba(42,43,47,0.18)',
                        }}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                            <div className="flex items-center gap-2">
                                <Bell size={15} style={{ color: C.teal }} />
                                <span className="font-semibold text-sm" style={{ color: C.charcoal }}>Notifications</span>
                                {unread > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: C.teal, color: C.white }}>
                                        {unread}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unread > 0 && (
                                    <button onClick={markAll} className="text-xs px-2 py-1 rounded-lg transition-colors"
                                        style={{ color: C.teal }}>Mark all read</button>
                                )}
                                <button onClick={onClose} className="btn-ghost p-1.5"><X size={14} /></button>
                            </div>
                        </div>
                        {/* Body */}
                        <div className="overflow-y-auto flex-1">
                            {loading ? (
                                <div className="py-10 text-center text-sm" style={{ color: C.muted }}>Loading…</div>
                            ) : notifs.length === 0 ? (
                                <div className="py-10 text-center text-sm" style={{ color: C.muted }}>All caught up! 🎉</div>
                            ) : notifs.map(n => {
                                const Icon = notifIcon[n.type];
                                const color = notifColor[n.type];
                                return (
                                    <motion.div key={n.id} layout exit={{ opacity: 0, height: 0 }}
                                        className="flex gap-3 p-4 transition-all"
                                        style={{ background: n.read ? 'transparent' : 'rgba(0,61,61,0.03)', borderBottom: `1px solid ${C.border}` }}>
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                            style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
                                            <Icon size={13} style={{ color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-semibold" style={{ color: C.charcoal }}>{n.title}</p>
                                                {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: C.teal }} />}
                                            </div>
                                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: C.muted }}>{n.body}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] flex items-center gap-1" style={{ color: C.muted }}><Clock size={9} />{n.time}</span>
                                                <button onClick={() => dismiss(n.id)} className="text-[10px] transition-colors hover:text-red-500" style={{ color: C.muted }}>Dismiss</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/* ── Main Layout ─────────────────────────────────────── */
export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const aiCredits = user?.ai_credits ?? 0;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadNotifs, setUnreadNotifs] = useState(0);

    const credPct = Math.min(100, (aiCredits / 100000) * 100);
    const initials = (user?.first_name || user?.username || 'U').charAt(0).toUpperCase();

    const sidebarBg = isDark ? 'rgba(4,20,20,0.98)' : C.white;
    const sidebarBorder = isDark ? '1px solid rgba(45,212,191,0.1)' : `1px solid ${C.border}`;

    const SidebarContent = () => (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 px-4 py-5 flex-shrink-0"
                style={{ borderBottom: `1px solid ${isDark ? 'rgba(45,212,191,0.1)' : C.border}` }}>
                <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1.5 rounded-full opacity-50"
                        style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(45,212,191,0.4)' : 'rgba(0,61,61,0.3)'}, transparent 70%)`, filter: 'blur(5px)', animation: 'glowPulse 3s ease-in-out infinite' }} />
                    <div className="relative w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: C.teal, boxShadow: '0 2px 12px rgba(0,61,61,0.4)' }}>
                        F
                    </div>
                </div>
                {!collapsed && (
                    <div>
                        <span className="font-display font-bold text-lg leading-none" style={{ color: isDark ? '#5eead4' : C.teal }}>
                            Finexa
                        </span>
                        <span className="text-xs font-medium ml-1" style={{ color: isDark ? 'rgba(150,220,200,0.5)' : C.muted }}>AI</span>
                    </div>
                )}
            </Link>

            {/* AI Credits */}
            {!collapsed && (
                <div className="mx-3 mt-3 mb-1 p-3 rounded-xl"
                    style={{ background: isDark ? 'rgba(45,212,191,0.07)' : 'rgba(0,61,61,0.05)', border: `1px solid ${isDark ? 'rgba(45,212,191,0.15)' : 'rgba(0,61,61,0.12)'}` }}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={11} style={{ color: isDark ? '#5eead4' : C.teal }} />
                            <span className="text-xs font-semibold" style={{ color: isDark ? '#5eead4' : C.teal }}>AI Credits</span>
                        </div>
                        <button onClick={() => navigate('/subscription')}
                            className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all"
                            style={{ background: isDark ? 'rgba(45,212,191,0.15)' : 'rgba(0,61,61,0.1)', color: isDark ? '#5eead4' : C.teal }}>
                            <Plus size={9} /> Buy
                        </button>
                    </div>
                    <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-bold" style={{ color: isDark ? '#f0fdf4' : C.charcoal }}>{aiCredits.toLocaleString()}</span>
                        <span className="text-[10px]" style={{ color: C.muted }}>{credPct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(45,212,191,0.1)' : 'rgba(0,61,61,0.08)' }}>
                        <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${credPct}%` }} transition={{ duration: 0.8 }}
                            style={{ background: credPct > 20 ? C.teal : C.rust }} />
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
                {navItems.map(item => (
                    <NavLink key={item.to} to={item.to} end={item.end}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                        onClick={() => setMobileOpen(false)}>
                        <item.icon size={16} className="flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-2 pt-2 pb-4 flex-shrink-0"
                style={{ borderTop: `1px solid ${isDark ? 'rgba(45,212,191,0.1)' : C.border}` }}>
                {!collapsed && (
                    <div className="flex items-center gap-3 px-2 py-2 mb-2">
                        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: C.rust }}>
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-semibold truncate" style={{ color: isDark ? '#f0fdf4' : C.charcoal }}>
                                {user?.username || 'User'}
                            </div>
                            <div className="text-[10px] truncate" style={{ color: C.muted }}>{user?.email || ''}</div>
                        </div>
                    </div>
                )}
                <button onClick={() => { logout(); navigate('/'); }}
                    className={`nav-item w-full hover:!bg-red-50 hover:!text-red-600 ${collapsed ? 'justify-center px-0' : ''}`}
                    style={{ color: 'rgba(220,38,38,0.6)' }}>
                    <LogOut size={15} className="flex-shrink-0" />
                    {!collapsed && <span className="text-xs font-semibold">Sign Out</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex" style={{ background: isDark ? '#020c0c' : C.cream }}>
            {/* Desktop Sidebar */}
            <motion.aside animate={{ width: collapsed ? 60 : 228 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen z-10"
                style={{ background: sidebarBg, borderRight: sidebarBorder }}>
                <SidebarContent />
                <button onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-20"
                    style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(42,43,47,0.12)' }}>
                    {collapsed
                        ? <ChevronRight size={11} style={{ color: C.teal }} />
                        : <ChevronLeft size={11} style={{ color: C.teal }} />}
                </button>
            </motion.aside>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" />
                        <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                            transition={{ type: 'tween', duration: 0.22 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-60 flex flex-col md:hidden"
                            style={{ background: sidebarBg, borderRight: sidebarBorder }}>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="flex items-center justify-between px-5 py-3.5 flex-shrink-0 sticky top-0 z-30"
                    style={{
                        background: isDark ? 'rgba(4,20,20,0.97)' : C.white,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderBottom: `1px solid ${isDark ? 'rgba(45,212,191,0.1)' : C.border}`,
                        boxShadow: isDark
                            ? '0 1px 0 rgba(45,212,191,0.08), 0 8px 32px rgba(0,0,0,0.4)'
                            : '0 1px 0 rgba(42,43,47,0.06), 0 4px 16px rgba(42,43,47,0.04)',
                    }}>

                    {/* Teal accent line at bottom of header */}
                    <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,61,61,0.4) 25%, rgba(0,77,77,0.6) 50%, rgba(0,61,61,0.4) 75%, transparent 100%)' }} />

                    <div className="flex items-center gap-3">
                        <button className="md:hidden btn-ghost p-2" onClick={() => setMobileOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:block">
                            <p className="font-display text-sm font-semibold" style={{ color: isDark ? '#f0fdf4' : C.charcoal }}>
                                {(() => {
                                    const h = new Date().getHours();
                                    const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
                                    return `${greeting}, ${user?.first_name || user?.username?.split('_')[0] || 'there'} 👋`;
                                })()}
                            </p>
                            <p className="text-[11px]" style={{ color: C.muted }}>Your financial dashboard</p>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                        {/* Credits pill */}
                        <button onClick={() => navigate('/subscription')}
                            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                            style={{
                                background: isDark ? 'rgba(45,212,191,0.08)' : 'rgba(0,61,61,0.06)',
                                border: `1px solid ${isDark ? 'rgba(45,212,191,0.2)' : 'rgba(0,61,61,0.15)'}`,
                                color: isDark ? '#5eead4' : C.teal,
                            }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: isDark ? '#5eead4' : C.teal }} />
                            <Sparkles size={11} />
                            {aiCredits >= 1000 ? `${(aiCredits / 1000).toFixed(0)}k` : aiCredits} credits
                        </button>

                        <FinScorePill />

                        <ThemeToggle size="sm" />

                        {/* Notifications */}
                        <button onClick={() => setNotifOpen(!notifOpen)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center relative transition-all duration-200"
                            style={{
                                background: notifOpen ? 'rgba(0,61,61,0.12)' : 'rgba(0,61,61,0.04)',
                                border: `1px solid ${notifOpen ? 'rgba(0,61,61,0.4)' : C.border}`,
                            }}>
                            <Bell size={15} style={{ color: notifOpen ? C.teal : C.muted }} />
                            {unreadNotifs > 0 && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                                    style={{ background: C.rust }} />
                            )}
                        </button>

                        {/* Avatar */}
                        <button onClick={() => navigate('/dashboard/settings')}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white transition-all duration-200"
                            style={{ background: C.rust, boxShadow: '0 2px 12px rgba(176,91,54,0.4)' }}>
                            {initials}
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-5 lg:p-6"
                    style={{ background: isDark ? '#020c0c' : C.cream }}>
                    <Outlet />
                </main>
            </div>

            <NotifPanel open={notifOpen} onClose={() => setNotifOpen(false)} onCountChange={setUnreadNotifs} />
        </div>
    );
}

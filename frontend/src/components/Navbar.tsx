import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const C = {
    teal: '#003d3d',
    rust: '#b05b36',
    cream: '#f5eee2',
    charcoal: '#2a2b2f',
    muted: 'rgba(42,43,47,0.55)',
    border: 'rgba(42,43,47,0.1)',
};

export default function Navbar() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const f = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', f, { passive: true });
        return () => window.removeEventListener('scroll', f);
    }, []);

    const surf = isDark ? 'rgba(4,20,20,0.97)' : '#ffffff';
    const bdr  = isDark ? 'rgba(45,212,191,0.12)' : C.border;
    const mut  = isDark ? 'rgba(150,220,200,0.55)' : C.muted;
    const logoColor = isDark ? '#5eead4' : C.teal;

    return (
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
                <span className="font-display font-bold text-lg" style={{ color: logoColor }}>Finexa AI</span>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-5 text-sm font-medium">
                {[['How It Works', '/how-it-works'], ['Pricing', '/subscription'], ['FAQ', '/faq']].map(([l, h]) => (
                    <Link key={l} to={h} className="transition-colors hover:opacity-70" style={{ color: mut }}>{l}</Link>
                ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
                <ThemeToggle size="sm" />
                {user ? (
                    <Link to="/dashboard" className="btn text-xs px-4 py-2">
                        Dashboard <ArrowRight size={12} />
                    </Link>
                ) : (
                    <>
                        <Link to="/login" className="hidden sm:block text-sm font-medium transition-colors hover:opacity-70" style={{ color: mut }}>Log in</Link>
                        <Link to="/signup" className="btn-rust text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 font-semibold text-white">
                            Start Free <ArrowRight size={12} />
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

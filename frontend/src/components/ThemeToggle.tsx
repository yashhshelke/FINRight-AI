import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const C = {
    teal: '#003d3d',
    tealMid: '#004f4f',
    cream: '#f5eee2',
    rust: '#b05b36',
    border: 'rgba(42,43,47,0.14)',
};

export default function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
    const { isDark, toggle } = useTheme();
    const isSmall = size === 'sm';

    const trackW  = isSmall ? 48 : 54;
    const trackH  = isSmall ? 26 : 30;
    const knobSize = isSmall ? 20 : 24;
    const pad      = (trackH - knobSize) / 2;
    const knobX    = isDark ? trackW - knobSize - pad : pad;

    return (
        <motion.button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                width: trackW,
                height: trackH,
                borderRadius: 9999,
                flexShrink: 0,
                cursor: 'pointer',
                outline: 'none',
                border: 'none',
                padding: 0,
                transition: 'background 0.35s ease, box-shadow 0.35s ease',
                ...(isDark ? {
                    background: 'linear-gradient(135deg, #031212 0%, #042020 60%, #053030 100%)',
                    boxShadow: '0 0 0 1px rgba(45,212,191,0.3), 0 2px 12px rgba(0,61,61,0.5)',
                } : {
                    background: C.cream,
                    boxShadow: `0 0 0 1.5px ${C.border}, 0 2px 8px rgba(42,43,47,0.08)`,
                }),
            }}
        >
            {/* Track decoration */}
            <AnimatePresence>
                {isDark && (
                    <motion.span key="stars"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            left: pad + 2,
                            right: knobSize + pad * 2 + 2,
                            top: 0, bottom: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 3, pointerEvents: 'none',
                        }}>
                        {[2, 1.5, 2].map((s, i) => (
                            <span key={i} style={{
                                width: s, height: s, borderRadius: '50%',
                                background: 'rgba(45,212,191,0.6)', flexShrink: 0,
                            }} />
                        ))}
                    </motion.span>
                )}
                {!isDark && (
                    <motion.span key="lines"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            left: knobSize + pad * 2 + 2,
                            right: 6, top: 0, bottom: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none',
                        }}>
                        {[6, 4, 6].map((h, i) => (
                            <span key={i} style={{
                                width: 1.5, height: h, borderRadius: 2,
                                background: 'rgba(0,61,61,0.22)',
                                marginLeft: i > 0 ? 3 : 0, flexShrink: 0,
                            }} />
                        ))}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Knob */}
            <motion.span
                animate={{ x: knobX }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{
                    position: 'absolute',
                    top: pad, left: 0,
                    width: knobSize, height: knobSize,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2,
                    ...(isDark ? {
                        background: 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)',
                        boxShadow: '0 2px 10px rgba(45,212,191,0.55)',
                    } : {
                        background: C.teal,
                        boxShadow: '0 2px 8px rgba(0,61,61,0.4)',
                    }),
                }}>
                <AnimatePresence mode="wait">
                    <motion.span key={isDark ? 'moon' : 'sun'}
                        initial={{ scale: 0.4, opacity: 0, rotate: isDark ? -60 : 60 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isDark
                            ? <Moon size={isSmall ? 11 : 13} style={{ color: '#ffffff', strokeWidth: 2 }} />
                            : <Sun  size={isSmall ? 11 : 13} style={{ color: '#ffffff', strokeWidth: 2.5 }} />
                        }
                    </motion.span>
                </AnimatePresence>
            </motion.span>
        </motion.button>
    );
}

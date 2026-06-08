import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
    isDark: boolean;
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    theme: 'light',
    setTheme: () => {},
    toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
        const stored = localStorage.getItem('finexa_theme');
        if (stored === 'dark') return 'dark';
        if (stored === 'light') return 'light';
        // Default to light (warm cream) mode
        return 'light';
    });

    useEffect(() => {
        // Remove both classes first
        document.documentElement.classList.remove('light', 'dark', 'emerald');
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        }
        // light = no class (default CSS vars apply)
        localStorage.setItem('finexa_theme', theme);
    }, [theme]);

    function toggle() {
        setThemeState(t => t === 'dark' ? 'light' : 'dark');
    }

    function setTheme(t: 'dark' | 'light') {
        setThemeState(t);
    }

    return (
        <ThemeContext.Provider value={{ isDark: theme === 'dark', theme, setTheme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

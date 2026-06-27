import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: (localStorage.getItem('theme') as Theme) || 'dark',

    toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        document.documentElement.className = newTheme;
        set({ theme: newTheme });
    },

    setTheme: (theme: Theme) => {
        localStorage.setItem('theme', theme);
        document.documentElement.className = theme;
        set({ theme });
    },
}));

// Initialize theme on load
const savedTheme = localStorage.getItem('theme') as Theme || 'dark';
document.documentElement.className = savedTheme;

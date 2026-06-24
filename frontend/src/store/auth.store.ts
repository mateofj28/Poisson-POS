import { create } from 'zustand';
import { MeResponse } from '../types';

interface AuthState {
    token: string | null;
    employee: MeResponse | null;
    isAuthenticated: boolean;
    setAuth: (token: string, employee: MeResponse) => void;
    setEmployee: (employee: MeResponse) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('access_token'),
    employee: null,
    isAuthenticated: !!localStorage.getItem('access_token'),

    setAuth: (token: string, employee: MeResponse) => {
        localStorage.setItem('access_token', token);
        set({ token, employee, isAuthenticated: true });
    },

    setEmployee: (employee: MeResponse) => {
        set({ employee });
    },

    logout: () => {
        localStorage.removeItem('access_token');
        set({ token: null, employee: null, isAuthenticated: false });
    },
}));

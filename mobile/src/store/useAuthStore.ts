import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    email: string;
    level: number;
    ecoScore?: number;
    carbonDebt?: number;
    totalTreesPlanted?: number;
    oxygenContribution?: number;
    lifetimeCarbon?: number;
    treesToOffset?: number;
    createdAt?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    updateUser: (updates: Partial<User>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    setAuth: (user, token) => set({ user, token }),
    updateUser: (updates) =>
        set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
        })),
    logout: () => set({ user: null, token: null }),
}));

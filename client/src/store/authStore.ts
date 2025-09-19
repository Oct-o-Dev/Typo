// client/src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  username: string | null;
  userId: string | null; // <-- ADD THIS LINE
  isGuest: boolean;
  isLoggedIn: boolean;
  login: (token: string, username: string, userId: string, isGuest: boolean) => void; // <-- UPDATE THIS LINE
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      userId: null, // <-- ADD THIS LINE
      isGuest: false,
      isLoggedIn: false,
      login: (token, username, userId, isGuest) => set({ token, username, userId, isGuest, isLoggedIn: true }), // <-- UPDATE THIS LINE
      logout: () => set({ token: null, username: null, userId: null, isGuest: false, isLoggedIn: false }), // <-- UPDATE THIS LINE
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
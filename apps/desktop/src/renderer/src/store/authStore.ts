import { create } from 'zustand'

interface AuthState {
  user: { id: string; email: string } | null
  loading: boolean
  error: string | null
  setUser: (user: { id: string; email: string } | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  setUser: (user) => set({ user, error: null, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false })
}))

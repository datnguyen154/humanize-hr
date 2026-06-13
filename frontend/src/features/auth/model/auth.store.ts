import { create } from 'zustand'

import type { AuthUser } from '../types/auth.types'
import { authStorage } from './auth.storage'

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  isAuthRestoring: boolean
  setUser: (user: AuthUser) => void
  clearUser: () => void
  setAuthRestoring: (isAuthRestoring: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthRestoring: true,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: true,
      isAuthRestoring: false,
    })
  },

  clearUser: () => {
    set({
      user: null,
      isAuthenticated: false,
    })
  },

  setAuthRestoring: (isAuthRestoring) => {
    set({ isAuthRestoring })
  },

  logout: () => {
    authStorage.clearTokens()
    set({
      user: null,
      isAuthenticated: false,
      isAuthRestoring: false,
    })
  },
}))

import { create } from 'zustand'

import type { AuthUser } from '../types/auth.types'
import { authStorage } from './auth.storage'

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  clearUser: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: true,
    })
  },

  clearUser: () => {
    set({
      user: null,
      isAuthenticated: false,
    })
  },

  logout: () => {
    authStorage.clearTokens()
    set({
      user: null,
      isAuthenticated: false,
    })
  },
}))

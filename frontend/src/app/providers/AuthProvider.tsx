import { useEffect, type ReactNode } from 'react'

import { authStorage, getMe, useAuthStore } from '@/features/auth'

type AuthProviderProps = {
  children: ReactNode
}

let authRestorePromise: Promise<void> | null = null

const restoreAuthState = async () => {
  const accessToken = authStorage.getAccessToken()

  if (!accessToken) {
    useAuthStore.getState().clearUser()
    useAuthStore.getState().setAuthRestoring(false)
    return
  }

  try {
    const user = await getMe()

    useAuthStore.getState().setUser(user)
  } catch {
    authStorage.clearTokens()
    useAuthStore.getState().clearUser()
    useAuthStore.getState().setAuthRestoring(false)
  }
}

const initializeAuth = () => {
  authRestorePromise ??= restoreAuthState()

  return authRestorePromise
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    void initializeAuth()
  }, [])

  return children
}

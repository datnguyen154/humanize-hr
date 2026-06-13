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
  const isAuthRestoring = useAuthStore((state) => state.isAuthRestoring)

  useEffect(() => {
    void initializeAuth()
  }, [])

  if (isAuthRestoring) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-muted-foreground">
        Đang kiểm tra phiên đăng nhập...
      </main>
    )
  }

  return children
}

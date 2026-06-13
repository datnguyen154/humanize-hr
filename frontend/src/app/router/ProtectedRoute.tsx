import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthRestoring = useAuthStore((state) => state.isAuthRestoring)

  if (isAuthRestoring) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-muted-foreground">
        Đang kiểm tra phiên đăng nhập...
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

import { Loader2 } from 'lucide-react'
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
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div
          className="flex flex-col items-center gap-3 text-center text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">Đang xác thực phiên đăng nhập</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

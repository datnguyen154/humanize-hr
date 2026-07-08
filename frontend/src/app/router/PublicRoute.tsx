import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { getDashboardPathByRole, useAuthStore } from '@/features/auth'

type PublicRouteProps = {
  children: ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPathByRole(user.role)} replace />
  }

  return children
}

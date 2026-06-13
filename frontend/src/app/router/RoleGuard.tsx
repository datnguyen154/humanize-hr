import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import {
  getDashboardPathByRole,
  useAuthStore,
  type UserRole,
} from '@/features/auth'

type RoleGuardProps = {
  allowedRoles: UserRole[]
  children: ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPathByRole(user.role)} replace />
  }

  return children
}

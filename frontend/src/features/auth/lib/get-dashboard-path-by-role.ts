import type { UserRole } from '../types/auth.types'

const roleDashboardPath: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  EMPLOYEE: '/employee/dashboard',
}

export function getDashboardPathByRole(role: UserRole) {
  return roleDashboardPath[role]
}

import {
  CheckCircle2,
  FilePlus2,
  LogIn,
  LogOut,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import type { EmployeeDashboardActivityType } from '../types/employee-dashboard.types'

export const getActivityIcon = (
  type: EmployeeDashboardActivityType,
): LucideIcon => {
  const activityIconMap: Record<EmployeeDashboardActivityType, LucideIcon> = {
    CHECK_IN: LogIn,
    CHECK_OUT: LogOut,
    LEAVE_REQUEST_CREATED: FilePlus2,
    LEAVE_REQUEST_APPROVED: CheckCircle2,
    LEAVE_REQUEST_REJECTED: XCircle,
  }

  return activityIconMap[type]
}

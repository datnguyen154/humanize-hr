import type React from 'react'
import {
  Banknote,
  Building2,
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  Users,
} from 'lucide-react'

export type AdminNavigationItem = {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export const adminNavigationItems = [
  {
    label: 'Tổng quan',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Nhân viên',
    path: '/admin/employees',
    icon: Users,
  },
  {
    label: 'Phòng ban',
    path: '/admin/departments',
    icon: Building2,
  },
  {
    label: 'Chấm công',
    path: '/admin/attendance',
    icon: CalendarCheck,
  },
  {
    label: 'Nghỉ phép',
    path: '/admin/leave-requests',
    icon: ClipboardList,
  },
  {
    label: 'Bảng lương',
    path: '/admin/payroll',
    icon: Banknote,
  },
] satisfies AdminNavigationItem[]

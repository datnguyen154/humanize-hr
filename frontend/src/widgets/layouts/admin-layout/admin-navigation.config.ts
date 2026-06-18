export type AdminNavigationItem = {
  label: string
  path: string
}

export const adminNavigationItems = [
  {
    label: 'Tổng quan',
    path: '/admin/dashboard',
  },
  {
    label: 'Nhân viên',
    path: '/admin/employees',
  },
  {
    label: 'Phòng ban',
    path: '/admin/departments',
  },
  {
    label: 'Chấm công',
    path: '/admin/attendance',
  },
  {
    label: 'Nghỉ phép',
    path: '/admin/leave-requests',
  },
  {
    label: 'Bảng lương',
    path: '/admin/payroll',
  },
] satisfies AdminNavigationItem[]

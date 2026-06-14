import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'

const adminMenuItems = [
  { label: 'Tổng quan', path: '/admin/dashboard' },
  { label: 'Nhân viên', path: '/admin/employees' },
  { label: 'Phòng ban', path: '/admin/departments' },
  { label: 'Chấm công', path: '/admin/attendance' },
  { label: 'Nghỉ phép', path: '/admin/leaves' },
  { label: 'Bảng lương', path: '/admin/payroll' },
]

export function AdminSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card px-4 py-5 md:block">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">Humanize HR</p>
        <p className="mt-1 text-xs text-muted-foreground">Quản trị hệ thống</p>
      </div>

      <nav className="grid gap-1" aria-label="Menu quản trị">
        {adminMenuItems.map((item) => {
          const isActive = pathname === item.path

          return (
            <Button
              key={item.path}
              asChild
              type="button"
              variant={isActive ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Link to={item.path}>{item.label}</Link>
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}

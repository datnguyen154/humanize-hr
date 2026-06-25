import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'

const employeeMenuItems = [
  { label: 'Tổng quan', path: '/employee/dashboard' },
  { label: 'Hồ sơ cá nhân', path: '/employee/profile' },
  { label: 'Chấm công', path: '/employee/attendance' },
  { label: 'Đơn nghỉ phép', path: '/employee/leave-requests' },
]

export function EmployeeSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card px-4 py-5 md:block">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">Humanize HR</p>
        <p className="mt-1 text-xs text-muted-foreground">Cổng nhân viên</p>
      </div>

      <nav className="grid gap-1" aria-label="Menu nhân viên">
        {employeeMenuItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== '/employee/dashboard' &&
              pathname.startsWith(`${item.path}/`))

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

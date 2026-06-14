import { NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/button'

const adminMenuItems = [
  { label: 'Tổng quan', to: '/admin/dashboard' },
  { label: 'Nhân viên', to: '/admin/employees' },
  { label: 'Phòng ban', to: '/admin/dashboard' },
  { label: 'Chấm công', to: '/admin/dashboard' },
  { label: 'Nghỉ phép', to: '/admin/dashboard' },
  { label: 'Bảng lương', to: '/admin/dashboard' },
]

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card px-4 py-5 md:block">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">Humanize HR</p>
        <p className="mt-1 text-xs text-muted-foreground">Quản trị hệ thống</p>
      </div>

      <nav className="grid gap-1" aria-label="Menu quản trị">
        {adminMenuItems.map((item) => (
          <NavLink key={item.label} to={item.to}>
            {({ isActive }) => (
              <Button
                type="button"
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                {item.label}
              </Button>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

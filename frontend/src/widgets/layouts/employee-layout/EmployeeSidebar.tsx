import {
  CalendarDays,
  Clock3,
  LayoutDashboard,
  LogOut,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'

type EmployeeMenuItem = {
  label: string
  path: string
  icon: LucideIcon
}

const employeeMenuItems: EmployeeMenuItem[] = [
  {
    label: 'Tổng quan',
    path: '/employee/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Hồ sơ cá nhân',
    path: '/employee/profile',
    icon: UserRound,
  },
  {
    label: 'Chấm công',
    path: '/employee/attendance',
    icon: Clock3,
  },
  {
    label: 'Đơn nghỉ phép',
    path: '/employee/leave-requests',
    icon: CalendarDays,
  },
]

export function EmployeeSidebar() {
  const { pathname } = useLocation()
  const logout = useAuthStore((state) => state.logout)

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <UserRound className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary">
            Humanize HR
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Cổng nhân viên
          </p>
        </div>
      </div>

      <nav
        className="flex-1 space-y-1 px-3 py-4"
        aria-label="Điều hướng nhân viên"
      >
        {employeeMenuItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== '/employee/dashboard' &&
              pathname.startsWith(`${item.path}/`))
          const Icon = item.icon

          return (
            <Button
              key={item.path}
              asChild
              type="button"
              variant="ghost"
              className={cn(
                'relative h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
                isActive &&
                  'bg-primary/10 font-semibold text-primary hover:bg-primary/10 hover:text-primary',
              )}
            >
              <Link
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive ? (
                  <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-primary" />
                ) : null}
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </Button>
          )
        })}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </aside>
  )
}

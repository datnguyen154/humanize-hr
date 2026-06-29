import {
  CalendarDays,
  Clock3,
  KeyRound,
  LayoutDashboard,
  LogOut,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { SidebarBrand } from '@/components/ui/sidebar-brand'
import { useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'

type EmployeeSidebarProps = {
  variant?: 'desktop' | 'mobile'
  open?: boolean
  onClose?: () => void
}

type SidebarContentProps = {
  showCloseButton?: boolean
  onClose?: () => void
}

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
    label: 'Chấm công',
    path: '/employee/attendance',
    icon: Clock3,
  },
  {
    label: 'Nghỉ phép',
    path: '/employee/leave-requests',
    icon: CalendarDays,
  },
  {
    label: 'Hồ sơ cá nhân',
    path: '/employee/profile',
    icon: UserRound,
  },
  {
    label: 'Đổi mật khẩu',
    path: '/employee/change-password',
    icon: KeyRound,
  },
]

function SidebarContent({
  showCloseButton = false,
  onClose,
}: SidebarContentProps) {
  const { pathname } = useLocation()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    onClose?.()
    logout()
  }

  return (
    <>
      <SidebarBrand
        subtitle="Cổng nhân viên"
        action={
          showCloseButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-primary"
              aria-label="Đóng menu"
              title="Đóng menu"
              onClick={onClose}
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          ) : null
        }
      />

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
                onClick={onClose}
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
          onClick={handleLogout}
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </>
  )
}

export function EmployeeSidebar({
  variant = 'desktop',
  open = false,
  onClose,
}: EmployeeSidebarProps) {
  if (variant === 'mobile') {
    return (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-xl transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent showCloseButton onClose={onClose} />
      </aside>
    )
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <SidebarContent />
    </aside>
  )
}

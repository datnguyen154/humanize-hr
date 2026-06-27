import { Link, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'

export function EmployeeHeader() {
  const user = useAuthStore((state) => state.user)
  const { pathname } = useLocation()
  const isProfileActive =
    pathname === '/employee/profile' ||
    pathname.startsWith('/employee/profile/')
  const avatarFallback = user?.fullName
    ? user.fullName
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'NV'

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary">Humanize HR</p>
        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
          Không gian nhân viên
        </h1>
      </div>

      <Link
        to="/employee/profile"
        aria-current={isProfileActive ? 'page' : undefined}
        aria-label="Mở hồ sơ cá nhân"
        className={cn(
          'inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 sm:px-3',
          isProfileActive &&
            'border-primary/20 bg-primary/10 text-primary hover:bg-primary/10',
        )}
      >
        <span className="hidden sm:inline">Hồ sơ</span>
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {avatarFallback}
        </span>
      </Link>
    </header>
  )
}

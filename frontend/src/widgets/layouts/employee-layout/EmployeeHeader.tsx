import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HeaderProfileAction } from '@/components/ui/header-profile-action'
import { useAuthStore } from '@/features/auth'
import { NotificationBell } from '@/shared/components/NotificationBell'

type EmployeeHeaderProps = {
  onMenuClick?: () => void
}

export function EmployeeHeader({ onMenuClick }: EmployeeHeaderProps) {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-primary md:hidden"
          aria-label="Mở menu"
          title="Mở menu"
          onClick={onMenuClick}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">Humanize HR</p>
          <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
            Không gian nhân viên
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <HeaderProfileAction
          fullName={user?.fullName}
          fallback="NV"
          to="/employee/profile"
        />
      </div>
    </header>
  )
}

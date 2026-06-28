import { HeaderProfileAction } from '@/components/ui/header-profile-action'
import { useAuthStore } from '@/features/auth'

export function EmployeeHeader() {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary">Humanize HR</p>
        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
          Không gian nhân viên
        </h1>
      </div>

      <HeaderProfileAction
        fullName={user?.fullName}
        fallback="NV"
        to="/employee/profile"
      />
    </header>
  )
}

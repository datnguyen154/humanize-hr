import { HeaderProfileAction } from '@/components/ui/header-profile-action'
import { useAuthStore } from '@/features/auth'

export function EmployeeHeader() {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
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

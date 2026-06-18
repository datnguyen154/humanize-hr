import { useAuthStore } from '@/features/auth'

export function EmployeeHeader() {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div>
        <p className="text-sm font-semibold text-primary">Humanize HR</p>
        <h1 className="text-lg font-semibold text-foreground">
          Không gian nhân viên
        </h1>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium text-foreground">
          {user?.fullName ?? 'Người dùng'}
        </p>
        <p className="text-xs text-muted-foreground">
          Vai trò: {user?.role ?? 'Chưa xác định'}
        </p>
      </div>
    </header>
  )
}

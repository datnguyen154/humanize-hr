type EmployeeDashboardHeaderProps = {
  fullName?: string
}

export function EmployeeDashboardHeader({
  fullName,
}: EmployeeDashboardHeaderProps) {
  const displayName = fullName || 'Nhân viên'

  return (
    <header className="mb-4">
      <p className="text-sm font-semibold text-primary">Humanize HR</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        Không gian nhân viên
      </h2>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        Xin chào, {displayName}. Theo dõi chấm công, nghỉ phép và hồ sơ cá nhân
        của bạn.
      </p>
    </header>
  )
}

type EmployeeDashboardHeaderProps = {
  fullName?: string
}

export function EmployeeDashboardHeader({
  fullName,
}: EmployeeDashboardHeaderProps) {
  const displayName = fullName?.trim() || 'Nhân viên'

  return (
    <header className="mb-4">
      <h2 className="text-3xl font-bold tracking-tight text-foreground">
        👋 Chào mừng trở lại, {displayName}
      </h2>
      <p className="mt-2 max-w-2xl text-base text-muted-foreground">
        Theo dõi chấm công, nghỉ phép và hồ sơ cá nhân của bạn.
      </p>
    </header>
  )
}

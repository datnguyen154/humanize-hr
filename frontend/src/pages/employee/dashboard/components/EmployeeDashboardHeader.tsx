import type { ReactNode } from 'react'

type EmployeeDashboardHeaderProps = {
  fullName?: string
  children?: ReactNode
}

export function EmployeeDashboardHeader({
  fullName,
  children,
}: EmployeeDashboardHeaderProps) {
  const displayName = fullName?.trim() || 'Nhân viên'

  return (
    <header className="mb-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          👋 Chào mừng trở lại, {displayName}
        </h2>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          Theo dõi chấm công, nghỉ phép và hồ sơ cá nhân của bạn.
        </p>
      </div>

      {children}
    </header>
  )
}

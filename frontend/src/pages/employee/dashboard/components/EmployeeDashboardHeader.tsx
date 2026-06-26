import { CalendarCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

type EmployeeDashboardHeaderProps = {
  fullName?: string
}

export function EmployeeDashboardHeader({
  fullName,
}: EmployeeDashboardHeaderProps) {
  const displayName = fullName?.trim() || 'Nhân viên'

  return (
    <header className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          👋 Chào mừng trở lại, {displayName}
        </h2>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          Theo dõi chấm công, nghỉ phép và hồ sơ cá nhân của bạn.
        </p>
      </div>

      <Button asChild className="w-full shrink-0 gap-2 sm:w-auto">
        <Link to="/employee/attendance">
          <CalendarCheck className="size-4" aria-hidden="true" />
          Chấm công
        </Link>
      </Button>
    </header>
  )
}

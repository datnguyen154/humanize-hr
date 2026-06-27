import { Loader2, LogIn, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { AttendanceStatus } from '@/features/attendance/types/attendance.types'
import type { EmployeeDashboardWorkingStatus } from '@/features/dashboard/types/employee-dashboard.types'

type EmployeeAttendanceWidgetProps = {
  workingStatus: EmployeeDashboardWorkingStatus | undefined
  status: AttendanceStatus | null | undefined
  checkInTime: string | null | undefined
  checkOutTime: string | null | undefined
  isCheckingIn: boolean
  isCheckingOut: boolean
  onCheckIn: () => void
  onCheckOut: () => void
}

export function EmployeeAttendanceWidget({
  workingStatus = 'NOT_CHECKED_IN',
  isCheckingIn,
  isCheckingOut,
  onCheckIn,
  onCheckOut,
}: EmployeeAttendanceWidgetProps) {
  const isUpdating = isCheckingIn || isCheckingOut
  const hasCheckedIn = workingStatus !== 'NOT_CHECKED_IN'

  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors lg:w-[320px] lg:shrink-0">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Trạng thái hiện tại
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
          <span
            className={`size-2 shrink-0 rounded-full ${
              hasCheckedIn ? 'bg-primary' : 'bg-muted-foreground/50'
            }`}
            aria-hidden="true"
          />
          <span className="truncate">
            {hasCheckedIn ? 'Đã chấm công' : 'Chưa chấm công'}
          </span>
        </div>
      </div>

      {workingStatus === 'NOT_CHECKED_IN' ? (
        <Button
          type="button"
          size="sm"
          className="w-[132px] shrink-0"
          disabled={isUpdating}
          onClick={onCheckIn}
        >
          {isCheckingIn ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogIn className="size-4" aria-hidden="true" />
          )}
          {isCheckingIn ? 'Đang xử lý...' : 'Check In'}
        </Button>
      ) : null}

      {workingStatus === 'WORKING' ? (
        <Button
          type="button"
          size="sm"
          className="w-[132px] shrink-0"
          disabled={isUpdating}
          onClick={onCheckOut}
        >
          {isCheckingOut ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
          {isCheckingOut ? 'Đang xử lý...' : 'Check Out'}
        </Button>
      ) : null}

      {workingStatus === 'CHECKED_OUT' ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-[132px] shrink-0"
          disabled
        >
          Đã xong
        </Button>
      ) : null}
    </div>
  )
}

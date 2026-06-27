import { Clock3, Loader2, LogIn, LogOut } from 'lucide-react'

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

const workingStatusLabels: Record<EmployeeDashboardWorkingStatus, string> = {
  NOT_CHECKED_IN: 'Chưa chấm công',
  WORKING: 'Đã chấm công',
  CHECKED_OUT: 'Đã hoàn thành',
}

const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  PRESENT: 'Đúng giờ',
  LATE: 'Đi muộn',
}

const formatTime = (value: string | null | undefined) => {
  if (!value) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(new Date(value))
}

export function EmployeeAttendanceWidget({
  workingStatus = 'NOT_CHECKED_IN',
  status,
  checkInTime,
  checkOutTime,
  isCheckingIn,
  isCheckingOut,
  onCheckIn,
  onCheckOut,
}: EmployeeAttendanceWidgetProps) {
  const isUpdating = isCheckingIn || isCheckingOut

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:w-auto sm:min-w-[310px]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">
            {workingStatusLabels[workingStatus]}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {status ? attendanceStatusLabels[status] : 'Chưa có trạng thái'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>Vào: {formatTime(checkInTime)}</span>
        <span>Ra: {formatTime(checkOutTime)}</span>
      </div>

      {workingStatus === 'NOT_CHECKED_IN' ? (
        <Button
          type="button"
          size="sm"
          className="gap-2"
          disabled={isUpdating}
          onClick={onCheckIn}
        >
          {isCheckingIn ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogIn className="size-4" aria-hidden="true" />
          )}
          Check In
        </Button>
      ) : null}

      {workingStatus === 'WORKING' ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          disabled={isUpdating}
          onClick={onCheckOut}
        >
          {isCheckingOut ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-4" aria-hidden="true" />
          )}
          Check Out
        </Button>
      ) : null}

      {workingStatus === 'CHECKED_OUT' ? (
        <Button type="button" size="sm" variant="outline" disabled>
          Đã hoàn thành
        </Button>
      ) : null}
    </div>
  )
}

import { Loader2, LogIn, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
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

const attendanceStatusTones: Record<AttendanceStatus, StatusBadgeTone> = {
  PRESENT: 'success',
  LATE: 'warning',
}

const helperText: Record<EmployeeDashboardWorkingStatus, string> = {
  NOT_CHECKED_IN: 'Bạn chưa chấm công hôm nay.',
  WORKING: 'Bạn đang trong giờ làm việc. Vui lòng check out khi tan làm.',
  CHECKED_OUT: 'Bạn đã hoàn tất chấm công hôm nay.',
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
  const isCompleted = workingStatus === 'CHECKED_OUT'

  return (
    <div className="w-full rounded-xl border border-border bg-card p-4 shadow-sm transition-colors lg:w-[360px] lg:shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Trạng thái hiện tại
          </p>
          <div className="mt-2 flex items-center gap-2 text-base font-semibold text-foreground">
            <span
              className={`size-2 shrink-0 rounded-full ${
                workingStatus === 'NOT_CHECKED_IN'
                  ? 'bg-muted-foreground/50'
                  : 'bg-primary'
              }`}
              aria-hidden="true"
            />
            <span>{workingStatusLabels[workingStatus]}</span>
          </div>
        </div>

        {status ? (
          <StatusBadge
            label={attendanceStatusLabels[status]}
            tone={attendanceStatusTones[status]}
          />
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3">
        <div>
          <p className="text-xs text-muted-foreground">Vào</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatTime(checkInTime)}
          </p>
        </div>
        <div className="border-l border-border pl-3">
          <p className="text-xs text-muted-foreground">Ra</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatTime(checkOutTime)}
          </p>
        </div>
      </div>

      {workingStatus === 'NOT_CHECKED_IN' ? (
        <Button
          type="button"
          className="mt-3 h-9 w-full"
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
          className="mt-3 h-9 w-full"
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

      {isCompleted ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-3 h-9 w-full"
          disabled
        >
          Đã hoàn thành
        </Button>
      ) : null}

      <p className="mt-2 text-xs text-muted-foreground">
        {helperText[workingStatus]}
      </p>
    </div>
  )
}

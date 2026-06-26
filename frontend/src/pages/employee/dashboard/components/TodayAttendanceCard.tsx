import { CircleDot, LogIn, LogOut } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
import type { EmployeeDashboardTodayAttendance } from '@/features/dashboard/types/employee-dashboard.types'

import { createTodayAttendanceCardViewModel } from './employee-dashboard.mappers'

type TodayAttendanceCardProps = {
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined
}

const getCheckInStatusTone = (status: string): StatusBadgeTone => {
  if (status === 'Đã chấm công') {
    return 'success'
  }

  return 'neutral'
}

const getAttendanceResultTone = (status: string): StatusBadgeTone => {
  if (status === 'Đúng giờ') {
    return 'success'
  }

  if (status === 'Đi muộn') {
    return 'warning'
  }

  if (status === 'Vắng mặt') {
    return 'danger'
  }

  return 'neutral'
}

export function TodayAttendanceCard({
  todayAttendance,
}: TodayAttendanceCardProps) {
  const todayAttendanceCard =
    createTodayAttendanceCardViewModel(todayAttendance)

  const hasCheckedIn = Boolean(todayAttendance?.checkInTime)
  const hasCheckedOut = Boolean(todayAttendance?.checkOutTime)
  const checkInStatusLabel = hasCheckedIn ? 'Đã chấm công' : 'Chưa chấm công'
  const attendanceNote = hasCheckedOut
    ? 'Bạn đã hoàn tất chấm công hôm nay.'
    : hasCheckedIn
      ? 'Bạn đang trong giờ làm việc. Vui lòng chấm công ra khi tan làm.'
      : 'Bạn chưa chấm công hôm nay.'

  const attendanceItems = [
    {
      label: 'Trạng thái',
      value: (
        <div className="grid gap-2">
          <StatusBadge
            label={checkInStatusLabel}
            tone={getCheckInStatusTone(checkInStatusLabel)}
          />
          <div className="flex flex-wrap gap-2">
            <StatusBadge
              label={todayAttendanceCard.attendanceStatus}
              tone={getAttendanceResultTone(
                todayAttendanceCard.attendanceStatus,
              )}
            />
          </div>
        </div>
      ),
      icon: CircleDot,
    },
    {
      label: 'Giờ vào',
      value: todayAttendanceCard.checkInTime,
      icon: LogIn,
    },
    {
      label: 'Giờ ra',
      value: todayAttendanceCard.checkOutTime,
      icon: LogOut,
    },
  ]

  return (
    <Card className="h-full rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Chấm công hôm nay
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi trạng thái làm việc của bạn.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-0 overflow-hidden rounded-xl border border-border sm:grid-cols-2 xl:grid-cols-3">
          {attendanceItems.map((item, index) => {
            const Icon = item.icon
            const isStatusItem = item.label === 'Trạng thái'

            return (
              <div
                key={item.label}
                className={`flex items-start gap-3 p-4 ${
                  index > 0 ? 'border-t border-border sm:border-t-0' : ''
                } ${
                  index === 1
                    ? 'sm:border-l sm:border-border lg:border-l'
                    : ''
                } ${index === 2 ? 'sm:col-span-2 xl:col-span-1 xl:border-l xl:border-border' : ''}`}
              >
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <div
                    className={
                      isStatusItem
                        ? 'mt-2'
                        : 'mt-2 text-3xl font-bold tracking-tight text-foreground'
                    }
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {attendanceNote}
        </p>
      </CardContent>
    </Card>
  )
}

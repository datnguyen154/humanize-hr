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

const getStatusTone = (status: string): StatusBadgeTone => {
  if (
    status === 'Đúng giờ' ||
    status === 'Đang làm việc' ||
    status === 'Đã hoàn thành ca làm'
  ) {
    return 'success'
  }

  if (status === 'Đi muộn') {
    return 'warning'
  }

  return 'neutral'
}

export function TodayAttendanceCard({
  todayAttendance,
}: TodayAttendanceCardProps) {
  const todayAttendanceCard =
    createTodayAttendanceCardViewModel(todayAttendance)

  const statusLabel =
    todayAttendanceCard.workingStatus === 'Chưa chấm công'
      ? todayAttendanceCard.workingStatus
      : todayAttendanceCard.attendanceStatus

  const attendanceItems = [
    {
      label: 'Trạng thái',
      value: (
        <StatusBadge label={statusLabel} tone={getStatusTone(statusLabel)} />
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
    <Card className="rounded-xl border border-border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
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

        <div className="mt-6 grid gap-0 overflow-hidden rounded-xl border border-border sm:grid-cols-2 lg:grid-cols-3">
          {attendanceItems.map((item, index) => {
            const Icon = item.icon

            return (
              <div
                key={item.label}
                className={`flex items-start gap-3 p-4 ${
                  index > 0 ? 'border-t border-border sm:border-t-0' : ''
                } ${
                  index === 1
                    ? 'sm:border-l sm:border-border lg:border-l'
                    : ''
                } ${index === 2 ? 'sm:col-span-2 lg:col-span-1 lg:border-l lg:border-border' : ''}`}
              >
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    {item.value}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

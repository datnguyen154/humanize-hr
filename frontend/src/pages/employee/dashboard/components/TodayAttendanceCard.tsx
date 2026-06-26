import { Card, CardContent } from '@/components/ui/card'
import type { EmployeeDashboardTodayAttendance } from '@/features/dashboard/types/employee-dashboard.types'

import { createTodayAttendanceCardViewModel } from './employee-dashboard.mappers'

type TodayAttendanceCardProps = {
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined
}

export function TodayAttendanceCard({
  todayAttendance,
}: TodayAttendanceCardProps) {
  const todayAttendanceCard =
    createTodayAttendanceCardViewModel(todayAttendance)

  return (
    <Card>
      <CardContent className="grid gap-3 p-4 text-sm">
        <div>
          <p className="text-muted-foreground">Chấm công hôm nay</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {todayAttendanceCard.workingStatus}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <p>
            <span className="text-muted-foreground">Trạng thái: </span>
            <span className="font-medium text-foreground">
              {todayAttendanceCard.attendanceStatus}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Giờ vào: </span>
            <span className="font-medium text-foreground">
              {todayAttendanceCard.checkInTime}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Giờ ra: </span>
            <span className="font-medium text-foreground">
              {todayAttendanceCard.checkOutTime}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

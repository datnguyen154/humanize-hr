import { Card, CardContent } from '@/components/ui/card'
import type {
  EmployeeDashboardAttendanceSummary,
  EmployeeDashboardLeaveSummary,
  EmployeeDashboardTodayAttendance,
} from '@/features/dashboard/types/employee-dashboard.types'

import { createEmployeeDashboardKpis } from './employee-dashboard.mappers'

type EmployeeKpiCardsProps = {
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined
  attendanceSummary: EmployeeDashboardAttendanceSummary | undefined
  leaveSummary: EmployeeDashboardLeaveSummary | undefined
}

export function EmployeeKpiCards({
  todayAttendance,
  attendanceSummary,
  leaveSummary,
}: EmployeeKpiCardsProps) {
  const kpiCards = createEmployeeDashboardKpis({
    todayAttendance,
    attendanceSummary,
    leaveSummary,
  })

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpiCards.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

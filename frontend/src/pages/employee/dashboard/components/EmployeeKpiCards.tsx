import {
  Briefcase,
  CheckCircle2,
  Clock3,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type {
  EmployeeDashboardAttendanceSummary,
  EmployeeDashboardLeaveSummary,
  EmployeeDashboardTodayAttendance,
} from '@/features/dashboard/types/employee-dashboard.types'

import {
  createEmployeeDashboardKpis,
} from './employee-dashboard.mappers'

type EmployeeKpiCardsProps = {
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined
  attendanceSummary: EmployeeDashboardAttendanceSummary | undefined
  leaveSummary: EmployeeDashboardLeaveSummary | undefined
}

const kpiIconMap: Record<string, LucideIcon> = {
  'Kết quả hôm nay': Clock3,
  'Đi làm đúng giờ': CheckCircle2,
  'Đi muộn': Briefcase,
  'Đơn chờ duyệt': ClipboardList,
}

const getKpiIconClassName = (label: string, value: string) => {
  if (label === 'Kết quả hôm nay') {
    if (value === 'Đúng giờ') {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100'
    }

    if (value === 'Đi muộn') {
      return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100'
    }

    if (value === 'Vắng mặt') {
      return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-100'
    }

    return 'bg-muted text-muted-foreground'
  }

  if (label === 'Đi làm đúng giờ') {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100'
  }

  if (label === 'Đi muộn' || label === 'Đơn chờ duyệt') {
    return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100'
  }

  return 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/10'
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
    <div className="grid h-full auto-rows-fr items-stretch gap-4 sm:grid-cols-2">
      {kpiCards.map((item) => {
        const Icon = kpiIconMap[item.label] ?? Clock3
        const isTodayResult = item.label === 'Kết quả hôm nay'
        const iconClassName = getKpiIconClassName(item.label, item.value)

        return (
          <Card
            key={item.label}
            className="h-full rounded-xl border border-border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </p>
                <div className={`rounded-lg p-2 ${iconClassName}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-4xl font-bold tracking-tight text-foreground">
                  {item.value}
                </p>
              </div>

              {isTodayResult ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Kết quả được ghi nhận từ dữ liệu chấm công hôm nay.
                </p>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatPeriod, shiftPeriod } from '@/features/attendance/lib/timesheet'
import type { AttendanceReportPeriod } from '@/features/attendance/types/attendance-report.types'

type Props = {
  period: AttendanceReportPeriod
  onChange: (period: AttendanceReportPeriod) => void
  onRefresh: () => void
  isFetching: boolean
}

export function PeriodNavigator({ period, onChange, onRefresh, isFetching }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="icon" className="size-9" aria-label="Tháng trước"
        onClick={() => onChange(shiftPeriod(period, -1))} disabled={period.year === 1 && period.month === 1}>
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      <p className="min-w-32 text-center text-sm font-semibold tabular-nums" aria-live="polite">{formatPeriod(period)}</p>
      <Button type="button" variant="outline" size="icon" className="size-9" aria-label="Tháng sau"
        onClick={() => onChange(shiftPeriod(period, 1))} disabled={period.year === 9999 && period.month === 12}>
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onRefresh} disabled={isFetching}>
        <RotateCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} aria-hidden="true" />
        Làm mới
      </Button>
    </div>
  )
}

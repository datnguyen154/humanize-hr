import { Link } from 'react-router-dom'

import { TIMESHEET_STATUS } from '@/features/attendance/lib/timesheet'
import type { TimesheetDay } from '@/features/attendance/types/timesheet.types'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const time = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : null
const dayMonth = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`
const needsAction = (day: TimesheetDay) => day.status === 'ABSENT' || day.missingCheckOut

type Props = {
  days: TimesheetDay[]
  /** Employee view: absent / missing check-out days link to a prefilled adjustment request. */
  adjustmentHref?: (date: string) => string
}

export function TimesheetCalendar({ days, adjustmentHref }: Props) {
  const leading = days.length ? days[0].weekday - 1 : 0
  const used = [...new Set(days.map((d) => d.status))].filter((s) => s !== 'NOT_EMPLOYED')
  const actionDays = days.filter(needsAction)

  return (
    <div className="grid gap-4">
      <div>
        <div className="grid grid-cols-7 gap-1 pb-1 sm:gap-1.5" aria-hidden="true">
          {WEEKDAYS.map((w) => <div key={w} className="text-center text-xs font-medium text-muted-foreground">{w}</div>)}
        </div>
        <ol aria-label="Lịch công tháng" className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: leading }, (_, i) => <li key={`pad-${i}`} aria-hidden="true" />)}
          {days.map((day) => {
            const meta = TIMESHEET_STATUS[day.status]
            const checkIn = time(day.checkInTime)
            return (
              <li
                key={day.date}
                className={cn('relative flex min-h-14 flex-col justify-between rounded-md border p-1 sm:min-h-[4.5rem] sm:p-1.5', meta.cell)}
              >
                <span className="sr-only">
                  {`${dayMonth(day.date)}: ${meta.label}${checkIn ? `, vào ${checkIn}` : ''}${day.missingCheckOut ? ', thiếu giờ ra' : ''}`}
                </span>
                <span aria-hidden="true" className="text-xs font-semibold tabular-nums sm:text-sm">{Number(day.date.slice(8, 10))}</span>
                <span aria-hidden="true" className="truncate text-[10px] leading-tight sm:text-xs">
                  <span className="sm:hidden">{meta.tiny}</span>
                  <span className="hidden sm:inline">{meta.short}</span>
                </span>
                {checkIn ? (
                  <span aria-hidden="true" className="hidden text-[11px] tabular-nums opacity-80 sm:block">
                    {checkIn}{day.checkOutTime ? `–${time(day.checkOutTime)}` : ''}
                  </span>
                ) : null}
                {day.missingCheckOut ? <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" aria-hidden="true" /> : null}
              </li>
            )
          })}
        </ol>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Chú thích">
        {used.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={cn('size-3 rounded-sm border', TIMESHEET_STATUS[status].cell)} aria-hidden="true" />
            {TIMESHEET_STATUS[status].label}
          </li>
        ))}
        {days.some((d) => d.missingCheckOut) ? (
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-500" aria-hidden="true" />
            Thiếu giờ ra
          </li>
        ) : null}
      </ul>

      {actionDays.length ? (
        <div className="rounded-lg border border-border p-3 sm:p-4">
          <p className="text-sm font-semibold text-foreground">Ngày cần đối soát ({actionDays.length})</p>
          <ul className="mt-2 divide-y divide-border text-sm">
            {actionDays.map((day) => (
              <li key={day.date} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-medium tabular-nums">{dayMonth(day.date)}</span>
                  <span className="text-muted-foreground"> · {day.status === 'ABSENT' ? 'Không có chấm công' : `Vào ${time(day.checkInTime)}, chưa có giờ ra`}</span>
                </span>
                {adjustmentHref ? (
                  <Link to={adjustmentHref(day.date)} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                    Gửi yêu cầu điều chỉnh
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

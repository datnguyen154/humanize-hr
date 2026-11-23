import type { TimesheetSummary } from '@/features/attendance/types/timesheet.types'

const ITEMS = [
  ['requiredDays', 'Ngày phải làm'],
  ['presentDays', 'Có mặt'],
  ['lateDays', 'Đi muộn'],
  ['paidLeaveDays', 'Phép có lương'],
  ['unpaidLeaveDays', 'Nghỉ không lương'],
  ['absentDays', 'Vắng'],
  ['outOfScheduleDays', 'Ngoài lịch'],
  ['missingCheckOutDays', 'Thiếu giờ ra'],
] as const satisfies ReadonlyArray<readonly [keyof TimesheetSummary, string]>

/** Payable days lead because they feed payroll; the rest explain how they were reached. */
export function TimesheetSummaryGrid({ summary, standardDays }: { summary: TimesheetSummary; standardDays: number | null }) {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-5 lg:grid-cols-[minmax(0,14rem)_1fr] lg:items-center">
      <div>
        <p className="text-sm text-muted-foreground">Ngày công hưởng lương</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
          {summary.payableDays}
          <span className="text-lg font-medium text-muted-foreground"> / {standardDays ?? '—'}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Có mặt + phép có lương, trên ngày công chuẩn của tháng</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {ITEMS.map(([key, label]) => (
          <div key={key} className="min-w-0">
            <dt className="truncate text-xs text-muted-foreground">{label}</dt>
            <dd className="text-base font-semibold tabular-nums text-foreground">{summary[key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

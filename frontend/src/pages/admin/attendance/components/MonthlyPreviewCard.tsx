import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  formatCivilDateVN,
  formatMinutesToHours,
  ISSUE_CODE_LABELS,
  type CalendarDayType,
  type CalendarPreviewDto,
} from '@/features/work-schedule'
import { cn } from '@/lib/utils'

type Props = {
  preview: CalendarPreviewDto
  isLoading?: boolean
}

const WEEKDAY_NAMES = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật',
]

const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const DAY_TYPE_BADGE_STYLE: Record<
  CalendarDayType,
  { label: string; shortLabel: string; className: string }
> = {
  WORKDAY: {
    label: 'Làm việc',
    shortLabel: 'Làm',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  WEEKLY_OFF: {
    label: 'Nghỉ tuần',
    shortLabel: 'Nghỉ',
    className: 'bg-muted text-muted-foreground border-border',
  },
  HOLIDAY: {
    label: 'Nghỉ lễ',
    shortLabel: 'Lễ',
    className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
  },
  COMPENSATORY_OFF: {
    label: 'Nghỉ bù',
    shortLabel: 'Bù',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  },
  SWAPPED_OFF: {
    label: 'Nghỉ hoán đổi',
    shortLabel: 'Đổi',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  },
  SWAPPED_WORKDAY: {
    label: 'Làm bù',
    shortLabel: 'Bù ca',
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
  },
  NO_SCHEDULE: {
    label: 'Chưa có lịch',
    shortLabel: 'Trống',
    className: 'bg-muted/60 text-muted-foreground/70 border-dashed border-border',
  },
  UNRESOLVED: {
    label: 'Chưa xác định',
    shortLabel: 'Lỗi',
    className: 'bg-destructive/10 text-destructive border-dashed border-destructive/40 animate-pulse',
  },
}

export function MonthlyPreviewCard({ preview }: Props) {
  const { summary, validation, days, year, month } = preview

  // Calculate empty padding cells before 1st day of month
  // weekday in preview: 1 (Mon) to 7 (Sun)
  const firstDayWeekday = days[0]?.weekday ?? 1
  const emptyPaddingCount = firstDayWeekday - 1

  return (
    <div className="grid gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Working Days */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Ngày cần đi làm</span>
            <Calendar className="size-4 opacity-70" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {summary.isComplete ? (
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {summary.requiredWorkingDays ?? '--'} <span className="text-sm font-normal text-muted-foreground">ngày</span>
              </span>
            ) : (
              <div>
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {summary.partialRequiredWorkingDays} <span className="text-sm font-normal text-muted-foreground">ngày</span>
                </span>
                <span className="ml-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Tạm tính
                </span>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.isComplete
              ? `Tháng ${month}/${year} đã xác định đầy đủ.`
              : 'Chưa đầy đủ (có ngày chưa có lịch hoặc chưa giải quyết).'}
          </p>
        </div>

        {/* Working Hours */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Thời lượng cần đi làm</span>
            <Clock className="size-4 opacity-70" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {summary.isComplete ? (
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {formatMinutesToHours(summary.requiredWorkingMinutes)}
              </span>
            ) : (
              <div>
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {formatMinutesToHours(summary.partialRequiredWorkingMinutes)}
                </span>
                <span className="ml-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Tạm tính
                </span>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.isComplete
              ? `${summary.requiredWorkingMinutes} phút theo cấu hình lịch.`
              : `${summary.partialRequiredWorkingMinutes} phút từ các ngày đã xác định.`}
          </p>
        </div>

        {/* Day Resolution */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Độ phủ lịch tháng</span>
            <CheckCircle2 className="size-4 opacity-70" aria-hidden="true" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {summary.resolvedDays} / {summary.totalDays}{' '}
            <span className="text-sm font-normal text-muted-foreground">ngày</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.missingScheduleDays > 0 ? (
              <span className="text-amber-600 dark:text-amber-400">
                {summary.missingScheduleDays} ngày chưa áp dụng lịch.
              </span>
            ) : summary.unresolvedDays > 0 ? (
              `${summary.unresolvedDays} ngày chưa xác định, cần đối soát.`
            ) : (
              '100% ngày trong tháng có lịch.'
            )}
          </p>
        </div>

        {/* Status / Issues */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Trạng thái kiểm tra</span>
            {validation.hasBlockingIssues ? (
              <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {validation.hasBlockingIssues ? (
              <span className="text-lg font-bold text-destructive">
                Có {validation.issues.filter((i) => i.severity === 'BLOCKER').length} vấn đề cần xử lý
              </span>
            ) : summary.isComplete ? (
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                Không có lỗi lịch
              </span>
            ) : (
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                Cần kiểm tra
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {validation.issues.length > 0
              ? `Phát hiện ${validation.issues.length} vấn đề cần lưu ý.`
              : 'Không có vấn đề phát sinh.'}
          </p>
        </div>
      </div>

      {/* Issues / Validation Banner */}
      {validation.issues.length > 0 ? (
        <div
          role="region"
          aria-label="Cảnh báo lịch làm việc"
          className={cn(
            'rounded-xl border p-4.5',
            validation.hasBlockingIssues
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/60',
          )}
        >
          <div className="flex items-start gap-3">
            {validation.hasBlockingIssues ? (
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
            )}
            <div className="flex-1">
              <h4 className="text-sm font-semibold">
                {validation.hasBlockingIssues
                  ? 'Có vấn đề cần xử lý trên bản nháp'
                  : 'Cảnh báo cấu hình lịch làm việc'}
              </h4>
              <p className="mt-0.5 text-xs opacity-90">
                {validation.hasBlockingIssues
                  ? 'Các vấn đề dưới đây cần được quản trị viên xử lý trước khi có thể áp dụng lịch.'
                  : 'Vui lòng kiểm tra lại để đảm bảo tính chính xác của lịch làm việc.'}
              </p>

              <div className="mt-3 grid gap-2">
                {validation.issues.map((issue, idx) => (
                  <div
                    key={`${issue.code}-${issue.date}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs text-foreground shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase',
                          issue.severity === 'BLOCKER'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                        )}
                      >
                        {issue.severity === 'BLOCKER' ? 'Cần xử lý' : 'Cảnh báo'}
                      </span>
                      <span className="font-medium">
                        {ISSUE_CODE_LABELS[issue.code] ?? 'Vấn đề cấu hình lịch'}
                      </span>
                      {issue.date ? (
                        <span className="text-muted-foreground">
                          ({formatCivilDateVN(issue.date)})
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {issue.scope === 'DRAFT' ? '[Toàn bản nháp]' : '[Trong tháng]'}
                      </span>
                      <span className="text-xs text-foreground/90">{issue.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Calendar Grid View */}
      <Card className="border-border shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Lịch tháng {month}/{year}
              </CardTitle>
              <CardDescription>
                Bản xem trước ca làm việc và ngoại lệ trong bản nháp, chưa áp dụng vào chấm công.
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              Múi giờ: <span className="font-medium text-foreground">{preview.timezone}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground sm:gap-2">
            {WEEKDAY_NAMES.map((name, i) => (
              <div
                key={name}
                className={cn(
                  'py-1.5 sm:py-2 text-[11px] sm:text-xs',
                  i >= 5 && 'text-amber-600 dark:text-amber-400',
                )}
              >
                <span className="hidden sm:inline">{name}</span>
                <span className="sm:hidden">{WEEKDAY_SHORT[i]}</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-0">
            {/* Empty padding cells */}
            {Array.from({ length: emptyPaddingCount }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-16 rounded-md sm:rounded-lg border border-transparent bg-muted/10 p-1 opacity-20 sm:min-h-24"
              />
            ))}

            {/* Actual Month Days */}
            {days.map((day) => {
              const dayNum = day.date.split('-')[2]
              const badge = DAY_TYPE_BADGE_STYLE[day.dayType]
              const isWeekend = day.weekday >= 6

              return (
                <div
                  key={day.date}
                  className={cn(
                    'flex min-h-16 flex-col justify-between rounded-md sm:rounded-lg border p-1 sm:p-2 transition-colors min-w-0 overflow-hidden sm:min-h-24',
                    day.dayType === 'UNRESOLVED'
                      ? 'border-destructive/60 bg-destructive/5'
                      : day.dayType === 'NO_SCHEDULE'
                        ? 'border-border/60 bg-muted/30 opacity-70'
                        : day.dayType === 'HOLIDAY'
                          ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20'
                          : day.dayType === 'COMPENSATORY_OFF'
                            ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                            : day.dayType === 'SWAPPED_OFF' || day.dayType === 'SWAPPED_WORKDAY'
                              ? 'border-purple-200 bg-purple-50/40 dark:border-purple-900/40 dark:bg-purple-950/20'
                              : isWeekend
                                ? 'border-border/80 bg-muted/20'
                                : 'border-border bg-card',
                  )}
                >
                  <div className="flex items-start justify-between gap-0.5">
                    <span
                      className={cn(
                        'text-xs font-bold sm:text-sm shrink-0',
                        isWeekend ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
                      )}
                    >
                      {dayNum}
                    </span>

                    <span
                      className={cn(
                        'rounded-sm border px-1 py-0.5 text-[8px] font-medium leading-none sm:text-[10px] shrink-0 truncate max-w-[28px] sm:max-w-none',
                        badge.className,
                      )}
                      title={badge.label}
                    >
                      <span className="hidden sm:inline">{badge.label}</span>
                      <span className="sm:hidden">{badge.shortLabel}</span>
                    </span>
                  </div>

                  {/* Holiday policy tag if HOLIDAY */}
                  {day.dayType === 'HOLIDAY' ? (
                    <div className="mt-0.5 text-[8px] sm:text-[9px] font-semibold truncate leading-tight">
                      {day.holidayCategory === 'STATUTORY' ? (
                        <span className="text-rose-700 dark:text-rose-300">Pháp định</span>
                      ) : day.holidayCategory === 'COMPANY' ? (
                        <span className="text-amber-700 dark:text-amber-300">
                          {day.holidayPayPolicy === 'PAID' ? 'Có lương' : 'Không lương'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Chưa phân loại</span>
                      )}
                    </div>
                  ) : null}

                  {/* Shift details */}
                  <div className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground truncate">
                    {day.shift ? (
                      <div>
                        <div className="hidden sm:block font-semibold text-foreground truncate">
                          {day.shift.startTime}–{day.shift.endTime}
                        </div>
                        <div className="font-semibold sm:font-normal text-foreground sm:text-muted-foreground text-[9px] sm:text-[10px] truncate">
                          {formatMinutesToHours(day.requiredWorkingMinutes)}
                        </div>
                      </div>
                    ) : day.dayType === 'WEEKLY_OFF' ? (
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 truncate block">Nghỉ tuần</span>
                    ) : day.dayType === 'NO_SCHEDULE' ? (
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground/60 truncate block">Chưa có ca</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

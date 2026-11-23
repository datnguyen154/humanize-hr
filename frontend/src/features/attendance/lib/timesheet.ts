import type { StatusBadgeTone } from '@/components/ui/status-badge'
import type { AttendanceReportPeriod } from '../types/attendance-report.types'
import type { TimesheetDayStatus } from '../types/timesheet.types'

/** Label, calendar labels (short ≥ sm, tiny on phones), badge tone and cell colours for each day status. */
export const TIMESHEET_STATUS: Record<TimesheetDayStatus, { label: string; short: string; tiny: string; tone: StatusBadgeTone; cell: string }> = {
  PRESENT: { label: 'Đúng giờ', short: 'Đúng giờ', tiny: 'Đúng', tone: 'success', cell: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  LATE: { label: 'Đi muộn', short: 'Đi muộn', tiny: 'Muộn', tone: 'warning', cell: 'bg-amber-50 text-amber-800 border-amber-200' },
  PAID_LEAVE: { label: 'Phép có lương', short: 'Phép', tiny: 'Phép', tone: 'success', cell: 'bg-sky-50 text-sky-800 border-sky-200' },
  UNPAID_LEAVE: { label: 'Nghỉ không lương', short: 'Nghỉ KL', tiny: 'KL', tone: 'neutral', cell: 'bg-slate-100 text-slate-700 border-slate-200' },
  ABSENT: { label: 'Vắng', short: 'Vắng', tiny: 'Vắng', tone: 'danger', cell: 'bg-red-50 text-red-700 border-red-200' },
  UPCOMING: { label: 'Chưa tới', short: '', tiny: '', tone: 'neutral', cell: 'bg-card text-muted-foreground border-border' },
  DAY_OFF: { label: 'Ngày nghỉ', short: 'Nghỉ', tiny: 'Nghỉ', tone: 'neutral', cell: 'bg-muted/60 text-muted-foreground border-transparent' },
  OUT_OF_SCHEDULE: { label: 'Ngoài lịch', short: 'Ngoài lịch', tiny: 'NL', tone: 'neutral', cell: 'bg-violet-50 text-violet-800 border-violet-200' },
  NO_SCHEDULE: { label: 'Chưa có lịch', short: '—', tiny: '—', tone: 'neutral', cell: 'bg-muted/30 text-muted-foreground border-dashed border-border' },
  NOT_EMPLOYED: { label: 'Chưa vào làm', short: '', tiny: '', tone: 'neutral', cell: 'bg-transparent text-muted-foreground/60 border-transparent' },
}

/** Current month in the company timezone. */
export function currentCompanyPeriod(now = new Date()): AttendanceReportPeriod {
  const [year, month] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit' })
    .format(now).split('-').map(Number)
  return { year, month }
}

/** Reads ?year&month from the URL, falling back to the current month when absent or invalid. */
export function periodFromSearch(params: URLSearchParams): AttendanceReportPeriod {
  const year = Number(params.get('year'))
  const month = Number(params.get('month'))
  return Number.isInteger(year) && year >= 1 && year <= 9999 && Number.isInteger(month) && month >= 1 && month <= 12
    ? { year, month } : currentCompanyPeriod()
}

export function shiftPeriod({ year, month }: AttendanceReportPeriod, delta: number): AttendanceReportPeriod {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export const formatPeriod = ({ year, month }: AttendanceReportPeriod) => `Tháng ${month}/${year}`

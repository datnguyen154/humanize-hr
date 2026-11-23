import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEmployeeTimesheetQuery, useMyTimesheetQuery } from '@/features/attendance/hooks/useTimesheetQuery'
import { periodFromSearch } from '@/features/attendance/lib/timesheet'
import type { AttendanceReportPeriod } from '@/features/attendance/types/attendance-report.types'

import { PeriodNavigator } from './components/PeriodNavigator'
import { TimesheetCalendar } from './components/TimesheetCalendar'
import { IncompleteCalendarNotice, TimesheetError, TimesheetSkeleton } from './components/TimesheetStates'
import { TimesheetSummaryGrid } from './components/TimesheetSummaryGrid'

type Props = { audience: 'ADMIN' | 'EMPLOYEE' }

/** Admin: /admin/attendance/timesheet/:employeeId. Employee: own month at /employee/attendance/timesheet. */
export function EmployeeTimesheetPage({ audience }: Props) {
  const isAdmin = audience === 'ADMIN'
  const { employeeId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const period = periodFromSearch(searchParams)
  // Both hooks are always called (rules of hooks); only the one for this audience is enabled.
  const adminQuery = useEmployeeTimesheetQuery(isAdmin ? employeeId : '', period)
  const myQuery = useMyTimesheetQuery(period, !isAdmin)
  const query = isAdmin ? adminQuery : myQuery
  const data = query.data
  const setPeriod = (next: AttendanceReportPeriod) =>
    setSearchParams({ year: String(next.year), month: String(next.month) }, { replace: true })
  const back = isAdmin
    ? { to: `/admin/attendance/timesheet?year=${period.year}&month=${period.month}`, label: 'Bảng công tháng' }
    : { to: '/employee/attendance', label: 'Lịch sử chấm công' }

  return (
    <section className="grid min-w-0 gap-6">
      <Link to={back.to} className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> {back.label}
      </Link>
      <Card className="min-w-0 border-border shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="break-words text-lg">
              {isAdmin ? (data ? `Bảng công · ${data.employee.fullName}` : 'Bảng công nhân viên') : 'Bảng công của tôi'}
            </CardTitle>
            <CardDescription>
              {data && isAdmin ? `${data.employee.employeeCode}${data.employee.departmentName ? ` · ${data.employee.departmentName}` : ''}`
                : 'Ngày công được tính từ lịch làm việc, chấm công và nghỉ phép đã duyệt.'}
            </CardDescription>
          </div>
          <PeriodNavigator period={period} onChange={setPeriod} onRefresh={() => void query.refetch()} isFetching={query.isFetching} />
        </CardHeader>
        <CardContent className="grid gap-5 pt-6" aria-busy={query.isFetching}>
          {query.isError ? (
            <TimesheetError message="Không thể tải bảng công." onRetry={() => void query.refetch()} isFetching={query.isFetching} />
          ) : query.isPending ? (
            <TimesheetSkeleton />
          ) : data ? (
            <>
              {!data.isCalendarComplete ? <IncompleteCalendarNotice isAdmin={isAdmin} /> : null}
              <TimesheetSummaryGrid summary={data.summary} standardDays={data.standardDays} />
              <TimesheetCalendar
                days={data.days}
                adjustmentHref={isAdmin ? undefined : (date) => `/employee/attendance/adjustments/new?date=${date}`}
              />
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

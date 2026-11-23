import { ArrowLeft, CalendarDays, ChevronRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCompanyTimesheetQuery } from '@/features/attendance/hooks/useTimesheetQuery'
import { formatPeriod, periodFromSearch } from '@/features/attendance/lib/timesheet'
import type { AttendanceReportPeriod } from '@/features/attendance/types/attendance-report.types'
import type { TimesheetSummary } from '@/features/attendance/types/timesheet.types'

import { PeriodNavigator } from './components/PeriodNavigator'
import { IncompleteCalendarNotice, TimesheetError, TimesheetSkeleton } from './components/TimesheetStates'

const COLUMNS = [
  ['requiredDays', 'Phải làm'],
  ['presentDays', 'Có mặt'],
  ['lateDays', 'Đi muộn'],
  ['paidLeaveDays', 'Phép có lương'],
  ['unpaidLeaveDays', 'Nghỉ KL'],
  ['absentDays', 'Vắng'],
  ['outOfScheduleDays', 'Ngoài lịch'],
  ['missingCheckOutDays', 'Thiếu giờ ra'],
] as const satisfies ReadonlyArray<readonly [keyof TimesheetSummary, string]>
const MOBILE_COLUMNS = [COLUMNS[1], COLUMNS[2], COLUMNS[3], COLUMNS[5]]

export function CompanyTimesheetPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = periodFromSearch(searchParams)
  const query = useCompanyTimesheetQuery(period)
  const data = query.data
  const setPeriod = (next: AttendanceReportPeriod) =>
    setSearchParams({ year: String(next.year), month: String(next.month) }, { replace: true })
  const detailHref = (id: string) => `/admin/attendance/timesheet/${id}?year=${period.year}&month=${period.month}`

  return (
    <section className="grid min-w-0 gap-6">
      <Link to="/admin/attendance" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Danh sách chấm công
      </Link>
      <Card className="min-w-0 border-border shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Bảng công tháng</CardTitle>
            <CardDescription>
              Tính trực tiếp từ lịch làm việc đã kích hoạt, chấm công và nghỉ phép đã duyệt. Sai lệch được xử lý qua yêu cầu điều chỉnh.
            </CardDescription>
          </div>
          <PeriodNavigator period={period} onChange={setPeriod} onRefresh={() => void query.refetch()} isFetching={query.isFetching} />
        </CardHeader>
        <CardContent className="grid gap-4 pt-6" aria-busy={query.isFetching}>
          {query.isError ? (
            <TimesheetError message="Không thể tải bảng công tháng." onRetry={() => void query.refetch()} isFetching={query.isFetching} />
          ) : query.isPending ? (
            <TimesheetSkeleton />
          ) : data ? (
            <>
              {!data.isCalendarComplete ? <IncompleteCalendarNotice isAdmin /> : null}
              <p className="text-sm text-muted-foreground">
                {formatPeriod(data.period)} · Ngày công chuẩn:{' '}
                <span className="font-semibold text-foreground tabular-nums">{data.standardDays ?? 'chưa xác định'}</span>
                {' '}· {data.employees.length} nhân viên
              </p>
              {!data.employees.length ? (
                <EmptyState icon={CalendarDays} title="Chưa có nhân viên trong kỳ này" description="Chọn tháng khác để xem bảng công." />
              ) : (
                <>
                  <div className="hidden rounded-md border lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nhân viên</TableHead>
                          {COLUMNS.map(([key, label]) => <TableHead key={key} className="text-right">{label}</TableHead>)}
                          <TableHead className="text-right">Công hưởng lương</TableHead>
                          <TableHead><span className="sr-only">Chi tiết</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.employees.map(({ employee, summary }) => (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <p className="font-medium">{employee.fullName}</p>
                              <p className="text-xs text-muted-foreground">{employee.employeeCode}{employee.departmentName ? ` · ${employee.departmentName}` : ''}</p>
                            </TableCell>
                            {COLUMNS.map(([key]) => (
                              <TableCell key={key} className={`text-right tabular-nums ${summary[key] === 0 ? 'text-muted-foreground' : ''}`}>{summary[key]}</TableCell>
                            ))}
                            <TableCell className="text-right font-semibold tabular-nums">{summary.payableDays}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={detailHref(employee.id)} aria-label={`Xem bảng công của ${employee.fullName}`}>
                                  Chi tiết <ChevronRight className="size-4" aria-hidden="true" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <ul className="grid gap-3 lg:hidden">
                    {data.employees.map(({ employee, summary }) => (
                      <li key={employee.id}>
                        <Link to={detailHref(employee.id)}
                          className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words font-medium">{employee.fullName}</p>
                              <p className="text-xs text-muted-foreground">{employee.employeeCode}{employee.departmentName ? ` · ${employee.departmentName}` : ''}</p>
                            </div>
                            <p className="shrink-0 text-right">
                              <span className="block text-xs text-muted-foreground">Công hưởng lương</span>
                              <span className="text-lg font-semibold tabular-nums">{summary.payableDays}<span className="text-sm font-normal text-muted-foreground">/{data.standardDays ?? '—'}</span></span>
                            </p>
                          </div>
                          <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                            {MOBILE_COLUMNS.map(([key, label]) => (
                              <div key={key} className="rounded-md bg-muted/40 px-1 py-1.5">
                                <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
                                <dd className="font-semibold tabular-nums">{summary[key]}</dd>
                              </div>
                            ))}
                          </dl>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

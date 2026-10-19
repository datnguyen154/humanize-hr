import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Download, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAttendanceMonthlyReportQuery } from '@/features/attendance/hooks/useAttendanceMonthlyReportQuery'
import { useExportAttendanceReportMutation } from '@/features/attendance/hooks/useExportAttendanceReportMutation'
import type { AttendanceReportCounts } from '@/features/attendance/types/attendance-report.types'
import { downloadBlob } from '@/shared/lib/download-blob'
import { showErrorToast } from '@/lib/toast'

const metrics = [
  { key: 'totalRecords', label: 'Số lần chấm công' },
  { key: 'present', label: 'Đúng giờ' },
  { key: 'late', label: 'Đi muộn' },
  { key: 'missingCheckOut', label: 'Chưa check-out' },
] as const satisfies ReadonlyArray<{ key: keyof AttendanceReportCounts; label: string }>

function getCurrentPeriod() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: 'numeric',
  }).formatToParts(new Date())
  return {
    year: Number(parts.find((part) => part.type === 'year')!.value),
    month: Number(parts.find((part) => part.type === 'month')!.value),
  }
}

export function AttendanceMonthlyReportPage() {
  const [period, setPeriod] = useState(getCurrentPeriod)
  const [month, setMonth] = useState(String(period.month))
  const [year, setYear] = useState(String(period.year))
  const [periodError, setPeriodError] = useState('')
  const query = useAttendanceMonthlyReportQuery(period)
  const exportMutation = useExportAttendanceReportMutation()
  const report = query.data
  const busy = query.isFetching || exportMutation.isPending
  const periodLabel = `Tháng ${period.month}/${period.year}`

  function handlePeriodSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (!/^\d{1,4}$/.test(year) || Number(year) < 1 || Number(year) > 9999) {
      setPeriodError('Vui lòng nhập năm hợp lệ từ 1 đến 9999')
      return
    }
    setPeriodError('')
    const next = { year: Number(year), month: Number(month) }
    if (next.year === period.year && next.month === period.month) void query.refetch()
    else setPeriod(next)
  }

  async function handleExport() {
    if (busy) return
    try {
      const blob = await exportMutation.mutateAsync(period)
      downloadBlob(blob, `attendance-${period.year}-${String(period.month).padStart(2, '0')}.xlsx`)
    } catch {
      showErrorToast('Không thể xuất báo cáo chấm công. Vui lòng thử lại.', 'Xuất Excel thất bại')
    }
  }

  return (
    <section className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Tổng hợp chấm công tháng</h1>
        <Button variant="outline" asChild>
          <Link to="/admin/attendance">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Danh sách chấm công
          </Link>
        </Button>
      </div>
      <form onSubmit={handlePeriodSubmit} className="flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="report-month">Tháng</Label>
          <select
            id="report-month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            disabled={exportMutation.isPending}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>Tháng {index + 1}</option>
            ))}
          </select>
        </div>
        <div className="grid w-28 gap-2">
          <Label htmlFor="report-year">Năm</Label>
          <Input
            id="report-year"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            inputMode="numeric"
            maxLength={4}
            disabled={exportMutation.isPending}
            aria-invalid={Boolean(periodError)}
            aria-describedby={periodError ? 'report-period-error' : undefined}
          />
        </div>
        <Button type="submit" disabled={busy}>Xem báo cáo</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void query.refetch()}>
          <RefreshCw aria-hidden="true" className={`size-4 ${query.isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
        <Button type="button" variant="outline" disabled={busy || query.isError || !report?.employees.length} onClick={() => void handleExport()}>
          {exportMutation.isPending
            ? <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            : <Download aria-hidden="true" className="size-4" />}
          {exportMutation.isPending ? 'Đang xuất...' : 'Xuất Excel'}
        </Button>
      </form>
      {periodError && <p id="report-period-error" role="alert" className="text-sm text-destructive">{periodError}</p>}
      {query.isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/30 p-4">
          <p>Không thể tải báo cáo chấm công tháng</p>
          <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Thử lại</Button>
        </div>
      ) : query.isPending ? (
        <div aria-label="Đang tải báo cáo chấm công" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map(({ key }) => <Skeleton key={key} className="h-24 w-full" />)}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map(({ key, label }) => (
              <Card key={key}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-2xl font-semibold">{report.totals[key]}</CardContent>
              </Card>
            ))}
          </div>
          <div aria-busy={query.isFetching} className="min-w-0 space-y-4">
            <h2 className="text-base font-semibold">{periodLabel} · {report.totals.totalEmployees} nhân viên có chấm công</h2>
            {!report.employees.length ? (
              <EmptyState
                icon={CalendarDays}
                title="Chưa có dữ liệu chấm công trong tháng này"
                description="Vui lòng chọn kỳ báo cáo khác."
              />
            ) : (
              <>
                <div className="hidden rounded-md border md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã nhân viên</TableHead>
                        <TableHead>Họ tên</TableHead>
                        {metrics.map(({ key, label }) => (
                          <TableHead key={key} className="text-right">{label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.employees.map((employee) => (
                        <TableRow key={employee.employeeId}>
                          <TableCell>{employee.employeeCode}</TableCell>
                          <TableCell>{employee.fullName}</TableCell>
                          {metrics.map(({ key }) => (
                            <TableCell key={key} className="text-right tabular-nums">{employee[key]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-3 md:hidden">
                  {report.employees.map((employee) => (
                    <Card key={employee.employeeId} className="min-w-0">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="break-words text-base">{employee.fullName}</CardTitle>
                        <p className="break-words text-sm text-muted-foreground">Mã nhân viên: {employee.employeeCode}</p>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <dl className="grid grid-cols-2 gap-3">
                          {metrics.map(({ key, label }) => (
                            <div key={key}>
                              <dt className="text-xs text-muted-foreground">{label}</dt>
                              <dd className="font-semibold tabular-nums">{employee[key]}</dd>
                            </div>
                          ))}
                        </dl>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}

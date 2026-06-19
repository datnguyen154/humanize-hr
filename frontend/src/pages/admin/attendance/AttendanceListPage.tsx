import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAttendanceListQuery } from '@/features/attendance/hooks/useAttendanceListQuery'
import type {
  AttendanceSortBy,
  AttendanceSortOrder,
  AttendanceStatus,
} from '@/features/attendance/types/attendance.types'

type StatusFilter = 'ALL' | AttendanceStatus

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đúng giờ', value: 'PRESENT' },
  { label: 'Đi muộn', value: 'LATE' },
]

const attendanceStatusLabel: Record<AttendanceStatus, string> = {
  PRESENT: 'Đúng giờ',
  LATE: 'Đi muộn',
}

const attendanceStatusClassName: Record<AttendanceStatus, string> = {
  PRESENT: 'border-primary/20 bg-primary/10 text-primary',
  LATE: 'border-destructive/20 bg-destructive/10 text-destructive',
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Bangkok',
  }).format(new Date(date))

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(new Date(date))

export function AttendanceListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState<AttendanceSortBy>('attendanceDate')
  const [sortOrder, setSortOrder] = useState<AttendanceSortOrder>('desc')

  const attendanceQuery = useAttendanceListQuery({
    page,
    limit: 10,
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    sortBy,
    sortOrder,
  })

  const attendanceRecords = attendanceQuery.data?.data ?? []
  const meta = attendanceQuery.data?.meta
  const totalPages = meta?.totalPages ?? 1

  const updateFilter = (callback: () => void) => {
    callback()
    setPage(1)
  }

  const handleSort = (column: AttendanceSortBy) => {
    setPage(1)

    if (sortBy === column) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(column)
    setSortOrder('asc')
  }

  const renderSortIcon = (column: AttendanceSortBy) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="size-4" aria-hidden="true" />
    }

    return sortOrder === 'asc' ? (
      <ArrowUp className="size-4" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-4" aria-hidden="true" />
    )
  }

  const renderSortableHeader = (label: string, column: AttendanceSortBy) => (
    <Button
      type="button"
      variant="ghost"
      className="h-auto justify-start gap-1 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
      onClick={() => handleSort(column)}
    >
      {label}
      {renderSortIcon(column)}
    </Button>
  )

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Quản lý chấm công
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi lịch sử vào, ra và trạng thái chấm công của nhân viên.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-lg">Danh sách chấm công</CardTitle>

          <div className="grid gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Input
                value={search}
                placeholder="Tìm theo mã hoặc tên nhân viên"
                className="h-10 lg:max-w-sm"
                onChange={(event) =>
                  updateFilter(() => setSearch(event.target.value))
                }
              />

              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={status === option.value ? 'default' : 'outline'}
                    onClick={() => updateFilter(() => setStatus(option.value))}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
              <div className="grid gap-2">
                <Label htmlFor="fromDate">Từ ngày</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(event) =>
                    updateFilter(() => setFromDate(event.target.value))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="toDate">Đến ngày</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(event) =>
                    updateFilter(() => setToDate(event.target.value))
                  }
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {attendanceQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              Đang tải dữ liệu chấm công...
            </p>
          ) : null}

          {attendanceQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải dữ liệu chấm công
            </p>
          ) : null}

          {attendanceQuery.isSuccess && attendanceRecords.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Chưa có dữ liệu chấm công
            </p>
          ) : null}

          {attendanceRecords.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã nhân viên</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>
                      {renderSortableHeader('Ngày', 'attendanceDate')}
                    </TableHead>
                    <TableHead>
                      {renderSortableHeader('Giờ vào', 'checkInTime')}
                    </TableHead>
                    <TableHead>
                      {renderSortableHeader('Giờ ra', 'checkOutTime')}
                    </TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell className="font-medium">
                        {attendance.employee.employeeCode}
                      </TableCell>
                      <TableCell>{attendance.employee.fullName}</TableCell>
                      <TableCell>
                        {formatDate(attendance.attendanceDate)}
                      </TableCell>
                      <TableCell>{formatTime(attendance.checkInTime)}</TableCell>
                      <TableCell>
                        {attendance.checkOutTime
                          ? formatTime(attendance.checkOutTime)
                          : 'Chưa chấm công ra'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${attendanceStatusClassName[attendance.status]}`}
                        >
                          {attendanceStatusLabel[attendance.status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!meta?.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Trước
                </Button>
                <p className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!meta?.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Sau
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

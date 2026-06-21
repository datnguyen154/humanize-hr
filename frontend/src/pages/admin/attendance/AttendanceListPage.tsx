import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
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

const attendanceStatusTone: Record<AttendanceStatus, StatusBadgeTone> = {
  PRESENT: 'success',
  LATE: 'warning',
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
  const pageSize = meta?.limit ?? 10
  const totalItems = meta?.totalItems ?? 0
  const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, totalItems)

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
    <section>
      <Card>
        <CardHeader className="gap-4">
          <div className="grid gap-1.5">
            <CardTitle className="text-lg">Danh sách chấm công</CardTitle>
            <CardDescription>
              Theo dõi lịch sử vào, ra và trạng thái chấm công của nhân viên.
            </CardDescription>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  placeholder="Tìm theo mã hoặc tên nhân viên..."
                  className="h-10 pl-10"
                  onChange={(event) =>
                    updateFilter(() => setSearch(event.target.value))
                  }
                />
              </div>

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

            <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:max-w-2xl">
              <div className="grid gap-2.5">
                <Label
                  htmlFor="fromDate"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <CalendarDays
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  Từ ngày
                </Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  className="h-10 bg-card"
                  onChange={(event) =>
                    updateFilter(() => setFromDate(event.target.value))
                  }
                />
              </div>
              <div className="grid gap-2.5">
                <Label
                  htmlFor="toDate"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <CalendarDays
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  Đến ngày
                </Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  className="h-10 bg-card"
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
                    <TableHead className="text-center">Trạng thái</TableHead>
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
                      <TableCell className="text-center">
                        <StatusBadge
                          label={attendanceStatusLabel[attendance.status]}
                          tone={attendanceStatusTone[attendance.status]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {fromItem}-{toItem} trong tổng số {totalItems} bản ghi
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!meta?.hasPreviousPage}
                    aria-label="Trang trước"
                    title="Trang trước"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </Button>
                  <span className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!meta?.hasNextPage}
                    aria-label="Trang sau"
                    title="Trang sau"
                    onClick={() => setPage((current) => current + 1)}
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

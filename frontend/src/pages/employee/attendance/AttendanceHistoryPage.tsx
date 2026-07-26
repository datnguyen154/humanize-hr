import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { TableRowsSkeleton } from '@/components/ui/skeleton'
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
import { useAttendanceHistoryQuery } from '@/features/attendance/hooks/useAttendanceHistoryQuery'
import type { AttendanceStatus } from '@/features/attendance/types/attendance.types'

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

export function AttendanceHistoryPage() {
  const [page, setPage] = useState(1)
  const attendanceQuery = useAttendanceHistoryQuery({
    page,
    limit: 10,
    sortBy: 'attendanceDate',
    sortOrder: 'desc',
  })

  const attendanceRecords = attendanceQuery.data?.data ?? []
  const meta = attendanceQuery.data?.meta
  const totalPages = meta?.totalPages ?? 1
  const pageSize = meta?.limit ?? 10
  const totalItems = meta?.totalItems ?? 0
  const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, totalItems)
  return (
    <section className="grid gap-6">
      <Link
        to="/employee/dashboard"
        className="group inline-flex w-fit items-center gap-2 rounded-md bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
      >
        <ArrowLeft
          className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        Quay lại tổng quan
      </Link>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Lịch sử chấm công
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi thời gian vào, ra và lịch sử chấm công của bạn.
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Lịch sử chấm công</CardTitle>
          <CardDescription>
            Theo dõi các lần chấm công trước đây của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {attendanceQuery.isLoading ? (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Giờ vào</TableHead>
                  <TableHead>Giờ ra</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRowsSkeleton columns={4} />
              </TableBody>
            </Table>
          ) : null}

          {attendanceQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải lịch sử chấm công
            </p>
          ) : null}

          {attendanceQuery.isSuccess && attendanceRecords.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="Chưa có dữ liệu chấm công"
              description="Thông tin chấm công sẽ xuất hiện sau khi bạn thực hiện chấm công."
            />
          ) : null}

          {attendanceRecords.length > 0 ? (
            <>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ vào</TableHead>
                    <TableHead>Giờ ra</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell className="font-medium">
                        {formatDate(attendance.attendanceDate)}
                      </TableCell>
                      <TableCell>{formatTime(attendance.checkInTime)}</TableCell>
                      <TableCell>
                        {attendance.checkOutTime
                          ? formatTime(attendance.checkOutTime)
                          : '--:--'}
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

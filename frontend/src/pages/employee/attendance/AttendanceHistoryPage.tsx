import { AxiosError } from 'axios'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  LogIn,
  LogOut,
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
import { Skeleton, TableRowsSkeleton } from '@/components/ui/skeleton'
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
import { useCheckInMutation } from '@/features/attendance/hooks/useCheckInMutation'
import { useCheckOutMutation } from '@/features/attendance/hooks/useCheckOutMutation'
import { useAttendanceHistoryQuery } from '@/features/attendance/hooks/useAttendanceHistoryQuery'
import type { AttendanceStatus } from '@/features/attendance/types/attendance.types'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ApiErrorResponse } from '@/shared/types'

const attendanceStatusLabel: Record<AttendanceStatus, string> = {
  PRESENT: 'Đúng giờ',
  LATE: 'Đi muộn',
}

const attendanceStatusTone: Record<AttendanceStatus, StatusBadgeTone> = {
  PRESENT: 'success',
  LATE: 'warning',
}

const workStatusTone: Record<string, StatusBadgeTone> = {
  'Chưa chấm công': 'neutral',
  'Đang làm việc': 'warning',
  'Đã hoàn thành': 'success',
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

const getAttendanceErrorMessage = (
  error: unknown,
  action: 'check-in' | 'check-out',
) => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as ApiErrorResponse | undefined)
      ?.message

    if (message === 'Already checked in today') {
      return 'Bạn đã check in hôm nay rồi'
    }

    if (message === 'Already checked out today') {
      return 'Bạn đã check out hôm nay rồi'
    }
  }

  return action === 'check-in' ? 'Không thể check in' : 'Không thể check out'
}

export function AttendanceHistoryPage() {
  const [page, setPage] = useState(1)
  const checkInMutation = useCheckInMutation()
  const checkOutMutation = useCheckOutMutation()
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
  const isUpdating = checkInMutation.isPending || checkOutMutation.isPending
  const today = formatDate(new Date().toISOString())
  const todayAttendance = attendanceRecords.find(
    (attendance) => formatDate(attendance.attendanceDate) === today,
  )
  const currentWorkStatus = !todayAttendance?.checkInTime
    ? 'Chưa chấm công'
    : todayAttendance.checkOutTime
      ? 'Đã hoàn thành'
      : 'Đang làm việc'

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync()
      showSuccessToast(
        'Thời gian vào làm đã được ghi nhận.',
        'Chấm công vào thành công',
      )
    } catch (error) {
      const message = getAttendanceErrorMessage(error, 'check-in')

      if (message === 'Bạn đã check in hôm nay rồi') {
        showErrorToast('Bạn đã check in hôm nay rồi.', 'Không thể check in')
        return
      }

      showErrorToast()
    }
  }

  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync()
      showSuccessToast(
        'Thời gian ra về đã được ghi nhận.',
        'Chấm công ra thành công',
      )
    } catch (error) {
      const message = getAttendanceErrorMessage(error, 'check-out')

      if (message === 'Bạn đã check out hôm nay rồi') {
        showErrorToast('Bạn đã check out hôm nay rồi.', 'Không thể check out')
        return
      }

      showErrorToast()
    }
  }

  return (
    <section className="grid gap-6">
      <Link
        to="/employee/dashboard"
        className="inline-flex w-fit items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Quay lại tổng quan
      </Link>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Chấm công
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi thời gian vào, ra và lịch sử chấm công của bạn.
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="gap-4 border-b border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1.5">
              <CardTitle className="text-lg">Chấm công hôm nay</CardTitle>
              <CardDescription>
                Ghi nhận thời gian làm việc trong ngày.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <Button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 sm:w-[148px] sm:min-w-[148px]"
                disabled={isUpdating}
                onClick={handleCheckIn}
              >
                {checkInMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                )}
                Chấm công vào
              </Button>
              <Button
                type="button"
                variant="outline"
                className="inline-flex w-full items-center justify-center gap-2 sm:w-[148px] sm:min-w-[148px]"
                disabled={isUpdating}
                onClick={handleCheckOut}
              >
                {checkOutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                )}
                Chấm công ra
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {attendanceQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg border border-border p-4"
                >
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <div className="grid flex-1 gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Clock3 className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Trạng thái hiện tại
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge
                      label={currentWorkStatus}
                      tone={workStatusTone[currentWorkStatus]}
                    />
                    {todayAttendance ? (
                      <StatusBadge
                        label={attendanceStatusLabel[todayAttendance.status]}
                        tone={attendanceStatusTone[todayAttendance.status]}
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <LogIn className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Giờ vào
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    {todayAttendance?.checkInTime
                      ? formatTime(todayAttendance.checkInTime)
                      : '--:--'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <LogOut className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Giờ ra
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    {todayAttendance?.checkOutTime
                      ? formatTime(todayAttendance.checkOutTime)
                      : '--:--'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

          {attendanceQuery.isFetching && !attendanceQuery.isLoading ? (
            <p className="mb-3 text-right text-xs text-muted-foreground">
              Đang cập nhật dữ liệu...
            </p>
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

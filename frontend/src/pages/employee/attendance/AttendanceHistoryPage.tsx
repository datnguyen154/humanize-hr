import { AxiosError } from 'axios'
import { ChevronLeft, ChevronRight, Clock3, LogIn, LogOut } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import type { ApiErrorResponse } from '@/shared/types'

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
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
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

  const handleCheckIn = async () => {
    setFeedback(null)

    try {
      await checkInMutation.mutateAsync()
      setFeedback({ type: 'success', message: 'Check in thành công' })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getAttendanceErrorMessage(error, 'check-in'),
      })
    }
  }

  const handleCheckOut = async () => {
    setFeedback(null)

    try {
      await checkOutMutation.mutateAsync()
      setFeedback({ type: 'success', message: 'Check out thành công' })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getAttendanceErrorMessage(error, 'check-out'),
      })
    }
  }

  return (
    <section className="grid gap-5">
      {feedback ? (
        <p
          className={
            feedback.type === 'success'
              ? 'rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary'
              : 'rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          }
        >
          {feedback.message}
        </p>
      ) : null}

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1.5">
              <CardTitle className="text-lg">Lịch sử chấm công</CardTitle>
              <CardDescription>
                Theo dõi thời gian vào, ra và trạng thái chấm công của bạn.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={isUpdating}
                onClick={handleCheckIn}
              >
                <LogIn className="size-4" aria-hidden="true" />
                {checkInMutation.isPending ? 'Đang check in...' : 'Check in'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isUpdating}
                onClick={handleCheckOut}
              >
                <LogOut className="size-4" aria-hidden="true" />
                {checkOutMutation.isPending
                  ? 'Đang check out...'
                  : 'Check out'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              Đang tải lịch sử chấm công...
            </p>
          ) : null}

          {attendanceQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải lịch sử chấm công
            </p>
          ) : null}

          {attendanceQuery.isSuccess && attendanceRecords.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Clock3 className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                Chưa có dữ liệu chấm công
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Thông tin chấm công sẽ xuất hiện sau khi bạn thực hiện check-in.
              </p>
            </div>
          ) : null}

          {attendanceRecords.length > 0 ? (
            <>
              <Table>
                <TableHeader>
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

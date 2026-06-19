import { AxiosError } from 'axios'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Lịch sử chấm công
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi thời gian vào, ra và trạng thái chấm công của bạn.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isUpdating}
            onClick={handleCheckIn}
          >
            {checkInMutation.isPending ? 'Đang check in...' : 'Check in'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isUpdating}
            onClick={handleCheckOut}
          >
            {checkOutMutation.isPending ? 'Đang check out...' : 'Check out'}
          </Button>
        </div>
      </div>

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
        <CardHeader>
          <CardTitle className="text-lg">Danh sách chấm công</CardTitle>
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
            <p className="py-8 text-center text-muted-foreground">
              Chưa có dữ liệu chấm công
            </p>
          ) : null}

          {attendanceRecords.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Giờ vào</TableHead>
                    <TableHead>Giờ ra</TableHead>
                    <TableHead>Trạng thái</TableHead>
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

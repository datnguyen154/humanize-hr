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

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync()
      showSuccessToast(
        'Thời gian vào làm đã được ghi nhận.',
        'Check in thành công',
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
        'Check out thành công',
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
    <section className="grid gap-5">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1.5">
              <CardTitle className="text-lg">Lịch sử chấm công</CardTitle>
              <CardDescription>
                Theo dõi thời gian vào, ra và trạng thái chấm công của bạn.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <Button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 sm:w-[148px] sm:min-w-[148px]"
                disabled={isUpdating}
                onClick={handleCheckIn}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Chấm công vào
              </Button>
              <Button
                type="button"
                variant="outline"
                className="inline-flex w-full items-center justify-center gap-2 sm:w-[148px] sm:min-w-[148px]"
                disabled={isUpdating}
                onClick={handleCheckOut}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Chấm công ra
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceQuery.isLoading ? (
            <Table>
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
              description="Thông tin chấm công sẽ xuất hiện sau khi nhân viên thực hiện check-in."
            />
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

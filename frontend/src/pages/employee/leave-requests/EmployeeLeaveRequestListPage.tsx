import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
} from 'lucide-react'

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
import { useLeaveRequestsQuery } from '@/features/leave-request/hooks/useLeaveRequestsQuery'
import type {
  LeaveRequestStatus,
  LeaveType,
} from '@/features/leave-request/types/leaveRequest.types'

const leaveTypeLabel: Record<LeaveType, string> = {
  ANNUAL: 'Nghỉ phép năm',
  SICK: 'Nghỉ ốm',
  UNPAID: 'Nghỉ không lương',
  OTHER: 'Khác',
}

const statusLabel: Record<LeaveRequestStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
}

const statusTone: Record<LeaveRequestStatus, StatusBadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN').format(new Date(date))

export function EmployeeLeaveRequestListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const leaveRequestsQuery = useLeaveRequestsQuery(
    {
      page,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    'employee',
  )

  const leaveRequests = leaveRequestsQuery.data?.data ?? []
  const meta = leaveRequestsQuery.data?.meta
  const totalPages = meta?.totalPages ?? 1
  const pageSize = meta?.limit ?? 10
  const totalItems = meta?.totalItems ?? 0
  const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, totalItems)

  const navigateToDetail = (id: string) => {
    navigate(`/employee/leave-requests/${id}`)
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Đơn nghỉ phép
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi trạng thái các yêu cầu nghỉ phép của bạn.
          </p>
        </div>

        <Button
          type="button"
          className="w-full md:w-auto"
          onClick={() => navigate('/employee/leave-requests/create')}
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          Tạo đơn nghỉ phép
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Danh sách đơn nghỉ phép</CardTitle>
          <CardDescription>
            Các yêu cầu nghỉ phép đã gửi và trạng thái xử lý.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {leaveRequestsQuery.isLoading ? (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Loại nghỉ phép</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRowsSkeleton columns={6} />
              </TableBody>
            </Table>
          ) : null}

          {leaveRequestsQuery.isFetching && !leaveRequestsQuery.isLoading ? (
            <p className="mb-3 text-right text-xs text-muted-foreground">
              Đang cập nhật dữ liệu...
            </p>
          ) : null}

          {leaveRequestsQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải danh sách đơn nghỉ phép
            </p>
          ) : null}

          {leaveRequestsQuery.isSuccess && leaveRequests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Chưa có đơn nghỉ phép"
              description="Bạn có thể tạo đơn nghỉ phép khi cần xin nghỉ."
            />
          ) : null}

          {leaveRequests.length > 0 ? (
            <>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Loại nghỉ phép</TableHead>
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead>Ngày kết thúc</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((leaveRequest) => (
                    <TableRow
                      key={leaveRequest.id}
                      className="cursor-pointer"
                      onClick={() => navigateToDetail(leaveRequest.id)}
                    >
                      <TableCell className="font-medium">
                        {leaveTypeLabel[leaveRequest.leaveType]}
                      </TableCell>
                      <TableCell>{formatDate(leaveRequest.startDate)}</TableCell>
                      <TableCell>{formatDate(leaveRequest.endDate)}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge
                          label={statusLabel[leaveRequest.status]}
                          tone={statusTone[leaveRequest.status]}
                          className="font-semibold ring-1 ring-current/10"
                        />
                      </TableCell>
                      <TableCell>{formatDate(leaveRequest.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-primary"
                          aria-label="Xem chi tiết đơn nghỉ phép"
                          title="Xem chi tiết đơn nghỉ phép"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigateToDetail(leaveRequest.id)
                          }}
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {fromItem}-{toItem} trong tổng số {totalItems} đơn
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

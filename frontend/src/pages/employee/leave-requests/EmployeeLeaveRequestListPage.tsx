import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

const statusClassName: Record<LeaveRequestStatus, string> = {
  PENDING: 'border-border bg-secondary text-secondary-foreground',
  APPROVED: 'border-primary/20 bg-primary/10 text-primary',
  REJECTED: 'border-destructive/20 bg-destructive/10 text-destructive',
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

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Đơn nghỉ phép của tôi
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi các đơn nghỉ phép và trạng thái xét duyệt.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate('/employee/leave-requests/create')}
        >
          Tạo đơn nghỉ phép
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách đơn nghỉ phép</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequestsQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              Đang tải danh sách đơn nghỉ phép...
            </p>
          ) : null}

          {leaveRequestsQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải danh sách đơn nghỉ phép
            </p>
          ) : null}

          {leaveRequestsQuery.isSuccess && leaveRequests.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Chưa có đơn nghỉ phép nào
            </p>
          ) : null}

          {leaveRequests.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại nghỉ phép</TableHead>
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead>Ngày kết thúc</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((leaveRequest) => (
                    <TableRow
                      key={leaveRequest.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/employee/leave-requests/${leaveRequest.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        {leaveTypeLabel[leaveRequest.leaveType]}
                      </TableCell>
                      <TableCell>{formatDate(leaveRequest.startDate)}</TableCell>
                      <TableCell>{formatDate(leaveRequest.endDate)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClassName[leaveRequest.status]}`}
                        >
                          {statusLabel[leaveRequest.status]}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(leaveRequest.createdAt)}</TableCell>
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

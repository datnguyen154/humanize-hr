import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  LeaveRequestSortBy,
  LeaveRequestSortOrder,
  LeaveRequestStatus,
  LeaveType,
} from '@/features/leave-request/types/leaveRequest.types'

type StatusFilter = 'ALL' | LeaveRequestStatus

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
]

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

export function LeaveRequestListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [sortBy, setSortBy] = useState<LeaveRequestSortBy>('createdAt')
  const [sortOrder, setSortOrder] = useState<LeaveRequestSortOrder>('desc')

  const leaveRequestsQuery = useLeaveRequestsQuery({
    page,
    limit: 10,
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    sortBy,
    sortOrder,
  })

  const leaveRequests = leaveRequestsQuery.data?.data ?? []
  const meta = leaveRequestsQuery.data?.meta
  const totalPages = meta?.totalPages ?? 1

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: StatusFilter) => {
    setStatus(value)
    setPage(1)
  }

  const handleSort = (column: LeaveRequestSortBy) => {
    setPage(1)

    if (sortBy === column) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(column)
    setSortOrder('asc')
  }

  const renderSortIcon = (column: LeaveRequestSortBy) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="size-4" aria-hidden="true" />
    }

    return sortOrder === 'asc' ? (
      <ArrowUp className="size-4" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-4" aria-hidden="true" />
    )
  }

  const renderSortableHeader = (
    label: string,
    column: LeaveRequestSortBy,
  ) => (
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

  const navigateToDetail = (id: string) => {
    navigate(`/admin/leave-requests/${id}`)
  }

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Quản lý đơn nghỉ phép
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi danh sách và trạng thái đơn nghỉ phép trong hệ thống.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-lg">Danh sách đơn nghỉ phép</CardTitle>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              placeholder="Tìm theo mã hoặc tên nhân viên"
              className="h-10 md:max-w-sm"
              onChange={(event) => handleSearchChange(event.target.value)}
            />

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={status === option.value ? 'default' : 'outline'}
                  onClick={() => handleStatusChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
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
                    <TableHead>Mã nhân viên</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Loại nghỉ phép</TableHead>
                    <TableHead>
                      {renderSortableHeader('Ngày bắt đầu', 'startDate')}
                    </TableHead>
                    <TableHead>
                      {renderSortableHeader('Ngày kết thúc', 'endDate')}
                    </TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>
                      {renderSortableHeader('Ngày tạo', 'createdAt')}
                    </TableHead>
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
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigateToDetail(leaveRequest.id)
                          }}
                        >
                          {leaveRequest.employee.employeeCode}
                        </button>
                      </TableCell>
                      <TableCell>{leaveRequest.employee.fullName}</TableCell>
                      <TableCell>
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
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
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

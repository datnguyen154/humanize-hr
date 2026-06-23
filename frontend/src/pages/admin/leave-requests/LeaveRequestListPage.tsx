import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
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

const statusTone: Record<LeaveRequestStatus, StatusBadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

const statusRingClassName: Record<LeaveRequestStatus, string> = {
  PENDING: 'ring-amber-200',
  APPROVED: 'ring-emerald-200',
  REJECTED: 'ring-red-200',
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
  const pageSize = meta?.limit ?? 10
  const totalItems = meta?.totalItems ?? 0
  const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, totalItems)

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
    <section>
      <Card>
        <CardHeader className="gap-4">
          <div className="grid gap-1.5">
            <CardTitle className="text-lg">Danh sách đơn nghỉ phép</CardTitle>
            <CardDescription>
              Theo dõi và xử lý các yêu cầu nghỉ phép của nhân viên.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                placeholder="Tìm theo mã hoặc tên nhân viên..."
                className="h-10 pl-10"
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </div>

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
            <Table>
              <TableBody>
                <TableRowsSkeleton columns={8} />
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
              description="Các yêu cầu nghỉ phép sẽ xuất hiện tại đây."
            />
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
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead>
                      {renderSortableHeader('Ngày tạo', 'createdAt')}
                    </TableHead>
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
                      <TableCell className="text-center">
                        <StatusBadge
                          label={statusLabel[leaveRequest.status]}
                          tone={statusTone[leaveRequest.status]}
                          className={`font-semibold ring-1 ring-inset ${statusRingClassName[leaveRequest.status]}`}
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
                      setPage((current) => Math.max(current - 1, 1))
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

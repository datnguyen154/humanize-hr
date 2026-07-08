import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Search,
  Users,
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
import {
  employeeStatusLabel,
  formatEmployeeDate,
  useEmployeesQuery,
  type EmployeeSortBy,
  type EmployeeSortOrder,
  type EmployeeStatus,
} from '@/features/employee'

import { EmployeeDetailDialog } from './components/EmployeeDetailDialog'

type StatusFilter = 'ALL' | EmployeeStatus

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đang làm việc', value: 'ACTIVE' },
  { label: 'Tạm ngưng', value: 'INACTIVE' },
]

const employeeStatusTone: Record<EmployeeStatus, StatusBadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
}

export function EmployeeListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [sortBy, setSortBy] = useState<EmployeeSortBy>('employeeCode')
  const [sortOrder, setSortOrder] = useState<EmployeeSortOrder>('asc')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  )

  const employeesQuery = useEmployeesQuery({
    page,
    limit: 10,
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    sortBy,
    sortOrder,
  })

  const employees = employeesQuery.data?.data ?? []
  const meta = employeesQuery.data?.meta
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

  const handleSort = (column: EmployeeSortBy) => {
    setPage(1)

    if (sortBy === column) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(column)
    setSortOrder('asc')
  }

  const renderSortIcon = (column: EmployeeSortBy) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="size-4" aria-hidden="true" />
    }

    return sortOrder === 'asc' ? (
      <ArrowUp className="size-4" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-4" aria-hidden="true" />
    )
  }

  const openEmployeeDialog = (id: string) => {
    setSelectedEmployeeId(id)
  }

  return (
    <section className="min-w-0 overflow-x-hidden">
      <Card className="min-w-0">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1.5">
              <CardTitle className="text-lg">Danh sách nhân viên</CardTitle>
              <CardDescription>
                Theo dõi thông tin cơ bản và trạng thái làm việc của nhân viên.
              </CardDescription>
            </div>

            <Button
              type="button"
              className="w-full shrink-0 gap-2 sm:w-auto"
              onClick={() => navigate('/admin/employees/create')}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Thêm nhân viên
            </Button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                placeholder="Tìm theo tên hoặc email..."
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
          {employeesQuery.isLoading ? (
            <>
              <div className="grid gap-3 md:hidden">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid flex-1 gap-2">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="mt-4 grid gap-3">
                      <Skeleton className="h-4 w-full max-w-64" />
                      <Skeleton className="h-4 w-full max-w-48" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableBody>
                    <TableRowsSkeleton columns={8} />
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}

          {employeesQuery.isFetching && !employeesQuery.isLoading ? (
            <p className="mb-3 text-right text-xs text-muted-foreground">
              Đang cập nhật dữ liệu...
            </p>
          ) : null}

          {employeesQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải danh sách nhân viên
            </p>
          ) : null}

          {employeesQuery.isSuccess && employees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Chưa có nhân viên"
              description="Hãy tạo nhân viên đầu tiên để bắt đầu quản lý nhân sự."
            />
          ) : null}

          {employees.length > 0 ? (
            <>
              <div className="grid gap-3 md:hidden">
                {employees.map((employee) => (
                  <article
                    key={employee.id}
                    className="min-w-0 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          Họ tên
                        </p>
                        <h3 className="mt-1 break-words text-base font-semibold text-foreground">
                          {employee.fullName}
                        </h3>
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Mã nhân viên
                          </p>
                          <p className="mt-1 text-sm font-medium text-primary">
                            {employee.employeeCode}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Trạng thái
                        </p>
                        <StatusBadge
                          label={employeeStatusLabel[employee.status]}
                          tone={employeeStatusTone[employee.status]}
                        />
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm">
                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-muted-foreground">
                          Email
                        </dt>
                        <dd className="mt-1 break-all text-foreground">
                          {employee.email}
                        </dd>
                      </div>
                      {employee.position ? (
                        <div className="min-w-0">
                          <dt className="text-xs font-medium text-muted-foreground">
                            Chức vụ
                          </dt>
                          <dd className="mt-1 break-words text-foreground">
                            {employee.position}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full gap-2"
                      onClick={() => openEmployeeDialog(employee.id)}
                    >
                      <Eye className="size-4" aria-hidden="true" />
                      Xem chi tiết
                    </Button>
                  </article>
                ))}
              </div>

              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto justify-start gap-1 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => handleSort('employeeCode')}
                      >
                        Mã nhân viên
                        {renderSortIcon('employeeCode')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto justify-start gap-1 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => handleSort('fullName')}
                      >
                        Họ tên
                        {renderSortIcon('fullName')}
                      </Button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Chức vụ</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto justify-start gap-1 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => handleSort('joinedAt')}
                      >
                        Ngày vào làm
                        {renderSortIcon('joinedAt')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow
                      key={employee.id}
                      className="cursor-pointer"
                      onClick={() => openEmployeeDialog(employee.id)}
                    >
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={(event) => {
                            event.stopPropagation()
                            openEmployeeDialog(employee.id)
                          }}
                        >
                          {employee.employeeCode}
                        </button>
                      </TableCell>
                      <TableCell>{employee.fullName}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge
                          label={employeeStatusLabel[employee.status]}
                          tone={employeeStatusTone[employee.status]}
                        />
                      </TableCell>
                      <TableCell>{formatEmployeeDate(employee.joinedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-primary"
                          aria-label="Xem chi tiết nhân viên"
                          title="Xem chi tiết nhân viên"
                          onClick={(event) => {
                            event.stopPropagation()
                            openEmployeeDialog(employee.id)
                          }}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {fromItem} đến {toItem} trong tổng số {totalItems}{' '}
                  nhân viên
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

      <EmployeeDetailDialog
        employeeId={selectedEmployeeId}
        open={Boolean(selectedEmployeeId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEmployeeId(null)
          }
        }}
      />
    </section>
  )
}

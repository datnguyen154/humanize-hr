import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
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
import { useDepartmentsQuery } from '@/features/department/hooks/useDepartmentsQuery'
import type {
  DepartmentSortBy,
  DepartmentSortOrder,
  DepartmentStatus,
} from '@/features/department/types/department.types'

type StatusFilter = 'ALL' | DepartmentStatus

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đang hoạt động', value: 'ACTIVE' },
  { label: 'Tạm ngưng', value: 'INACTIVE' },
]

const departmentStatusLabel: Record<DepartmentStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Tạm ngưng',
}

const departmentStatusTone: Record<DepartmentStatus, StatusBadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN').format(new Date(date))

export function DepartmentListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [sortBy, setSortBy] = useState<DepartmentSortBy>('name')
  const [sortOrder, setSortOrder] = useState<DepartmentSortOrder>('asc')

  const departmentsQuery = useDepartmentsQuery({
    page,
    limit: 10,
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    sortBy,
    sortOrder,
  })

  const departments = departmentsQuery.data?.data ?? []
  const meta = departmentsQuery.data?.meta
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

  const handleSort = (column: DepartmentSortBy) => {
    setPage(1)

    if (sortBy === column) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(column)
    setSortOrder('asc')
  }

  const renderSortIcon = (column: DepartmentSortBy) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="size-4" aria-hidden="true" />
    }

    return sortOrder === 'asc' ? (
      <ArrowUp className="size-4" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-4" aria-hidden="true" />
    )
  }

  const navigateToDetail = (id: string) => {
    navigate(`/admin/departments/${id}`)
  }

  return (
    <section>
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1.5">
              <CardTitle className="text-lg">Danh sách phòng ban</CardTitle>
              <CardDescription>
                Theo dõi thông tin cơ bản và trạng thái hoạt động của phòng ban.
              </CardDescription>
            </div>

            <Button
              type="button"
              className="w-full shrink-0 gap-2 sm:w-auto"
              onClick={() => navigate('/admin/departments/create')}
            >
              <Plus className="size-4" aria-hidden="true" />
              Thêm phòng ban
            </Button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                placeholder="Tìm kiếm phòng ban..."
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
          {departmentsQuery.isLoading ? (
            <Table>
              <TableBody>
                <TableRowsSkeleton columns={5} />
              </TableBody>
            </Table>
          ) : null}

          {departmentsQuery.isFetching && !departmentsQuery.isLoading ? (
            <p className="mb-3 text-right text-xs text-muted-foreground">
              Đang cập nhật dữ liệu...
            </p>
          ) : null}

          {departmentsQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải danh sách phòng ban
            </p>
          ) : null}

          {departmentsQuery.isSuccess && departments.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Chưa có phòng ban"
              description="Tạo phòng ban đầu tiên để tổ chức nhân sự hiệu quả hơn."
            />
          ) : null}

          {departments.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto justify-start gap-1 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => handleSort('name')}
                      >
                        Tên phòng ban
                        {renderSortIcon('name')}
                      </Button>
                    </TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        className="mx-auto h-auto justify-center gap-1 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => handleSort('status')}
                      >
                        Trạng thái
                        {renderSortIcon('status')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto justify-start gap-1 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => handleSort('createdAt')}
                      >
                        Ngày tạo
                        {renderSortIcon('createdAt')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow
                      key={department.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => navigateToDetail(department.id)}
                    >
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigateToDetail(department.id)
                          }}
                        >
                          {department.name}
                        </button>
                      </TableCell>
                      <TableCell>{department.description}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge
                          label={departmentStatusLabel[department.status]}
                          tone={departmentStatusTone[department.status]}
                        />
                      </TableCell>
                      <TableCell>{formatDate(department.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-primary"
                          aria-label="Xem chi tiết phòng ban"
                          title="Xem chi tiết phòng ban"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigateToDetail(department.id)
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
                  Hiển thị {fromItem}-{toItem} trong tổng số {totalItems} phòng
                  ban
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

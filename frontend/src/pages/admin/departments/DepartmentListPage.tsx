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
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Quản lý phòng ban
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi danh sách và trạng thái phòng ban trong hệ thống.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate('/admin/departments/create')}
        >
          Thêm phòng ban
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-lg">Danh sách phòng ban</CardTitle>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              placeholder="Tìm theo tên phòng ban"
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
          {departmentsQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              Đang tải danh sách phòng ban...
            </p>
          ) : null}

          {departmentsQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải danh sách phòng ban
            </p>
          ) : null}

          {departmentsQuery.isSuccess && departments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Chưa có phòng ban nào
            </p>
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
                    <TableHead>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto justify-start gap-1 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow
                      key={department.id}
                      className="cursor-pointer"
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
                      <TableCell>
                        {departmentStatusLabel[department.status]}
                      </TableCell>
                      <TableCell>{formatDate(department.createdAt)}</TableCell>
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

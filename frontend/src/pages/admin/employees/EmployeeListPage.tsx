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
import { useEmployeesQuery } from '@/features/employee/hooks/useEmployeesQuery'
import type {
  EmployeeSortBy,
  EmployeeSortOrder,
  EmployeeStatus,
} from '@/features/employee/types/employee.types'

type StatusFilter = 'ALL' | EmployeeStatus

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đang làm việc', value: 'ACTIVE' },
  { label: 'Tạm ngưng', value: 'INACTIVE' },
]

const statusLabel: Record<EmployeeStatus, string> = {
  ACTIVE: 'Đang làm việc',
  INACTIVE: 'Tạm ngưng',
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN').format(new Date(date))

export function EmployeeListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [sortBy, setSortBy] = useState<EmployeeSortBy>('employeeCode')
  const [sortOrder, setSortOrder] = useState<EmployeeSortOrder>('asc')

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

  const navigateToDetail = (id: string) => {
    navigate(`/admin/employees/${id}`)
  }

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Quản lý nhân viên
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi danh sách và trạng thái nhân sự trong hệ thống.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-lg">Danh sách nhân viên</CardTitle>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              placeholder="Tìm theo tên hoặc email"
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
          {employeesQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              Đang tải danh sách nhân viên...
            </p>
          ) : null}

          {employeesQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải danh sách nhân viên
            </p>
          ) : null}

          {employeesQuery.isSuccess && employees.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Không có nhân viên nào
            </p>
          ) : null}

          {employees.length > 0 ? (
            <>
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
                    <TableHead>Trạng thái</TableHead>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow
                      key={employee.id}
                      className="cursor-pointer"
                      onClick={() => navigateToDetail(employee.id)}
                    >
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigateToDetail(employee.id)
                          }}
                        >
                          {employee.employeeCode}
                        </button>
                      </TableCell>
                      <TableCell>{employee.fullName}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{statusLabel[employee.status]}</TableCell>
                      <TableCell>{formatDate(employee.joinedAt)}</TableCell>
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

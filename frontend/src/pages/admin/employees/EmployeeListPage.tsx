import {
  FileSpreadsheet,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileUp,
  Loader2,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { AxiosError } from 'axios'
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
import { useDepartmentOptionsQuery } from '@/features/department/hooks/useDepartmentOptionsQuery'
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
  useExportEmployeesMutation,
  useEmployeesQuery,
  type ExportEmployeesParams,
  type EmployeeSortBy,
  type EmployeeSortOrder,
  type EmployeeStatus,
} from '@/features/employee'
import { showErrorToast } from '@/lib/toast'

import { EmployeeDetailDialog } from './components/EmployeeDetailDialog'
import { ImportEmployeesDialog } from './components/ImportEmployeesDialog'

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

const formatDateForFilename = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getFallbackExportFilename = () =>
  `employees-${formatDateForFilename(new Date())}.xlsx`

const parseFilenameFromContentDisposition = (
  contentDisposition?: string,
): string | null => {
  if (!contentDisposition) return null

  const encodedFilenameMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  )

  if (encodedFilenameMatch?.[1]) {
    try {
      return decodeURIComponent(
        encodedFilenameMatch[1].trim().replace(/^"|"$/g, ''),
      )
    } catch {
      return encodedFilenameMatch[1].trim().replace(/^"|"$/g, '')
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)

  return filenameMatch?.[1]?.trim() || null
}

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    URL.revokeObjectURL(objectUrl)
  }
}

const getExportEmployeesErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError && error.response?.status === 400) {
    return 'Bộ lọc hoặc sắp xếp không hợp lệ.'
  }

  return 'Không thể xuất danh sách nhân viên. Vui lòng thử lại sau.'
}

export function EmployeeListPage() {
  const navigate = useNavigate()
  const exportEmployeesMutation = useExportEmployeesMutation()
  const departmentOptionsQuery = useDepartmentOptionsQuery()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [departmentId, setDepartmentId] = useState<string | undefined>()
  const [sortBy, setSortBy] = useState<EmployeeSortBy>('employeeCode')
  const [sortOrder, setSortOrder] = useState<EmployeeSortOrder>('asc')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  )
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const employeesQuery = useEmployeesQuery({
    page,
    limit: 10,
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    departmentId,
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

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value || undefined)
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
      return <ArrowUpDown className="size-4 shrink-0" aria-hidden="true" />
    }

    return sortOrder === 'asc' ? (
      <ArrowUp className="size-4 shrink-0" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-4 shrink-0" aria-hidden="true" />
    )
  }

  const openEmployeeDialog = (id: string) => {
    setSelectedEmployeeId(id)
  }

  const handleExportEmployees = async () => {
    if (exportEmployeesMutation.isPending) {
      return
    }

    const exportParams: ExportEmployeesParams = {
      search: search.trim() || undefined,
      status: status === 'ALL' ? undefined : status,
      departmentId,
      sortBy,
      sortOrder,
    }

    try {
      const { blob, contentDisposition } =
        await exportEmployeesMutation.mutateAsync(exportParams)
      const filename =
        parseFilenameFromContentDisposition(contentDisposition) ??
        getFallbackExportFilename()

      triggerBrowserDownload(blob, filename)
    } catch (error) {
      showErrorToast(
        getExportEmployeesErrorMessage(error),
        'Xuất Excel thất bại',
      )
    }
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

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full shrink-0 gap-2 sm:w-auto"
                onClick={() => setIsImportDialogOpen(true)}
              >
                <FileUp className="size-4" aria-hidden="true" />
                Nhập Excel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full shrink-0 gap-2 sm:w-auto"
                disabled={exportEmployeesMutation.isPending}
                onClick={() => void handleExportEmployees()}
              >
                {exportEmployeesMutation.isPending ? (
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <FileSpreadsheet className="size-4" aria-hidden="true" />
                )}
                {exportEmployeesMutation.isPending
                  ? 'Đang xuất...'
                  : 'Xuất Excel'}
              </Button>
              <Button
                type="button"
                className="w-full shrink-0 gap-2 sm:w-auto"
                onClick={() => navigate('/admin/employees/create')}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Thêm nhân viên
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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

            <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
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
              <div className="w-full md:w-64">
                <label htmlFor="employee-department-filter" className="sr-only">
                  Lọc theo phòng ban
                </label>
                <select
                  id="employee-department-filter"
                  value={departmentId ?? ''}
                  className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onChange={(event) => handleDepartmentChange(event.target.value)}
                >
                  <option value="">Tất cả phòng ban</option>
                  {departmentOptionsQuery.data?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {departmentOptionsQuery.isError ? (
                  <p className="mt-1 text-xs text-destructive">
                    Không thể tải danh sách phòng ban.
                  </p>
                ) : null}
                {departmentOptionsQuery.isSuccess &&
                departmentOptionsQuery.data.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Chưa có phòng ban.
                  </p>
                ) : null}
              </div>
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
                    <TableRowsSkeleton columns={9} />
                  </TableBody>
                </Table>
              </div>
            </>
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
                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-muted-foreground">
                          Phòng ban
                        </dt>
                        <dd className="mt-1 break-words text-foreground">
                          {employee.department?.name || 'Chưa phân phòng ban'}
                        </dd>
                      </div>
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
                    <TableHead>Phòng ban</TableHead>
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
                      <TableCell className="max-w-48 whitespace-normal break-words">
                        {employee.department?.name || 'Chưa phân phòng ban'}
                      </TableCell>
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
      <ImportEmployeesDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </section>
  )
}

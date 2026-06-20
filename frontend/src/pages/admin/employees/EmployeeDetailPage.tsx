import { AxiosError } from 'axios'
import { ArrowLeft, Ban, Pencil, UserCog } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
import {
  employeeStatusLabel,
  formatEmployeeDate,
  useEmployeeDetailQuery,
  useUpdateEmployeeStatusMutation,
  type EmployeeStatus,
} from '@/features/employee'

const employeeStatusTone: Record<EmployeeStatus, StatusBadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
}

export function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const employeeQuery = useEmployeeDetailQuery(id ?? '')
  const updateEmployeeStatusMutation = useUpdateEmployeeStatusMutation()
  const [statusError, setStatusError] = useState<string | null>(null)
  const employee = employeeQuery.data
  const nextStatus: EmployeeStatus =
    employee?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  const avatarFallback = employee?.fullName
    ? employee.fullName
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'NV'

  const handleStatusUpdate = async () => {
    if (!id || !employee) {
      return
    }

    const confirmMessage =
      employee.status === 'ACTIVE'
        ? 'Bạn có chắc muốn tạm ngưng nhân viên này?'
        : 'Bạn có chắc muốn kích hoạt lại nhân viên này?'

    if (!window.confirm(confirmMessage)) {
      return
    }

    setStatusError(null)

    try {
      await updateEmployeeStatusMutation.mutateAsync({
        id,
        status: nextStatus,
      })
    } catch (error) {
      if (error instanceof AxiosError) {
        setStatusError('Cập nhật trạng thái nhân viên thất bại')
        return
      }

      setStatusError('Cập nhật trạng thái nhân viên thất bại')
    }
  }

  return (
    <section className="grid gap-5">
      {statusError ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {statusError}
        </p>
      ) : null}

      {employeeQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Đang tải thông tin nhân viên...
          </CardContent>
        </Card>
      ) : null}

      {employeeQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Không thể tải thông tin nhân viên
          </CardContent>
        </Card>
      ) : null}

      {employee ? (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary ring-4 ring-primary/5">
                    {avatarFallback}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        {employee.fullName}
                      </h2>
                      <StatusBadge
                        label={employeeStatusLabel[employee.status]}
                        tone={employeeStatusTone[employee.status]}
                      />
                    </div>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {employee.position}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Mã nhân viên:{' '}
                      <span className="font-medium text-foreground">
                        {employee.employeeCode}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/employees')}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Quay lại danh sách
                  </Button>
                  <Button
                    type="button"
                    disabled={!id}
                    onClick={() => navigate(`/admin/employees/${id}/edit`)}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Sửa thông tin
                  </Button>
                  <Button
                    type="button"
                    variant={
                      employee.status === 'ACTIVE' ? 'destructive' : 'default'
                    }
                    disabled={updateEmployeeStatusMutation.isPending}
                    onClick={handleStatusUpdate}
                  >
                    {employee.status === 'ACTIVE' ? (
                      <Ban className="size-4" aria-hidden="true" />
                    ) : (
                      <UserCog className="size-4" aria-hidden="true" />
                    )}
                    {employee.status === 'ACTIVE'
                      ? 'Tạm ngưng nhân viên'
                      : 'Kích hoạt lại'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-sm text-muted-foreground">Email</dt>
                    <dd className="break-all text-sm font-medium text-foreground">
                      {employee.email}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-sm text-muted-foreground">
                      Số điện thoại
                    </dt>
                    <dd className="text-sm font-medium text-foreground">
                      {employee.phone}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-4 last:pb-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-sm text-muted-foreground">
                      Ngày vào làm
                    </dt>
                    <dd className="text-sm font-medium text-foreground">
                      {formatEmployeeDate(employee.joinedAt)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin công việc</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-sm text-muted-foreground">
                      Mã nhân viên
                    </dt>
                    <dd className="text-sm font-medium text-foreground">
                      {employee.employeeCode}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-sm text-muted-foreground">Chức vụ</dt>
                    <dd className="text-sm font-medium text-foreground">
                      {employee.position}
                    </dd>
                  </div>
                  <div className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-4">
                    <dt className="text-sm text-muted-foreground">
                      Trạng thái
                    </dt>
                    <dd>
                      <StatusBadge
                        label={employeeStatusLabel[employee.status]}
                        tone={employeeStatusTone[employee.status]}
                      />
                    </dd>
                  </div>
                  <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-sm text-muted-foreground">Ngày tạo</dt>
                    <dd className="text-sm font-medium text-foreground">
                      {formatEmployeeDate(employee.createdAt)}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-4 last:pb-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-sm text-muted-foreground">
                      Ngày cập nhật
                    </dt>
                    <dd className="text-sm font-medium text-foreground">
                      {formatEmployeeDate(employee.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  )
}

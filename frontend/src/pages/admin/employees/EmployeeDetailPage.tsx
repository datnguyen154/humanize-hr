import { AxiosError } from 'axios'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUpdateEmployeeStatusMutation } from '@/features/employee/hooks/useUpdateEmployeeStatusMutation'
import { useEmployeeDetailQuery } from '@/features/employee/hooks/useEmployeesQuery'
import type { EmployeeStatus } from '@/features/employee/types/employee.types'

const statusLabel: Record<EmployeeStatus, string> = {
  ACTIVE: 'Đang làm việc',
  INACTIVE: 'Tạm ngưng',
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN').format(new Date(date))

export function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const employeeQuery = useEmployeeDetailQuery(id ?? '')
  const updateEmployeeStatusMutation = useUpdateEmployeeStatusMutation()
  const [statusError, setStatusError] = useState<string | null>(null)
  const employee = employeeQuery.data
  const nextStatus: EmployeeStatus =
    employee?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

  const details = employee
    ? [
        { label: 'Mã nhân viên', value: employee.employeeCode },
        { label: 'Họ tên', value: employee.fullName },
        { label: 'Email', value: employee.email },
        { label: 'Số điện thoại', value: employee.phone },
        { label: 'Chức vụ', value: employee.position },
        { label: 'Trạng thái', value: statusLabel[employee.status] },
        { label: 'Ngày vào làm', value: formatDate(employee.joinedAt) },
        { label: 'Ngày tạo', value: formatDate(employee.createdAt) },
        { label: 'Ngày cập nhật', value: formatDate(employee.updatedAt) },
      ]
    : []

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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Chi tiết nhân viên
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem thông tin hồ sơ nhân viên trong hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/employees')}
          >
            Quay lại danh sách
          </Button>
          <Button
            type="button"
            disabled={!id}
            onClick={() => navigate(`/admin/employees/${id}/edit`)}
          >
            Sửa thông tin
          </Button>
          {employee ? (
            <Button
              type="button"
              variant={employee.status === 'ACTIVE' ? 'destructive' : 'default'}
              disabled={updateEmployeeStatusMutation.isPending}
              onClick={handleStatusUpdate}
            >
              {employee.status === 'ACTIVE'
                ? 'Tạm ngưng nhân viên'
                : 'Kích hoạt lại'}
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          {statusError ? (
            <p className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {statusError}
            </p>
          ) : null}

          {employeeQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              Đang tải thông tin nhân viên...
            </p>
          ) : null}

          {employeeQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải thông tin nhân viên
            </p>
          ) : null}

          {employee ? (
            <dl className="grid gap-4 md:grid-cols-2">
              {details.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <dt className="text-sm text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

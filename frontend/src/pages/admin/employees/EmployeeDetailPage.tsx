import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const employee = employeeQuery.data

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

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/admin/employees')}
        >
          Quay lại danh sách
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
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

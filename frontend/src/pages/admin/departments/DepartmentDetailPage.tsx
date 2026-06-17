import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDepartmentDetailQuery } from '@/features/department/hooks/useDepartmentsQuery'
import type { DepartmentStatus } from '@/features/department/types/department.types'

const departmentStatusLabel: Record<DepartmentStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Tạm ngưng',
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN').format(new Date(date))

export function DepartmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const departmentQuery = useDepartmentDetailQuery(id ?? '')
  const department = departmentQuery.data

  const details = department
    ? [
        { label: 'Tên phòng ban', value: department.name },
        { label: 'Mô tả', value: department.description },
        { label: 'Trạng thái', value: departmentStatusLabel[department.status] },
        { label: 'Ngày tạo', value: formatDate(department.createdAt) },
        { label: 'Ngày cập nhật', value: formatDate(department.updatedAt) },
      ]
    : []

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Chi tiết phòng ban
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem thông tin phòng ban trong hệ thống.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/admin/departments')}
        >
          Quay lại danh sách
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          {departmentQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              Đang tải thông tin phòng ban...
            </p>
          ) : null}

          {departmentQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải thông tin phòng ban
            </p>
          ) : null}

          {department ? (
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

import { AxiosError } from 'axios'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDepartmentDetailQuery } from '@/features/department/hooks/useDepartmentsQuery'
import { useUpdateDepartmentStatusMutation } from '@/features/department/hooks/useUpdateDepartmentStatusMutation'
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
  const updateDepartmentStatusMutation = useUpdateDepartmentStatusMutation()
  const [statusError, setStatusError] = useState<string | null>(null)
  const department = departmentQuery.data
  const nextStatus: DepartmentStatus =
    department?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

  const details = department
    ? [
        { label: 'Tên phòng ban', value: department.name },
        { label: 'Mô tả', value: department.description },
        { label: 'Trạng thái', value: departmentStatusLabel[department.status] },
        { label: 'Ngày tạo', value: formatDate(department.createdAt) },
        { label: 'Ngày cập nhật', value: formatDate(department.updatedAt) },
      ]
    : []

  const handleStatusUpdate = async () => {
    if (!id || !department) {
      return
    }

    const confirmMessage =
      department.status === 'ACTIVE'
        ? 'Bạn có chắc muốn tạm ngưng phòng ban này?'
        : 'Bạn có chắc muốn kích hoạt lại phòng ban này?'

    if (!window.confirm(confirmMessage)) {
      return
    }

    setStatusError(null)

    try {
      await updateDepartmentStatusMutation.mutateAsync({
        id,
        status: nextStatus,
      })
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          setStatusError('Trạng thái không hợp lệ')
          return
        }

        if (error.response?.status === 404) {
          setStatusError('Không tìm thấy phòng ban')
          return
        }
      }

      setStatusError('Cập nhật trạng thái phòng ban thất bại')
    }
  }

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

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/departments')}
          >
            Quay lại danh sách
          </Button>
          <Button
            type="button"
            onClick={() => navigate(`/admin/departments/${id}/edit`)}
            disabled={!department}
          >
            Sửa phòng ban
          </Button>
          {department ? (
            <Button
              type="button"
              variant={
                department.status === 'ACTIVE' ? 'destructive' : 'default'
              }
              disabled={updateDepartmentStatusMutation.isPending}
              onClick={handleStatusUpdate}
            >
              {department.status === 'ACTIVE'
                ? 'Tạm ngưng phòng ban'
                : 'Kích hoạt lại'}
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          {statusError ? (
            <p className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {statusError}
            </p>
          ) : null}

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

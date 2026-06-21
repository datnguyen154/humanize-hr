import { AxiosError } from 'axios'
import {
  ArrowLeft,
  Ban,
  Building2,
  CalendarPlus,
  CircleDot,
  FileText,
  History,
  Pencil,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
import { useDepartmentDetailQuery } from '@/features/department/hooks/useDepartmentsQuery'
import { useUpdateDepartmentStatusMutation } from '@/features/department/hooks/useUpdateDepartmentStatusMutation'
import type { DepartmentStatus } from '@/features/department/types/department.types'

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

type ProfileInformationFieldProps = {
  icon: LucideIcon
  label: string
  children: ReactNode
}

function ProfileInformationField({
  icon: Icon,
  label,
  children,
}: ProfileInformationFieldProps) {
  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words text-sm font-medium text-foreground">
          {children}
        </dd>
      </div>
    </div>
  )
}

export function DepartmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const departmentQuery = useDepartmentDetailQuery(id ?? '')
  const updateDepartmentStatusMutation = useUpdateDepartmentStatusMutation()
  const [statusError, setStatusError] = useState<string | null>(null)
  const department = departmentQuery.data
  const nextStatus: DepartmentStatus =
    department?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => navigate('/admin/departments')}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Quay lại danh sách
      </Button>

      {statusError ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {statusError}
        </p>
      ) : null}

      {departmentQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Đang tải thông tin phòng ban...
          </CardContent>
        </Card>
      ) : null}

      {departmentQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Không thể tải thông tin phòng ban
          </CardContent>
        </Card>
      ) : null}

      {department ? (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/5">
                    <Building2 className="size-9" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        {department.name}
                      </h2>
                      <StatusBadge
                        label={departmentStatusLabel[department.status]}
                        tone={departmentStatusTone[department.status]}
                      />
                    </div>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      {department.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => navigate(`/admin/departments/${id}/edit`)}
                    disabled={!department}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Sửa phòng ban
                  </Button>
                  <Button
                    type="button"
                    variant={
                      department.status === 'ACTIVE' ? 'destructive' : 'default'
                    }
                    disabled={updateDepartmentStatusMutation.isPending}
                    onClick={handleStatusUpdate}
                  >
                    {department.status === 'ACTIVE' ? (
                      <Ban className="size-4" aria-hidden="true" />
                    ) : (
                      <UserCog className="size-4" aria-hidden="true" />
                    )}
                    {department.status === 'ACTIVE'
                      ? 'Tạm ngưng phòng ban'
                      : 'Kích hoạt lại'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin phòng ban</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <ProfileInformationField
                    icon={Building2}
                    label="Tên phòng ban"
                  >
                    {department.name}
                  </ProfileInformationField>
                  <ProfileInformationField icon={FileText} label="Mô tả">
                    {department.description}
                  </ProfileInformationField>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin hệ thống</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <ProfileInformationField
                    icon={CircleDot}
                    label="Trạng thái"
                  >
                    <StatusBadge
                      label={departmentStatusLabel[department.status]}
                      tone={departmentStatusTone[department.status]}
                    />
                  </ProfileInformationField>
                  <ProfileInformationField
                    icon={CalendarPlus}
                    label="Ngày tạo"
                  >
                    {formatDate(department.createdAt)}
                  </ProfileInformationField>
                  <ProfileInformationField
                    icon={History}
                    label="Ngày cập nhật"
                  >
                    {formatDate(department.updatedAt)}
                  </ProfileInformationField>
                </dl>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  )
}

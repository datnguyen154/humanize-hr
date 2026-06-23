import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  toDateInputValue,
  useEmployeeDetailQuery,
  useUpdateEmployeeMutation,
} from '@/features/employee'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ApiErrorResponse } from '@/shared/types'

const editEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Vui lòng nhập mã nhân viên'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  phone: z.string().optional(),
  position: z.string().min(1, 'Vui lòng nhập chức vụ'),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Vui lòng chọn trạng thái',
  }),
  joinedAt: z.string().min(1, 'Vui lòng chọn ngày vào làm'),
})

type EditEmployeeFormValues = z.infer<typeof editEmployeeSchema>

const getEditEmployeeErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as ApiErrorResponse | undefined)
      ?.message

    return message ?? 'Cập nhật nhân viên thất bại'
  }

  return 'Cập nhật nhân viên thất bại'
}

export function EditEmployeePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const employeeQuery = useEmployeeDetailQuery(id ?? '')
  const updateEmployeeMutation = useUpdateEmployeeMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      employeeCode: '',
      fullName: '',
      email: '',
      phone: '',
      position: '',
      status: 'ACTIVE',
      joinedAt: '',
    },
  })

  useEffect(() => {
    if (!employeeQuery.data) {
      return
    }

    reset({
      employeeCode: employeeQuery.data.employeeCode,
      fullName: employeeQuery.data.fullName,
      email: employeeQuery.data.email,
      phone: employeeQuery.data.phone ?? '',
      position: employeeQuery.data.position,
      status: employeeQuery.data.status,
      joinedAt: toDateInputValue(employeeQuery.data.joinedAt),
    })
  }, [employeeQuery.data, reset])

  const onSubmit = async (values: EditEmployeeFormValues) => {
    if (!id) {
      return
    }

    setFormError(null)

    try {
      await updateEmployeeMutation.mutateAsync({
        id,
        payload: {
          employeeCode: values.employeeCode,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone?.trim() || undefined,
          position: values.position,
          status: values.status,
          joinedAt: new Date(`${values.joinedAt}T00:00:00.000Z`).toISOString(),
        },
      })

      showSuccessToast('Thông tin nhân viên đã được cập nhật.')
      navigate(`/admin/employees/${id}`)
    } catch (error) {
      setFormError(getEditEmployeeErrorMessage(error))
      showErrorToast()
    }
  }

  if (employeeQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 border-t pt-5">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (employeeQuery.isError) {
    return (
      <p className="py-8 text-center text-destructive">
        Không thể tải thông tin nhân viên
      </p>
    )
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Sửa thông tin nhân viên
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cập nhật hồ sơ nhân viên trong hệ thống.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/admin/employees/${id}`)}
        >
          Quay lại chi tiết
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            {formError ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="employeeCode">Mã nhân viên</Label>
                <Input id="employeeCode" {...register('employeeCode')} />
                {errors.employeeCode ? (
                  <p className="text-sm text-destructive">
                    {errors.employeeCode.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fullName">Họ tên</Label>
                <Input id="fullName" {...register('fullName')} />
                {errors.fullName ? (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email ? (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" {...register('phone')} />
                {errors.phone ? (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">Chức vụ</Label>
                <Input id="position" {...register('position')} />
                {errors.position ? (
                  <p className="text-sm text-destructive">
                    {errors.position.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register('status')}
                >
                  <option value="ACTIVE">Đang làm việc</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
                {errors.status ? (
                  <p className="text-sm text-destructive">
                    {errors.status.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="joinedAt">Ngày vào làm</Label>
                <Input id="joinedAt" type="date" {...register('joinedAt')} />
                {errors.joinedAt ? (
                  <p className="text-sm text-destructive">
                    {errors.joinedAt.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/employees/${id}`)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                {updateEmployeeMutation.isPending
                  ? 'Đang cập nhật...'
                  : 'Cập nhật nhân viên'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

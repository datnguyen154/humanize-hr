import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateEmployeeMutation } from '@/features/employee'
import type { ApiErrorResponse } from '@/shared/types'

const createEmployeeSchema = z.object({
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

type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>

const getCreateEmployeeErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as ApiErrorResponse | undefined)
      ?.message

    return message ?? 'Không thể tạo nhân viên. Vui lòng kiểm tra lại thông tin.'
  }

  return 'Không thể tạo nhân viên. Vui lòng thử lại sau.'
}

export function CreateEmployeePage() {
  const navigate = useNavigate()
  const createEmployeeMutation = useCreateEmployeeMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
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

  const onSubmit = async (values: CreateEmployeeFormValues) => {
    setFormError(null)

    try {
      await createEmployeeMutation.mutateAsync({
        employeeCode: values.employeeCode,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone?.trim() || undefined,
        position: values.position,
        status: values.status,
        joinedAt: new Date(`${values.joinedAt}T00:00:00.000Z`).toISOString(),
      })

      navigate('/admin/employees')
    } catch (error) {
      setFormError(getCreateEmployeeErrorMessage(error))
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Thêm nhân viên
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo hồ sơ nhân viên mới trong hệ thống.
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
                onClick={() => navigate('/admin/employees')}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createEmployeeMutation.isPending}>
                {createEmployeeMutation.isPending
                  ? 'Đang tạo...'
                  : 'Tạo nhân viên'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

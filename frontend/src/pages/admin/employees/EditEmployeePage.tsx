import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/shared/components/DatePicker'
import { useDepartmentOptionsQuery } from '@/features/department/hooks/useDepartmentOptionsQuery'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useEmployeeDetailQuery,
  useUpdateEmployeeMutation,
} from '@/features/employee'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

import {
  employeeEditSchema,
  emptyEmployeeEditFormValues,
  toEmployeeEditFormValues,
  toUpdateEmployeeRequest,
  type EmployeeEditFormValues,
} from './employee-edit-form'
import { getEmployeeDepartmentErrorMessage } from './employee-error-messages'

const getEditEmployeeErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return getEmployeeDepartmentErrorMessage(error, 'Cập nhật nhân viên thất bại')
  }

  return 'Cập nhật nhân viên thất bại'
}

export function EditEmployeePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const employeeQuery = useEmployeeDetailQuery(id ?? '')
  const updateEmployeeMutation = useUpdateEmployeeMutation()
  const departmentOptionsQuery = useDepartmentOptionsQuery()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeEditFormValues>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: emptyEmployeeEditFormValues,
  })

  useEffect(() => {
    if (!employeeQuery.data) {
      return
    }

    reset(toEmployeeEditFormValues(employeeQuery.data))
  }, [employeeQuery.data, reset])

  const onSubmit = async (values: EmployeeEditFormValues) => {
    if (!id) {
      return
    }

    setFormError(null)

    try {
      await updateEmployeeMutation.mutateAsync({
        id,
        payload: toUpdateEmployeeRequest(
          values,
          employeeQuery.data?.departmentId ?? null,
        ),
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
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="group mb-4 inline-flex w-fit cursor-pointer items-center gap-2 rounded-md bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
          onClick={() => navigate(`/admin/employees/${id}`)}
        >
          <ArrowLeft
            className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Quay lại chi tiết
        </Button>

        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Sửa thông tin nhân viên
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cập nhật hồ sơ nhân viên trong hệ thống.
        </p>
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
                <Label htmlFor="departmentId">Phòng ban</Label>
                <select
                  id="departmentId"
                  className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  disabled={departmentOptionsQuery.isLoading}
                  {...register('departmentId')}
                >
                  <option value="">Chưa phân phòng ban</option>
                  {departmentOptionsQuery.data?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {departmentOptionsQuery.isError ? (
                  <p className="text-sm text-destructive">
                    Không thể tải danh sách phòng ban.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">
                  Trạng thái
                </Label>
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
                <Controller
                  control={control}
                  name="joinedAt"
                  render={({ field }) => (
                    <DatePicker
                      id="joinedAt"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={Boolean(errors.joinedAt)}
                    />
                  )}
                />
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

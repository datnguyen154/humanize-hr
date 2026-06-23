import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useDepartmentDetailQuery } from '@/features/department/hooks/useDepartmentsQuery'
import { useUpdateDepartmentMutation } from '@/features/department/hooks/useUpdateDepartmentMutation'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ApiErrorResponse } from '@/shared/types'

const editDepartmentSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên phòng ban'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

type EditDepartmentFormValues = z.infer<typeof editDepartmentSchema>

const getEditDepartmentErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 409) {
      return 'Tên phòng ban đã tồn tại'
    }

    if (error.response?.status === 404) {
      return 'Không tìm thấy phòng ban'
    }

    const message = (error.response?.data as ApiErrorResponse | undefined)
      ?.message

    return message ?? 'Cập nhật phòng ban thất bại'
  }

  return 'Cập nhật phòng ban thất bại'
}

export function EditDepartmentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const departmentQuery = useDepartmentDetailQuery(id ?? '')
  const updateDepartmentMutation = useUpdateDepartmentMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditDepartmentFormValues>({
    resolver: zodResolver(editDepartmentSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'ACTIVE',
    },
  })

  useEffect(() => {
    if (!departmentQuery.data) {
      return
    }

    reset({
      name: departmentQuery.data.name,
      description: departmentQuery.data.description ?? '',
      status: departmentQuery.data.status,
    })
  }, [departmentQuery.data, reset])

  const onSubmit = async (values: EditDepartmentFormValues) => {
    if (!id) {
      return
    }

    setFormError(null)

    try {
      await updateDepartmentMutation.mutateAsync({
        id,
        payload: {
          name: values.name,
          description: values.description?.trim() || null,
          status: values.status,
        },
      })

      showSuccessToast('Thông tin phòng ban đã được cập nhật.')
      navigate(`/admin/departments/${id}`)
    } catch (error) {
      setFormError(getEditDepartmentErrorMessage(error))
      showErrorToast()
    }
  }

  if (departmentQuery.isLoading) {
    return (
      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="grid gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-3 border-t pt-5">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (departmentQuery.isError) {
    return (
      <p className="py-8 text-center text-destructive">
        Không thể tải thông tin phòng ban
      </p>
    )
  }

  return (
    <section className="mx-auto w-full max-w-4xl">
      <Card>
        <CardHeader className="gap-1.5 border-b border-border">
          <CardTitle className="text-lg">Thông tin phòng ban</CardTitle>
          <CardDescription>
            Nhập thông tin cơ bản của phòng ban.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
            {formError ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="grid gap-2.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Tên phòng ban <span className="text-destructive/80">*</span>
                </Label>
                <Input id="name" className="h-10" {...register('name')} />
                {errors.name ? (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2.5">
                <Label htmlFor="status" className="text-sm font-medium">
                  Trạng thái
                </Label>
                <select
                  id="status"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register('status')}
                >
                  <option value="" disabled>
                    Chọn trạng thái
                  </option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
                {errors.status ? (
                  <p className="text-xs text-destructive">
                    {errors.status.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2.5 md:col-span-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium"
                >
                  Mô tả
                </Label>
                <textarea
                  id="description"
                  className="min-h-32 resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register('description')}
                />
                {errors.description ? (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate(`/admin/departments/${id}`)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={updateDepartmentMutation.isPending}
              >
                {updateDepartmentMutation.isPending
                  ? 'Đang lưu...'
                  : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

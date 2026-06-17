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
import { useDepartmentDetailQuery } from '@/features/department/hooks/useDepartmentsQuery'
import { useUpdateDepartmentMutation } from '@/features/department/hooks/useUpdateDepartmentMutation'
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

      navigate(`/admin/departments/${id}`)
    } catch (error) {
      setFormError(getEditDepartmentErrorMessage(error))
    }
  }

  if (departmentQuery.isLoading) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Đang tải thông tin phòng ban...
      </p>
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
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Sửa phòng ban
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cập nhật thông tin phòng ban trong hệ thống.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/admin/departments/${id}`)}
        >
          Quay lại chi tiết
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin phòng ban</CardTitle>
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
                <Label htmlFor="name">Tên phòng ban</Label>
                <Input id="name" {...register('name')} />
                {errors.name ? (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
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
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
                {errors.status ? (
                  <p className="text-sm text-destructive">
                    {errors.status.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <textarea
                  id="description"
                  className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register('description')}
                />
                {errors.description ? (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/departments/${id}`)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updateDepartmentMutation.isPending}
              >
                {updateDepartmentMutation.isPending
                  ? 'Đang cập nhật...'
                  : 'Cập nhật phòng ban'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

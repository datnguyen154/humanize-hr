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
import { useCreateDepartmentMutation } from '@/features/department/hooks/useCreateDepartmentMutation'
import type { ApiErrorResponse } from '@/shared/types'

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên phòng ban'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

type CreateDepartmentFormValues = z.infer<typeof createDepartmentSchema>

const getCreateDepartmentErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 409) {
      return 'Tên phòng ban đã tồn tại'
    }

    const message = (error.response?.data as ApiErrorResponse | undefined)
      ?.message

    return message ?? 'Không thể tạo phòng ban. Vui lòng kiểm tra lại thông tin.'
  }

  return 'Không thể tạo phòng ban. Vui lòng thử lại sau.'
}

export function CreateDepartmentPage() {
  const navigate = useNavigate()
  const createDepartmentMutation = useCreateDepartmentMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDepartmentFormValues>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'ACTIVE',
    },
  })

  const onSubmit = async (values: CreateDepartmentFormValues) => {
    setFormError(null)

    try {
      await createDepartmentMutation.mutateAsync({
        name: values.name,
        description: values.description?.trim() || null,
        status: values.status,
      })

      navigate('/admin/departments')
    } catch (error) {
      setFormError(getCreateDepartmentErrorMessage(error))
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Thêm phòng ban
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo phòng ban mới trong hệ thống.
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
                onClick={() => navigate('/admin/departments')}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createDepartmentMutation.isPending}
              >
                {createDepartmentMutation.isPending
                  ? 'Đang tạo...'
                  : 'Tạo phòng ban'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

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
import { useCreateLeaveRequestMutation } from '@/features/leave-request/hooks/useCreateLeaveRequestMutation'
import type { ApiErrorResponse } from '@/shared/types'

const createLeaveRequestSchema = z
  .object({
    leaveType: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER'], {
      message: 'Vui lòng chọn loại nghỉ phép',
    }),
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
    reason: z.string().trim().min(1, 'Vui lòng nhập lý do nghỉ phép'),
  })
  .refine(
    (values) =>
      !values.startDate ||
      !values.endDate ||
      values.endDate >= values.startDate,
    {
      message: 'Khoảng thời gian nghỉ không hợp lệ',
      path: ['endDate'],
    },
  )

type CreateLeaveRequestFormValues = z.infer<
  typeof createLeaveRequestSchema
>

const getCreateLeaveRequestErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as ApiErrorResponse | undefined)
      ?.message

    if (
      message === 'startDate must be before or equal endDate' ||
      message === 'Invalid startDate' ||
      message === 'Invalid endDate'
    ) {
      return 'Khoảng thời gian nghỉ không hợp lệ'
    }

    if (message === 'reason is required') {
      return 'Vui lòng nhập lý do nghỉ phép'
    }
  }

  return 'Không thể tạo đơn nghỉ phép'
}

const toIsoDate = (date: string) =>
  new Date(`${date}T00:00:00.000Z`).toISOString()

export function CreateLeaveRequestPage() {
  const navigate = useNavigate()
  const createLeaveRequestMutation = useCreateLeaveRequestMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeaveRequestFormValues>({
    resolver: zodResolver(createLeaveRequestSchema),
    defaultValues: {
      leaveType: 'ANNUAL',
      startDate: '',
      endDate: '',
      reason: '',
    },
  })

  const onSubmit = async (values: CreateLeaveRequestFormValues) => {
    setFormError(null)

    try {
      await createLeaveRequestMutation.mutateAsync({
        leaveType: values.leaveType,
        startDate: toIsoDate(values.startDate),
        endDate: toIsoDate(values.endDate),
        reason: values.reason,
      })

      navigate('/employee/leave-requests')
    } catch (error) {
      setFormError(getCreateLeaveRequestErrorMessage(error))
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Tạo đơn nghỉ phép
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhập thông tin thời gian và lý do nghỉ phép.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/employee/leave-requests')}
        >
          Quay lại danh sách
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin nghỉ phép</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            {formError ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="leaveType">Loại nghỉ phép</Label>
                <select
                  id="leaveType"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register('leaveType')}
                >
                  <option value="ANNUAL">Nghỉ phép năm</option>
                  <option value="SICK">Nghỉ ốm</option>
                  <option value="UNPAID">Nghỉ không lương</option>
                  <option value="OTHER">Khác</option>
                </select>
                {errors.leaveType ? (
                  <p className="text-sm text-destructive">
                    {errors.leaveType.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate ? (
                  <p className="text-sm text-destructive">
                    {errors.startDate.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
                {errors.endDate ? (
                  <p className="text-sm text-destructive">
                    {errors.endDate.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="reason">Lý do</Label>
                <textarea
                  id="reason"
                  className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register('reason')}
                />
                {errors.reason ? (
                  <p className="text-sm text-destructive">
                    {errors.reason.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/employee/leave-requests')}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createLeaveRequestMutation.isPending}
              >
                {createLeaveRequestMutation.isPending
                  ? 'Đang tạo...'
                  : 'Tạo đơn nghỉ phép'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

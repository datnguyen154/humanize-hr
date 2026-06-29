import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
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
import { useCreateLeaveRequestMutation } from '@/features/leave-request/hooks/useCreateLeaveRequestMutation'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
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

      showSuccessToast(
        'Đơn nghỉ phép của bạn đã được gửi để chờ phê duyệt.',
        'Gửi đơn thành công',
      )
      navigate('/employee/leave-requests')
    } catch (error) {
      const errorMessage = getCreateLeaveRequestErrorMessage(error)
      setFormError(errorMessage)
      showErrorToast(
        errorMessage === 'Không thể tạo đơn nghỉ phép'
          ? 'Vui lòng kiểm tra thông tin và thử lại.'
          : errorMessage,
        'Gửi đơn thất bại',
      )
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => navigate('/employee/leave-requests')}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Quay lại danh sách
      </Button>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Tạo đơn nghỉ phép</CardTitle>
          <CardDescription>
            Nhập thời gian và lý do nghỉ phép của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
            {formError ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="leaveType" className="text-sm font-medium">
                  Loại nghỉ phép <span className="text-destructive">*</span>
                </Label>
                <select
                  id="leaveType"
                  aria-label="Chọn loại nghỉ phép"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register('leaveType')}
                >
                  <option value="ANNUAL">Nghỉ phép năm</option>
                  <option value="SICK">Nghỉ ốm</option>
                  <option value="UNPAID">Nghỉ không lương</option>
                  <option value="OTHER">Khác</option>
                </select>
                {errors.leaveType ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.leaveType.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Ngày bắt đầu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  className="h-10"
                  {...register('startDate')}
                />
                {errors.startDate ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.startDate.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  Ngày kết thúc <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  className="h-10"
                  {...register('endDate')}
                />
                {errors.endDate ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.endDate.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  Lý do nghỉ phép <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="reason"
                  placeholder="Nhập lý do nghỉ phép..."
                  className="min-h-32 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register('reason')}
                />
                {errors.reason ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.reason.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate('/employee/leave-requests')}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 sm:w-[190px]"
                disabled={createLeaveRequestMutation.isPending}
              >
                {createLeaveRequestMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                {createLeaveRequestMutation.isPending
                  ? 'Đang gửi...'
                  : 'Gửi đơn nghỉ phép'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { ArrowLeft, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import { Label } from '@/components/ui/label'
import { useLeaveApproversQuery } from '@/features/leave-request/hooks/useLeaveApproversQuery'
import { DatePicker } from '@/shared/components/DatePicker'
import { useCreateLeaveRequestMutation } from '@/features/leave-request/hooks/useCreateLeaveRequestMutation'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ApiErrorResponse } from '@/shared/types'

const createLeaveRequestSchema = z
  .object({
    leaveType: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER'], {
      message: 'Vui lòng chọn loại nghỉ phép',
    }),
    approverId: z.string().min(1, 'Vui lòng chọn người duyệt.'),
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

    if (message === 'approverId is required') {
      return 'Vui lòng chọn người duyệt.'
    }

    if (message === 'Invalid approverId') {
      return 'Người duyệt không hợp lệ.'
    }

    if (message === 'Approver not found') {
      return 'Không tìm thấy người duyệt đã chọn.'
    }

    if (message === 'Approver is not eligible') {
      return 'Người duyệt đã chọn hiện không khả dụng.'
    }
  }

  return 'Không thể tạo đơn nghỉ phép'
}

const toIsoDate = (date: string) =>
  new Date(`${date}T00:00:00.000Z`).toISOString()

export function CreateLeaveRequestPage() {
  const navigate = useNavigate()
  const createLeaveRequestMutation = useCreateLeaveRequestMutation()
  const approversQuery = useLeaveApproversQuery()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeaveRequestFormValues>({
    resolver: zodResolver(createLeaveRequestSchema),
    defaultValues: {
      leaveType: 'ANNUAL',
      approverId: '',
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
        approverId: values.approverId,
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
        className="group inline-flex w-fit cursor-pointer items-center gap-2 rounded-md bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
        onClick={() => navigate('/employee/leave-requests')}
      >
        <ArrowLeft
          className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
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

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="approverId" className="text-sm font-medium">
                  Người duyệt <span className="text-destructive">*</span>
                </Label>
                <select
                  id="approverId"
                  aria-label="Chọn người duyệt"
                  disabled={approversQuery.isLoading || approversQuery.isError}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('approverId')}
                >
                  <option value="">
                    {approversQuery.isLoading
                      ? 'Đang tải người duyệt...'
                      : 'Chọn người duyệt'}
                  </option>
                  {approversQuery.data?.map((approver) => (
                    <option key={approver.id} value={approver.id}>
                      {approver.fullName} - {approver.email}
                    </option>
                  ))}
                </select>
                {approversQuery.isError ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
                    <span role="alert">Không thể tải danh sách người duyệt.</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void approversQuery.refetch()}
                    >
                      Thử lại
                    </Button>
                  </div>
                ) : null}
                {!approversQuery.isLoading &&
                !approversQuery.isError &&
                approversQuery.data?.length === 0 ? (
                  <p className="text-sm text-muted-foreground" role="alert">
                    Hiện chưa có người duyệt khả dụng.
                  </p>
                ) : null}
                {errors.approverId ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.approverId.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Ngày bắt đầu <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      id="startDate"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={Boolean(errors.startDate)}
                    />
                  )}
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
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      id="endDate"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={Boolean(errors.endDate)}
                    />
                  )}
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
                disabled={
                  createLeaveRequestMutation.isPending ||
                  approversQuery.isLoading ||
                  approversQuery.isError ||
                  approversQuery.data?.length === 0
                }
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

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAttendanceHistory } from '@/features/attendance/api/attendance.api'
import { useCreateAttendanceAdjustmentMutation } from '@/features/attendance/hooks/useAttendanceAdjustmentMutations'
import { attendanceQueryKeys } from '@/features/attendance/hooks/useAttendanceHistoryQuery'
import { getAttendanceAdjustmentError } from '@/features/attendance/lib/attendance-adjustment'
import { DatePicker } from '@/shared/components/DatePicker'
import { showSuccessToast } from '@/lib/toast'

const schema = z.object({
  attendanceDate: z.string().min(1, 'Vui lòng chọn ngày chấm công.'),
  checkInTime: z.string().min(1, 'Vui lòng nhập giờ vào.'),
  checkOutTime: z.string(),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do.').max(1000, 'Lý do không được quá 1000 ký tự.'),
}).refine((value) => !value.checkOutTime || value.checkOutTime > value.checkInTime, {
  path: ['checkOutTime'], message: 'Giờ ra phải sau giờ vào.',
})

type FormValues = z.infer<typeof schema>
const companyTime = (value: string | null) => value ? new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value)) : ''
const toIso = (date: string, time: string) => new Date(`${date}T${time}:00+07:00`).toISOString()

type Props = {
  onSuccess: () => void
  onClose?: () => void
  onPendingChange?: (pending: boolean) => void
}

export function AttendanceAdjustmentForm({ onSuccess, onClose, onPendingChange }: Props) {
  const mutation = useCreateAttendanceAdjustmentMutation()
  const [serverError, setServerError] = useState<string | null>(null)
  const { control, register, handleSubmit, formState: { errors }, getValues, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { attendanceDate: '', checkInTime: '', checkOutTime: '', reason: '' },
  })
  const date = useWatch({ control, name: 'attendanceDate' })
  const historyParams = { page: 1, limit: 1, fromDate: date, toDate: date }
  const history = useQuery({
    queryKey: attendanceQueryKeys.history(historyParams),
    queryFn: () => getAttendanceHistory(historyParams),
    enabled: Boolean(date),
  })
  const current = history.data?.data[0]
  const prefilledDate = useRef('')

  useEffect(() => {
    onPendingChange?.(mutation.isPending)
  }, [mutation.isPending, onPendingChange])

  useEffect(() => {
    if (!current || prefilledDate.current === date) return
    prefilledDate.current = date
    if (!getValues('checkInTime')) setValue('checkInTime', companyTime(current.checkInTime))
    if (!getValues('checkOutTime')) setValue('checkOutTime', companyTime(current.checkOutTime))
  }, [current, date, getValues, setValue])

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await mutation.mutateAsync({
        attendanceDate: values.attendanceDate,
        checkInTime: toIso(values.attendanceDate, values.checkInTime),
        checkOutTime: values.checkOutTime ? toIso(values.attendanceDate, values.checkOutTime) : null,
        reason: values.reason.trim(),
      })
      showSuccessToast('Đã gửi yêu cầu điều chỉnh chấm công.')
      onSuccess()
    } catch (error) {
      setServerError(getAttendanceAdjustmentError(error, 'Không thể gửi yêu cầu điều chỉnh.'))
    }
  }

  return <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
      <div className="min-h-0 overflow-y-auto p-6">
      <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-5">
        <p className="text-sm text-muted-foreground">Dùng khi thiếu chấm công hoặc giờ vào/ra chưa đúng. Quản trị viên sẽ kiểm tra trước khi dữ liệu được cập nhật.</p>
        {serverError ? <p role="alert" className="text-sm text-destructive">{serverError}</p> : null}
        <div className="grid gap-2"><Label htmlFor="attendanceDate">Ngày chấm công</Label>
          <Controller name="attendanceDate" control={control} render={({ field }) => <DatePicker id="attendanceDate" value={field.value} modal={Boolean(onClose)} popoverClassName="z-[60] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto" onChange={(value) => { prefilledDate.current = ''; reset({ attendanceDate: value, checkInTime: '', checkOutTime: '', reason: getValues('reason') }); setServerError(null) }} aria-invalid={Boolean(errors.attendanceDate)} />} />
          {errors.attendanceDate ? <p className="text-sm text-destructive">{errors.attendanceDate.message}</p> : null}
        </div>
        {date && history.isLoading ? <p className="text-sm text-muted-foreground">Đang kiểm tra chấm công hiện có...</p> : null}
        {date && history.isError ? <p role="alert" className="text-sm text-destructive">Không thể kiểm tra chấm công ngày này. Vui lòng thử lại.</p> : null}
        {date && history.isSuccess ? <p className="text-sm text-muted-foreground">{current ? `Giờ hiện tại: ${companyTime(current.checkInTime)} - ${companyTime(current.checkOutTime) || '--:--'}` : 'Ngày này chưa có bản ghi chấm công.'}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="checkInTime">Giờ vào đề xuất</Label><Input id="checkInTime" type="time" aria-invalid={Boolean(errors.checkInTime)} {...register('checkInTime')} />{errors.checkInTime ? <p className="text-sm text-destructive">{errors.checkInTime.message}</p> : null}</div>
          <div className="grid gap-2"><Label htmlFor="checkOutTime">Giờ ra đề xuất (nếu có)</Label><Input id="checkOutTime" type="time" aria-invalid={Boolean(errors.checkOutTime)} {...register('checkOutTime')} />{errors.checkOutTime ? <p className="text-sm text-destructive">{errors.checkOutTime.message}</p> : null}</div>
        </div>
        <div className="grid gap-2"><Label htmlFor="reason">Lý do điều chỉnh</Label><textarea id="reason" rows={4} maxLength={1000} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" aria-invalid={Boolean(errors.reason)} {...register('reason')} />{errors.reason ? <p className="text-sm text-destructive">{errors.reason.message}</p> : null}</div>
      </fieldset>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:px-6">
        {onClose ? <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Hủy</Button> : <span />}
        <Button type="submit" disabled={mutation.isPending || Boolean(date && (history.isLoading || history.isError))}>{mutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}</Button>
      </div>
    </form>
}

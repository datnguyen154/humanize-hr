import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles, AlertCircle, RefreshCw, Check } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DEMO_WORK_SCHEDULE,
  parseWorkScheduleError,
  WEEKDAYS,
  workScheduleFormSchema,
  type WorkScheduleDto,
  type WorkScheduleFormValues,
} from '@/features/work-schedule'
import {
  useCreateWorkScheduleMutation,
  useUpdateWorkScheduleMutation,
} from '@/features/work-schedule'
import { showInfoToast, showSuccessToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/shared/components/DatePicker'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: WorkScheduleDto | null
  onRestoreFocus?: () => void
  onReloadFresh?: () => Promise<WorkScheduleDto | null>
}

export function WorkScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  onRestoreFocus,
  onReloadFresh,
}: Props) {
  const isEdit = Boolean(schedule)
  const createMutation = useCreateWorkScheduleMutation()
  const updateMutation = useUpdateWorkScheduleMutation()
  const isPending = createMutation.isPending || updateMutation.isPending
  const [serverError, setServerError] = useState<string | null>(null)
  const [conflictError, setConflictError] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [currentRevision, setCurrentRevision] = useState(schedule?.revision ?? 1)
  const isBusy = isPending || isReloading

  const defaultValues: WorkScheduleFormValues = schedule
    ? {
        effectiveFrom: schedule.effectiveFrom,
        weekdays: schedule.weekdays,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        breakStartTime: schedule.breaks[0]?.startTime ?? '',
        breakEndTime: schedule.breaks[0]?.endTime ?? '',
      }
    : {
        effectiveFrom: '',
        weekdays: [],
        startTime: '',
        endTime: '',
        breakStartTime: '',
        breakEndTime: '',
      }

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<WorkScheduleFormValues>({
    resolver: zodResolver(workScheduleFormSchema),
    defaultValues,
  })

  const selectedWeekdays = useWatch({ control, name: 'weekdays' }) || []

  const handleApplyDemo = () => {
    setValue('weekdays', [...DEMO_WORK_SCHEDULE.weekdays], {
      shouldValidate: true,
      shouldDirty: true,
    })
    setValue('startTime', DEMO_WORK_SCHEDULE.startTime, {
      shouldValidate: true,
      shouldDirty: true,
    })
    setValue('endTime', DEMO_WORK_SCHEDULE.endTime, {
      shouldValidate: true,
      shouldDirty: true,
    })
    setValue('breakStartTime', DEMO_WORK_SCHEDULE.breakStartTime, {
      shouldValidate: true,
      shouldDirty: true,
    })
    setValue('breakEndTime', DEMO_WORK_SCHEDULE.breakEndTime, {
      shouldValidate: true,
      shouldDirty: true,
    })

    if (!conflictError) setServerError(null)
    showInfoToast(
      'Đã điền: T2–T6, 08:00–17:00, nghỉ 12:00–13:00. Vui lòng chọn ngày hiệu lực.',
      'Đã áp dụng mẫu demo',
    )
  }

  const toggleWeekday = (day: number) => {
    const current = selectedWeekdays || []
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b)
    setValue('weekdays', updated, { shouldValidate: true, shouldDirty: true })
  }

  const handleReloadLatest = async () => {
    if (!onReloadFresh || isBusy) return
    setIsReloading(true)
    try {
      const fresh = await onReloadFresh()
      if (fresh) {
        reset({
          effectiveFrom: fresh.effectiveFrom,
          weekdays: fresh.weekdays,
          startTime: fresh.startTime,
          endTime: fresh.endTime,
          breakStartTime: fresh.breaks[0]?.startTime ?? '',
          breakEndTime: fresh.breaks[0]?.endTime ?? '',
        })
        setServerError(null)
        setConflictError(false)
        setCurrentRevision(fresh.revision)
        showInfoToast(
          `Đã tải lại bản nháp phiên bản rev ${fresh.revision}. Vui lòng kiểm tra lại.`,
          'Đã cập nhật dữ liệu mới',
        )
      }
    } catch (err) {
      const parsed = parseWorkScheduleError(
        err,
        'Không thể tải lại bản nháp mới nhất. Vui lòng thử lại.',
      )
      setServerError(parsed.message)
    } finally {
      setIsReloading(false)
    }
  }

  const onSubmit = async (values: WorkScheduleFormValues) => {
    if (isBusy) return
    setServerError(null)
    setConflictError(false)

    try {
      const payloadConfig = {
        effectiveFrom: values.effectiveFrom,
        timezone: 'Asia/Ho_Chi_Minh' as const,
        weekdays: [...values.weekdays].sort((a, b) => a - b),
        startTime: values.startTime,
        endTime: values.endTime,
        breaks: [
          {
            startTime: values.breakStartTime,
            endTime: values.breakEndTime,
          },
        ] as [{ startTime: string; endTime: string }],
      }

      if (isEdit && schedule) {
        await updateMutation.mutateAsync({
          id: schedule.id,
          payload: {
            expectedRevision: currentRevision,
            ...payloadConfig,
          },
        })
        showSuccessToast('Đã cập nhật bản nháp lịch làm việc.')
      } else {
        await createMutation.mutateAsync(payloadConfig)
        showSuccessToast('Đã tạo bản nháp lịch làm việc mới.')
      }

      onOpenChange(false)
    } catch (error) {
      const err = parseWorkScheduleError(
        error,
        isEdit
          ? 'Không thể cập nhật bản nháp lịch làm việc.'
          : 'Không thể tạo bản nháp lịch làm việc.',
      )

      if (err.isRevisionConflict) {
        setConflictError(true)
        setServerError(err.message)
      } else if (err.details) {
        setServerError(err.message)
        // Map server validation field errors to RHF if applicable
        if (err.details.effectiveFrom) {
          setError('effectiveFrom', { message: err.details.effectiveFrom })
        }
        if (err.details.weekdays) {
          setError('weekdays', { message: err.details.weekdays })
        }
        if (err.details.startTime) {
          setError('startTime', { message: err.details.startTime })
        }
        if (err.details.endTime) {
          setError('endTime', { message: err.details.endTime })
        }
        if (err.details['breaks.0.startTime']) {
          setError('breakStartTime', {
            message: err.details['breaks.0.startTime'],
          })
        }
        if (err.details['breaks.0.endTime']) {
          setError('breakEndTime', {
            message: err.details['breaks.0.endTime'],
          })
        }
        if (err.details.breaks) {
          setError('breakStartTime', { message: err.details.breaks })
        }
      } else {
        setServerError(err.message)
      }
    }
  }

  const handleClose = () => {
    if (!isBusy) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onRestoreFocus?.()
        }}
      >
        <DialogHeader className="shrink-0 border-b border-border p-6 pr-12">
          <DialogTitle>
            {isEdit
              ? `Chỉnh sửa bản nháp v${schedule?.version} (rev ${currentRevision})`
              : 'Tạo bản nháp lịch làm việc'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Cập nhật cấu hình ca làm việc cho bản nháp này. Cần đối soát trước khi lưu.'
              : 'Thiết lập thời gian ca làm việc chuẩn, các ngày trong tuần và khoảng nghỉ.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="min-h-0 overflow-y-auto p-6">
            <fieldset disabled={isBusy} className="grid min-w-0 gap-5">
              {/* Demo template button */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">
                  Mẫu chuẩn: T2–T6, 08:00–17:00, nghỉ 12:00–13:00.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyDemo}
                  disabled={isBusy}
                  className="gap-1.5 text-xs font-medium"
                >
                  <Sparkles className="size-3.5 text-amber-500" aria-hidden="true" />
                  Dùng mẫu demo
                </Button>
              </div>

              {/* Server error / Revision conflict alert */}
              {serverError ? (
                <div
                  role="alert"
                  className={cn(
                    'rounded-lg border p-4 text-sm',
                    conflictError
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'border-destructive/30 bg-destructive/10 text-destructive',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="font-semibold">
                        {conflictError ? 'Xung đột phiên bản (409 Conflict)' : 'Lỗi lưu bản nháp'}
                      </p>
                      <p className="mt-0.5 text-xs opacity-90">{serverError}</p>

                      {conflictError && onReloadFresh ? (
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleReloadLatest}
                            disabled={isBusy}
                            className="h-8 gap-1.5 text-xs"
                          >
                            <RefreshCw
                              className={cn(
                                'size-3.5',
                                isReloading && 'animate-spin',
                              )}
                              aria-hidden="true"
                            />
                            {isReloading
                              ? 'Đang tải lại...'
                              : 'Tải lại dữ liệu mới nhất'}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Effective Date */}
              <div className="grid gap-2">
                <Label htmlFor="effectiveFrom" className="text-sm font-medium">
                  Ngày hiệu lực <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="effectiveFrom"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="effectiveFrom"
                      value={field.value}
                      placeholder="Chọn ngày hiệu lực (YYYY-MM-DD)"
                      modal={true}
                      disabled={isBusy}
                      popoverClassName="z-[60] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto"
                      onChange={(value) => {
                        field.onChange(value)
                        if (!conflictError) setServerError(null)
                      }}
                      aria-invalid={Boolean(errors.effectiveFrom)}
                    />
                  )}
                />
                {errors.effectiveFrom ? (
                  <p className="text-xs text-destructive">
                    {errors.effectiveFrom.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Ngày bắt đầu áp dụng cấu hình lịch làm việc này.
                  </p>
                )}
              </div>

              {/* Weekdays selector */}
              <div className="grid gap-2">
                <Label className="text-sm font-medium">
                  Ngày làm việc trong tuần <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                  {WEEKDAYS.map((day) => {
                    const isSelected = selectedWeekdays.includes(day.value)
                    return (
                      <button
                        key={day.value}
                        type="button"
                        disabled={isBusy}
                        onClick={() => toggleWeekday(day.value)}
                        className={cn(
                          'flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                          isBusy && 'cursor-not-allowed opacity-50',
                        )}
                        aria-pressed={isSelected}
                      >
                        <span>{day.short}</span>
                        {isSelected ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
                {errors.weekdays ? (
                  <p className="text-xs text-destructive">
                    {errors.weekdays.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Chọn các ngày nhân viên cần đến công ty làm việc.
                  </p>
                )}
              </div>

              {/* Working Hours */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="startTime" className="text-sm font-medium">
                    Giờ vào ca <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    step="60"
                    placeholder="08:00"
                    aria-invalid={Boolean(errors.startTime)}
                    {...register('startTime')}
                  />
                  {errors.startTime ? (
                    <p className="text-xs text-destructive">
                      {errors.startTime.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endTime" className="text-sm font-medium">
                    Giờ ra ca <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    step="60"
                    placeholder="17:00"
                    aria-invalid={Boolean(errors.endTime)}
                    {...register('endTime')}
                  />
                  {errors.endTime ? (
                    <p className="text-xs text-destructive">
                      {errors.endTime.message}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Break interval */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-foreground">
                    Khoảng nghỉ giữa ca (Đúng 1 khoảng) <span className="text-destructive">*</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Khoảng thời gian này không tính vào giờ làm việc thực tế.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="breakStartTime"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Bắt đầu nghỉ
                    </Label>
                    <Input
                      id="breakStartTime"
                      type="time"
                      step="60"
                      placeholder="12:00"
                      aria-invalid={Boolean(errors.breakStartTime)}
                      {...register('breakStartTime')}
                    />
                    {errors.breakStartTime ? (
                      <p className="text-xs text-destructive">
                        {errors.breakStartTime.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <Label
                      htmlFor="breakEndTime"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Kết thúc nghỉ
                    </Label>
                    <Input
                      id="breakEndTime"
                      type="time"
                      step="60"
                      placeholder="13:00"
                      aria-invalid={Boolean(errors.breakEndTime)}
                      {...register('breakEndTime')}
                    />
                    {errors.breakEndTime ? (
                      <p className="text-xs text-destructive">
                        {errors.breakEndTime.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Timezone (Read-only) */}
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Múi giờ hệ thống
                </Label>
                <Input
                  value="Asia/Ho_Chi_Minh (Cố định UTC+07:00)"
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </div>
            </fieldset>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleClose}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isPending
                ? 'Đang lưu...'
                : isReloading
                  ? 'Đang tải lại...'
                  : isEdit
                    ? 'Lưu thay đổi'
                    : 'Tạo bản nháp'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

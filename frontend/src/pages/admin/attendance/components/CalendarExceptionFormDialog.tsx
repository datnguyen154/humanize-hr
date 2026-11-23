import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ExternalLink, Info, RefreshCw, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Controller, useForm, useWatch, type Path, type Resolver } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { CalendarEditorSnapshot } from '@/features/work-schedule/lib/calendar-exception.editor'
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
  compensatoryOffFormSchema,
  formatCivilDateVN,
  holidayFormSchema,
  parseCalendarExceptionError,
  swapFormSchema,
  useCreateCalendarExceptionMutation,
  useHolidayPresetsQuery,
  useUpdateCalendarExceptionMutation,
  workOverrideFormSchema,
  type CalendarExceptionDto,
  type CalendarExceptionKind,
  type CalendarExceptionPayload,
  type CalendarExceptionUnifiedFormValues,
  type HolidayPolicy,
} from '@/features/work-schedule'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/shared/components/DatePicker'
import { showInfoToast, showSuccessToast } from '@/lib/toast'
import { calendarYear, holidayName } from '@/features/work-schedule/lib/holiday-batch'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  versionId: string
  scheduleRevision: number
  exception?: CalendarExceptionDto | null
  effectiveFrom?: string
  defaultShift?: {
    startTime: string
    endTime: string
    breaks: [{ startTime: string; endTime: string }]
  } | null
  onReloadFresh?: () => Promise<CalendarEditorSnapshot>
  onRestoreFocus?: () => void
}

const KIND_OPTIONS: { value: CalendarExceptionKind; label: string; desc: string }[] = [
  { value: 'HOLIDAY', label: 'Ngày lễ', desc: 'Nghỉ lễ theo quy định nhà nước hoặc công ty' },
  { value: 'COMPENSATORY_OFF', label: 'Nghỉ bù', desc: 'Bố trí nghỉ bù cho ngày lễ trùng ngày nghỉ tuần' },
  { value: 'SWAP', label: 'Hoán đổi ngày làm', desc: 'Đổi ngày làm việc sang ngày nghỉ tuần và ngược lại' },
  { value: 'WORK_OVERRIDE', label: 'Điều chỉnh giờ làm', desc: 'Thay đổi ca làm việc/giờ nghỉ của một ngày cụ thể' },
]

export function CalendarExceptionFormDialog({
  open,
  onOpenChange,
  versionId,
  scheduleRevision,
  exception,
  effectiveFrom,
  defaultShift,
  onReloadFresh,
  onRestoreFocus,
}: Props) {
  const isEdit = Boolean(exception)
  const [selectedKind, setSelectedKind] = useState<CalendarExceptionKind>(
    exception?.payload.kind ?? 'HOLIDAY',
  )
  const [currentRevision, setCurrentRevision] = useState(scheduleRevision)
  const [serverError, setServerError] = useState<string | null>(null)
  const [conflictError, setConflictError] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const submittingRef = useRef(false)
  const [confirmAction, setConfirmAction] = useState<'close' | 'reload' | CalendarExceptionKind | null>(null)

  const createMutation = useCreateCalendarExceptionMutation(versionId)
  const updateMutation = useUpdateCalendarExceptionMutation(versionId)
  const isPending = createMutation.isPending || updateMutation.isPending
  const isBusy = isPending || isReloading

  const [holidayYear, setHolidayYear] = useState(() => calendarYear(exception?.payload.kind === 'HOLIDAY' ? exception.payload.date : effectiveFrom))

  // Dynamic schema based on selected kind
  const currentResolver = zodResolver(
    selectedKind === 'HOLIDAY'
      ? holidayFormSchema
      : selectedKind === 'COMPENSATORY_OFF'
        ? compensatoryOffFormSchema
        : selectedKind === 'SWAP'
          ? swapFormSchema
          : workOverrideFormSchema,
  )

  const defaultValuesForKind = (
    kind: CalendarExceptionKind,
    dto?: CalendarExceptionDto | null,
    shift = defaultShift,
  ): CalendarExceptionUnifiedFormValues => {
    if (dto && dto.payload.kind === kind) {
      const p = dto.payload
      switch (p.kind) {
        case 'HOLIDAY':
          return {
            kind: 'HOLIDAY',
            date: p.date,
            name: p.name,
            sourceReference: p.sourceReference,
            reason: p.reason,
            holidayCategory: p.holidayPolicy?.category ?? 'UNCLASSIFIED',
            presetId: p.holidayPolicy?.category === 'STATUTORY' ? p.holidayPolicy.presetId : '',
            isPaid: p.holidayPolicy?.category === 'COMPANY' ? p.holidayPolicy.isPaid : undefined,
          }
        case 'COMPENSATORY_OFF':
          return {
            kind: 'COMPENSATORY_OFF',
            date: p.date,
            sourceHolidayDate: p.sourceHolidayDate,
            reason: p.reason,
          }
        case 'SWAP':
          return {
            kind: 'SWAP',
            offDate: p.offDate,
            workDate: p.workDate,
            reason: p.reason,
          }
        case 'WORK_OVERRIDE':
          return {
            kind: 'WORK_OVERRIDE',
            date: p.date,
            startTime: p.startTime,
            endTime: p.endTime,
            breakStartTime: p.breaks[0]?.startTime ?? '',
            breakEndTime: p.breaks[0]?.endTime ?? '',
            reason: p.reason,
          }
      }
    }

    return {
      kind,
      date: '',
      name: '',
      sourceReference: '',
      holidayCategory: undefined,
      presetId: '',
      isPaid: undefined,
      sourceHolidayDate: '',
      offDate: '',
      workDate: '',
      startTime: shift?.startTime ?? '08:00',
      endTime: shift?.endTime ?? '17:00',
      breakStartTime: shift?.breaks[0]?.startTime ?? '12:00',
      breakEndTime: shift?.breaks[0]?.endTime ?? '13:00',
      reason: '',
    }
  }

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<CalendarExceptionUnifiedFormValues>({
    resolver: currentResolver as unknown as Resolver<CalendarExceptionUnifiedFormValues>,
    defaultValues: defaultValuesForKind(selectedKind, exception),
  })

  const holidayCategory = useWatch({ control, name: 'holidayCategory' })
  const { data: presetCatalog, isLoading: isPresetsLoading, isError: isPresetsError, refetch: refetchPresets } = useHolidayPresetsQuery(holidayYear, selectedKind === 'HOLIDAY' && holidayCategory === 'STATUTORY')
  const currentPresetId = useWatch({ control, name: 'presetId' })
  const currentIsPaid = useWatch({ control, name: 'isPaid' })
  const currentDate = useWatch({ control, name: 'date' })

  const selectedPreset = useMemo(
    () => presetCatalog?.presets.find((p) => p.id === currentPresetId),
    [presetCatalog?.presets, currentPresetId],
  )

  const handleKindChange = (kind: CalendarExceptionKind) => {
    if (isEdit || isBusy || conflictError || selectedKind === kind) return
    if (isDirty) { setConfirmAction(kind); return }
    applyKindChange(kind)
  }

  const applyKindChange = (kind: CalendarExceptionKind) => {
    setSelectedKind(kind)
    setServerError(null)
    reset(defaultValuesForKind(kind, null))
  }

  const handleApplyShiftDefaults = () => {
    if (defaultShift) {
      setValue('startTime', defaultShift.startTime, { shouldValidate: true, shouldDirty: true })
      setValue('endTime', defaultShift.endTime, { shouldValidate: true, shouldDirty: true })
      setValue('breakStartTime', defaultShift.breaks[0]?.startTime ?? '12:00', {
        shouldValidate: true,
        shouldDirty: true,
      })
      setValue('breakEndTime', defaultShift.breaks[0]?.endTime ?? '13:00', {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }

  const handleReloadLatest = async () => {
    if (!onReloadFresh || isBusy) return
    setIsReloading(true)
    setServerError(null)
    try {
      const res = await onReloadFresh()
      if (res) {
        setCurrentRevision(res.scheduleRevision)
        setConflictError(false)
        const kind = res.exception?.payload.kind ?? selectedKind
        setSelectedKind(kind)
        setHolidayYear(calendarYear(res.exception?.payload.kind === 'HOLIDAY' ? res.exception.payload.date : res.schedule.effectiveFrom))
        reset(defaultValuesForKind(kind, res.exception, res.schedule))
        showInfoToast(
          `Đã cập nhật phiên bản bản nháp rev ${res.scheduleRevision}.`,
          'Đã tải lại dữ liệu mới nhất',
        )
      }
    } catch (err) {
      const parsed = parseCalendarExceptionError(
        err,
        'Không thể tải lại dữ liệu bản nháp mới nhất.',
      )
      setServerError(parsed.message)
    } finally {
      setIsReloading(false)
    }
  }

  const onSubmit = async (values: CalendarExceptionUnifiedFormValues) => {
    if (submittingRef.current || isBusy || conflictError) return
    if (values.kind === 'HOLIDAY' && !exception && !['STATUTORY', 'COMPANY'].includes(values.holidayCategory ?? '')) {
      setError('holidayCategory', { message: 'Vui lòng chọn lễ pháp định hoặc ngày nghỉ doanh nghiệp.' })
      setServerError('Vui lòng phân loại ngày nghỉ trước khi lưu.')
      return
    }
    if (values.kind === 'HOLIDAY' && values.holidayCategory === 'STATUTORY' && !presetCatalog?.presets.some((p) => p.id === values.presetId && p.dates.includes(values.date ?? ''))) {
      setError('date', { message: 'Ngày lễ phải thuộc đúng phương án preset đã chọn.' })
      return
    }
    submittingRef.current = true
    setServerError(null)
    setConflictError(false)

    try {
      let payloadException: CalendarExceptionPayload

      switch (selectedKind) {
        case 'HOLIDAY': {
          let holidayPolicy: HolidayPolicy | undefined
          if (values.holidayCategory === 'STATUTORY' && values.presetId) {
            holidayPolicy = {
              category: 'STATUTORY',
              presetId: values.presetId,
            }
          } else if (values.holidayCategory === 'COMPANY' && typeof values.isPaid === 'boolean') {
            holidayPolicy = {
              category: 'COMPANY',
              isPaid: values.isPaid,
            }
          } else if (isEdit && exception?.payload.kind === 'HOLIDAY' && exception.payload.holidayPolicy) {
            holidayPolicy = exception.payload.holidayPolicy
          }

          payloadException = {
            kind: 'HOLIDAY',
            date: values.date!.trim(),
            name: values.name!.trim(),
            sourceReference: values.sourceReference!.trim(),
            reason: values.reason.trim(),
            ...(holidayPolicy ? { holidayPolicy } : {}),
          }
          break
        }
        case 'COMPENSATORY_OFF':
          payloadException = {
            kind: 'COMPENSATORY_OFF',
            date: values.date!.trim(),
            sourceHolidayDate: values.sourceHolidayDate!.trim(),
            reason: values.reason.trim(),
          }
          break
        case 'SWAP':
          payloadException = {
            kind: 'SWAP',
            offDate: values.offDate!.trim(),
            workDate: values.workDate!.trim(),
            reason: values.reason.trim(),
          }
          break
        case 'WORK_OVERRIDE':
          payloadException = {
            kind: 'WORK_OVERRIDE',
            date: values.date!.trim(),
            startTime: values.startTime!.trim(),
            endTime: values.endTime!.trim(),
            breaks: [
              {
                startTime: values.breakStartTime!.trim(),
                endTime: values.breakEndTime!.trim(),
              },
            ],
            reason: values.reason.trim(),
          }
          break
      }

      if (isEdit && exception) {
        await updateMutation.mutateAsync({
          id: exception.id,
          payload: {
            expectedRevision: currentRevision,
            exception: payloadException,
          },
        })
        showSuccessToast('Đã cập nhật ngoại lệ lịch làm việc thành công.')
      } else {
        await createMutation.mutateAsync({
          expectedRevision: currentRevision,
          exception: payloadException,
        })
        showSuccessToast('Đã thêm ngoại lệ lịch làm việc mới thành công.')
      }

      onOpenChange(false)
    } catch (error) {
      const parsed = parseCalendarExceptionError(
        error,
        isEdit
          ? 'Không thể cập nhật ngoại lệ lịch làm việc.'
          : 'Không thể thêm ngoại lệ lịch làm việc.',
      )

      if (parsed.isRevisionConflict) {
        setConflictError(true)
        setServerError(parsed.message)
      } else if (parsed.details) {
        setServerError(parsed.message)
        // Map field errors
        Object.entries(parsed.details).forEach(([key, msg]) => {
          const rawKey = key.replace('exception.', '')
          if (rawKey === 'breaks.0.startTime') {
            setError('breakStartTime', { message: msg })
          } else if (rawKey === 'breaks.0.endTime') {
            setError('breakEndTime', { message: msg })
          } else {
            if (['date', 'name', 'sourceReference', 'sourceHolidayDate', 'offDate', 'workDate', 'startTime', 'endTime', 'reason', 'breaks'].includes(rawKey)) {
              setError((rawKey === 'breaks' ? 'breakStartTime' : rawKey) as Path<CalendarExceptionUnifiedFormValues>, { message: msg })
            }
          }
        })
      } else {
        setServerError(parsed.message)
      }
    } finally {
      submittingRef.current = false
    }
  }

  const handleClose = () => {
    if (!isBusy) {
      if (isDirty) setConfirmAction('close')
      else onOpenChange(false)
    }
  }

  return (
    // Only the topmost dialog owns the focus trap while confirming a discard.
    <Dialog open={open} modal={confirmAction === null} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0"
        onInteractOutside={(event) => { if (confirmAction) event.preventDefault() }}
        onEscapeKeyDown={(event) => { if (confirmAction) event.preventDefault() }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onRestoreFocus?.()
        }}
      >
        <DialogHeader className="shrink-0 border-b border-border p-6 pr-12">
          <DialogTitle>
            {isEdit
              ? `Chỉnh sửa ngoại lệ (${KIND_OPTIONS.find((k) => k.value === selectedKind)?.label})`
              : 'Thêm ngoại lệ lịch làm việc'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Cập nhật cấu hình ngoại lệ theo phiên bản rev ${currentRevision}.`
              : 'Thiết lập ngày lễ, nghỉ bù, hoán đổi hoặc điều chỉnh ca làm việc trong bản nháp này.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => { void handleSubmit(onSubmit)(event) }}
        >
          <div className="min-h-0 overflow-y-auto p-6">
            <fieldset disabled={isBusy} className="grid min-w-0 gap-5">
              {/* Kind selection cards (only when create mode) */}
              {!isEdit ? (
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">
                    Loại ngoại lệ <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {KIND_OPTIONS.map((opt) => {
                      const isSelected = selectedKind === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={isBusy || conflictError}
                          onClick={() => handleKindChange(opt.value)}
                          className={cn(
                            'flex flex-col items-start rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isSelected
                              ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                            isBusy && 'cursor-not-allowed opacity-50',
                          )}
                          aria-pressed={isSelected}
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {opt.label}
                          </span>
                          <span className="mt-0.5 text-xs text-muted-foreground">
                            {opt.desc}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Server / Conflict Alert */}
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
                        {conflictError ? 'Xung đột phiên bản (409 Conflict)' : 'Lỗi xử lý ngoại lệ'}
                      </p>
                      <p className="mt-0.5 text-xs opacity-90">{serverError}</p>

                      {conflictError && onReloadFresh ? (
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => isDirty ? setConfirmAction('reload') : void handleReloadLatest()}
                            disabled={isBusy}
                            className="h-8 gap-1.5 text-xs"
                          >
                            <RefreshCw
                              className={cn('size-3.5', isReloading && 'animate-spin')}
                              aria-hidden="true"
                            />
                            {isReloading ? 'Đang tải lại...' : 'Tải lại dữ liệu mới nhất'}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* KIND 1: HOLIDAY */}
              {selectedKind === 'HOLIDAY' ? (
                <div className="grid gap-4">
                  {/* Category Selection: STATUTORY vs COMPANY */}
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">
                      Phân loại ngày nghỉ lễ {isEdit ? '(dữ liệu cũ có thể giữ chưa phân loại)' : '(bắt buộc)'}
                    </Label>
                    {holidayCategory === 'UNCLASSIFIED' ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                        Ngày lễ này chưa được phân loại chính sách (dữ liệu cũ). Bạn có thể chọn &quot;Lễ pháp định&quot; hoặc &quot;Nghỉ bổ sung doanh nghiệp&quot; bên dưới để chuẩn hóa.
                      </div>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={isBusy || conflictError}
                        onClick={() => {
                          if (holidayCategory !== 'STATUTORY') {
                            setValue('holidayCategory', 'STATUTORY', { shouldValidate: true, shouldDirty: true })
                            setValue('isPaid', undefined)
                          }
                        }}
                        className={cn(
                          'flex flex-col items-start rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          holidayCategory === 'STATUTORY'
                            ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                        )}
                        aria-pressed={holidayCategory === 'STATUTORY'}
                      >
                        <span className="text-xs font-bold text-foreground">Lễ pháp định</span>
                        <span className="mt-0.5 text-[11px] text-muted-foreground">
                          Theo Điều 112 Bộ luật Lao động, chọn từ danh mục xác minh
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy || conflictError}
                        onClick={() => {
                          if (holidayCategory !== 'COMPANY') {
                            setValue('holidayCategory', 'COMPANY', { shouldValidate: true, shouldDirty: true })
                            setValue('presetId', undefined)
                            if (holidayCategory === 'STATUTORY' || getValues('sourceReference')?.includes('Điều 112')) {
                              setValue('sourceReference', '', { shouldDirty: true })
                              setValue('reason', '', { shouldDirty: true })
                            }
                          }
                        }}
                        className={cn(
                          'flex flex-col items-start rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          holidayCategory === 'COMPANY'
                            ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                        )}
                        aria-pressed={holidayCategory === 'COMPANY'}
                      >
                        <span className="text-xs font-bold text-foreground">Nghỉ bổ sung doanh nghiệp</span>
                        <span className="mt-0.5 text-[11px] text-muted-foreground">
                          Ngày nghỉ riêng theo quyết định nội bộ (xác nhận rõ hưởng lương)
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* STATUTORY PRESET SELECTOR */}
                  {holidayCategory === 'STATUTORY' ? (
                    <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
                      <Label htmlFor="single-holiday-year">Năm danh mục</Label>
                      <Input id="single-holiday-year" type="number" min={1} max={9999} value={holidayYear}
                        onChange={(event) => { setHolidayYear(Number(event.target.value)); setValue('presetId', '', { shouldDirty: true, shouldValidate: true }) }} />
                      {isPresetsError ? <div role="alert">Không thể tải danh mục ngày lễ. <Button type="button" variant="outline" onClick={() => void refetchPresets()}>Thử lại danh mục</Button></div> : null}
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="statutory-preset-select" className="text-xs font-semibold">
                            Chọn mẫu ngày lễ pháp định ({holidayYear}) <span className="text-destructive">*</span>
                          </Label>
                          {isPresetsLoading ? (
                            <span className="text-[11px] text-muted-foreground animate-pulse">
                              Đang tải danh mục...
                            </span>
                          ) : null}
                        </div>

                        <select
                          id="statutory-preset-select"
                          value={currentPresetId || ''}
                          disabled={isBusy || isPresetsLoading}
                          onChange={(e) => {
                            const id = e.target.value
                            const preset = presetCatalog?.presets.find((p) => p.id === id)
                            if (preset) {
                              setValue('presetId', preset.id, { shouldValidate: true, shouldDirty: true })
                              setValue('name', preset.name, { shouldValidate: true, shouldDirty: true })
                              setValue('sourceReference', preset.sourceReference, { shouldValidate: true, shouldDirty: true })
                              setValue('reason', preset.suggestedReason, { shouldValidate: true, shouldDirty: true })
                              if (preset.dates.length === 1) {
                                setValue('date', preset.dates[0], { shouldValidate: true, shouldDirty: true })
                              } else if (!preset.dates.includes(currentDate || '')) {
                                setValue('date', preset.dates[0], { shouldValidate: true, shouldDirty: true })
                              }
                            } else {
                              setValue('presetId', '', { shouldValidate: true, shouldDirty: true })
                            }
                          }}
                          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">-- Chọn ngày lễ từ danh mục {holidayYear} --</option>
                          {presetCatalog?.presets.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.optionLabel ? `– ${p.optionLabel}` : ''} ({p.dates.length} ngày: {p.dates.map((d) => formatCivilDateVN(d)).join(', ')})
                            </option>
                          ))}
                        </select>
                        {errors.presetId ? (
                          <p className="text-xs text-destructive">{errors.presetId.message}</p>
                        ) : null}
                      </div>

                      {/* If selected preset has multiple dates, provide quick date selector buttons */}
                      {selectedPreset && selectedPreset.dates.length > 1 ? (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 grid gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <Info className="size-4 shrink-0" />
                            <span>Phương án này gồm {selectedPreset.dates.length} ngày lễ. Chọn ngày cho ngoại lệ này:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedPreset.dates.map((d) => {
                              const isDateSelected = currentDate === d
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => setValue('date', d, { shouldValidate: true, shouldDirty: true })}
                                  className={cn(
                                    'rounded border px-2.5 py-1 text-xs font-semibold transition-colors',
                                    isDateSelected
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                                  )}
                                >
                                  {formatCivilDateVN(d)}
                                </button>
                              )
                            })}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Đang cấu hình cho ngày: <span className="font-semibold text-foreground">{formatCivilDateVN(currentDate)}</span>. Để tạo đồng loạt cả kỳ nghỉ, hãy sử dụng tính năng "Thiết lập kỳ nghỉ nhiều ngày (Batch)" ngoài danh sách.
                          </p>
                        </div>
                      ) : null}

                      {/* Source URLs link */}
                      {selectedPreset?.sourceUrls && selectedPreset.sourceUrls.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>Văn bản đối chiếu:</span>
                          <a
                            href={selectedPreset.sourceUrls[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                          >
                            <span>Xem thông báo chính thức</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      ) : null}

                      {/* Unavailable Notice */}
                      {presetCatalog?.unavailable && presetCatalog.unavailable.length > 0 ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2.5 text-[11px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                          <span className="font-semibold">Lưu ý danh mục {holidayYear}:</span>{' '}
                          {presetCatalog.unavailable.map((u) => `${holidayName(u.holidayCode)} (${u.reason})`).join('; ')}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* COMPANY HOLIDAY EXPLICIT IS_PAID SELECTION */}
                  {holidayCategory === 'COMPANY' ? (
                    <div className="grid gap-2">
                      <Label className="text-sm font-medium">
                        Chế độ hưởng lương <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setValue('isPaid', true, { shouldValidate: true, shouldDirty: true })}
                          className={cn(
                            'flex items-center justify-center rounded-lg border p-2.5 text-xs font-semibold transition-colors',
                            currentIsPaid === true
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                          )}
                          aria-pressed={currentIsPaid === true}
                        >
                          Có hưởng lương
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('isPaid', false, { shouldValidate: true, shouldDirty: true })}
                          className={cn(
                            'flex items-center justify-center rounded-lg border p-2.5 text-xs font-semibold transition-colors',
                            currentIsPaid === false
                              ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                          )}
                          aria-pressed={currentIsPaid === false}
                        >
                          Không hưởng lương
                        </button>
                      </div>
                      {errors.isPaid ? (
                        <p className="text-xs text-destructive">{errors.isPaid.message}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Bắt buộc xác nhận rõ chế độ lương theo quyết định của doanh nghiệp.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Date Picker */}
                  <div className="grid gap-2">
                    <Label htmlFor="holiday-date" className="text-sm font-medium">
                      Ngày lễ <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          id="holiday-date"
                          value={field.value}
                          placeholder="Chọn ngày lễ (YYYY-MM-DD)"
                          modal={true}
                          disabled={isBusy}
                          popoverClassName="z-[60]"
                          onChange={(val) => {
                            field.onChange(val)
                            if (!conflictError) setServerError(null)
                          }}
                          aria-invalid={Boolean(errors.date)}
                        />
                      )}
                    />
                    {errors.date ? (
                      <p className="text-xs text-destructive">{errors.date.message}</p>
                    ) : effectiveFrom ? (
                      <p className="text-xs text-muted-foreground">
                        Ngày lễ phải từ ngày hiệu lực ({effectiveFrom}) trở đi.
                      </p>
                    ) : null}
                  </div>

                  {/* Holiday Name */}
                  <div className="grid gap-2">
                    <Label htmlFor="holiday-name" className="text-sm font-medium">
                      Tên ngày lễ / ngày nghỉ <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="holiday-name"
                      placeholder={
                        holidayCategory === 'STATUTORY'
                          ? 'Ví dụ: Tết Dương lịch, Quốc khánh 2/9...'
                          : 'Ví dụ: Nghỉ kỷ niệm thành lập công ty...'
                      }
                      aria-invalid={Boolean(errors.name)}
                      {...register('name')}
                    />
                    {errors.name ? (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    ) : null}
                  </div>

                  {/* Source Reference */}
                  <div className="grid gap-2">
                    <Label htmlFor="holiday-source" className="text-sm font-medium">
                      Căn cứ văn bản/quyết định <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="holiday-source"
                      placeholder={
                        holidayCategory === 'STATUTORY'
                          ? 'Ví dụ: Điều 112 Bộ luật Lao động, Thông báo số 12/TB-BGD...'
                          : 'Ví dụ: Quyết định số 15/QĐ-BGD ngày 10/10/2026...'
                      }
                      aria-invalid={Boolean(errors.sourceReference)}
                      {...register('sourceReference')}
                    />
                    {errors.sourceReference ? (
                      <p className="text-xs text-destructive">{errors.sourceReference.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {holidayCategory === 'STATUTORY'
                          ? 'Căn cứ pháp lý theo Điều 112 Bộ luật Lao động hoặc văn bản thẩm quyền.'
                          : 'Căn cứ quyết định nội bộ của doanh nghiệp (không tự chèn Điều 112).'}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {/* KIND 2: COMPENSATORY_OFF */}
              {selectedKind === 'COMPENSATORY_OFF' ? (
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="comp-sourceHolidayDate" className="text-sm font-medium">
                        Ngày lễ nguồn (trùng nghỉ tuần) <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="sourceHolidayDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            id="comp-sourceHolidayDate"
                            value={field.value}
                            placeholder="Chọn ngày lễ nguồn"
                            modal={true}
                            disabled={isBusy}
                            popoverClassName="z-[60]"
                            onChange={(val) => {
                              field.onChange(val)
                              if (!conflictError) setServerError(null)
                            }}
                            aria-invalid={Boolean(errors.sourceHolidayDate)}
                          />
                        )}
                      />
                      {errors.sourceHolidayDate ? (
                        <p className="text-xs text-destructive">{errors.sourceHolidayDate.message}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Ngày lễ phải đã tồn tại trong bản nháp này.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="comp-date" className="text-sm font-medium">
                        Ngày nghỉ bù thực tế <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            id="comp-date"
                            value={field.value}
                            placeholder="Chọn ngày nghỉ bù"
                            modal={true}
                            disabled={isBusy}
                            popoverClassName="z-[60]"
                            onChange={(val) => {
                              field.onChange(val)
                              if (!conflictError) setServerError(null)
                            }}
                            aria-invalid={Boolean(errors.date)}
                          />
                        )}
                      />
                      {errors.date ? (
                        <p className="text-xs text-destructive">{errors.date.message}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Phải là ngày làm việc kế tiếp theo lịch.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* KIND 3: SWAP (ONE FORM FOR BOTH OFF AND WORK DATES) */}
              {selectedKind === 'SWAP' ? (
                <div className="grid gap-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                    Cấu hình một cặp ngày hoán đổi: chuyển ngày làm việc thành ngày nghỉ và chọn một ngày nghỉ tuần thành ngày đi làm bù.
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="swap-offDate" className="text-sm font-medium">
                        Ngày nghỉ hoán đổi (vốn là ngày làm) <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="offDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            id="swap-offDate"
                            value={field.value}
                            placeholder="Chọn ngày nghỉ hoán đổi"
                            modal={true}
                            disabled={isBusy}
                            popoverClassName="z-[60]"
                            onChange={(val) => {
                              field.onChange(val)
                              if (!conflictError) setServerError(null)
                            }}
                            aria-invalid={Boolean(errors.offDate)}
                          />
                        )}
                      />
                      {errors.offDate ? (
                        <p className="text-xs text-destructive">{errors.offDate.message}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="swap-workDate" className="text-sm font-medium">
                        Ngày làm bù (vốn là ngày nghỉ tuần) <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="workDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            id="swap-workDate"
                            value={field.value}
                            placeholder="Chọn ngày làm bù"
                            modal={true}
                            disabled={isBusy}
                            popoverClassName="z-[60]"
                            onChange={(val) => {
                              field.onChange(val)
                              if (!conflictError) setServerError(null)
                            }}
                            aria-invalid={Boolean(errors.workDate)}
                          />
                        )}
                      />
                      {errors.workDate ? (
                        <p className="text-xs text-destructive">{errors.workDate.message}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* KIND 4: WORK_OVERRIDE */}
              {selectedKind === 'WORK_OVERRIDE' ? (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="override-date" className="text-sm font-medium">
                      Ngày làm việc điều chỉnh ca <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          id="override-date"
                          value={field.value}
                          placeholder="Chọn ngày điều chỉnh"
                          modal={true}
                          disabled={isBusy}
                          popoverClassName="z-[60]"
                          onChange={(val) => {
                            field.onChange(val)
                            if (!conflictError) setServerError(null)
                          }}
                          aria-invalid={Boolean(errors.date)}
                        />
                      )}
                    />
                    {errors.date ? (
                      <p className="text-xs text-destructive">{errors.date.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Phải là ngày làm việc theo lịch nền.
                      </p>
                    )}
                  </div>

                  {defaultShift ? (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5">
                      <span className="text-xs text-muted-foreground">
                        Mẫu giờ bản nháp: {defaultShift.startTime}–{defaultShift.endTime} (nghỉ {defaultShift.breaks[0]?.startTime}–{defaultShift.breaks[0]?.endTime})
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={handleApplyShiftDefaults}
                        className="h-7 gap-1 text-xs"
                      >
                        <Sparkles className="size-3 text-amber-500" aria-hidden="true" />
                        Điền mẫu ca
                      </Button>
                    </div>
                  ) : null}

                  {/* Hours */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="override-startTime" className="text-sm font-medium">
                        Giờ vào ca <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="override-startTime"
                        type="time"
                        step="60"
                        aria-invalid={Boolean(errors.startTime)}
                        {...register('startTime')}
                      />
                      {errors.startTime ? (
                        <p className="text-xs text-destructive">{errors.startTime.message}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="override-endTime" className="text-sm font-medium">
                        Giờ ra ca <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="override-endTime"
                        type="time"
                        step="60"
                        aria-invalid={Boolean(errors.endTime)}
                        {...register('endTime')}
                      />
                      {errors.endTime ? (
                        <p className="text-xs text-destructive">{errors.endTime.message}</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Break Hours */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="override-breakStart" className="text-xs font-medium text-muted-foreground">
                        Bắt đầu nghỉ <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="override-breakStart"
                        type="time"
                        step="60"
                        aria-invalid={Boolean(errors.breakStartTime)}
                        {...register('breakStartTime')}
                      />
                      {errors.breakStartTime ? (
                        <p className="text-xs text-destructive">{errors.breakStartTime.message}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="override-breakEnd" className="text-xs font-medium text-muted-foreground">
                        Kết thúc nghỉ <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="override-breakEnd"
                        type="time"
                        step="60"
                        aria-invalid={Boolean(errors.breakEndTime)}
                        {...register('breakEndTime')}
                      />
                      {errors.breakEndTime ? (
                        <p className="text-xs text-destructive">{errors.breakEndTime.message}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Common Reason */}
              <div className="grid gap-2">
                <Label htmlFor="exception-reason" className="text-sm font-medium">
                  Lý do / Căn cứ ngoại lệ <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="exception-reason"
                  rows={3}
                  placeholder="Nhập lý do chi tiết để phục vụ đối soát và quản lý lịch..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={Boolean(errors.reason)}
                  {...register('reason')}
                />
                {errors.reason ? (
                  <p className="text-xs text-destructive">{errors.reason.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Lý do bắt buộc từ 1 đến 1000 ký tự.
                  </p>
                )}
              </div>
            </fieldset>
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-border p-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleClose}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isBusy || conflictError}>
              {isPending
                ? 'Đang lưu...'
                : isReloading
                  ? 'Đang tải lại...'
                  : isEdit
                    ? 'Lưu thay đổi'
                    : 'Thêm ngoại lệ'}
            </Button>
          </div>
        </form>
    <ConfirmDialog
      open={confirmAction !== null}
      title="Bỏ thay đổi chưa lưu?"
      description="Thao tác này sẽ bỏ các thông tin bạn đang chỉnh sửa. Bạn có muốn tiếp tục không?"
      actionLabel="Bỏ thay đổi và tiếp tục"
      onOpenChange={(next) => { if (!next) setConfirmAction(null) }}
      onConfirm={() => {
        const action = confirmAction
        setConfirmAction(null)
        if (action === 'close') onOpenChange(false)
        else if (action === 'reload') void handleReloadLatest()
        else if (action) applyKindChange(action)
      }}
    />
      </DialogContent>
    </Dialog>
  )
}

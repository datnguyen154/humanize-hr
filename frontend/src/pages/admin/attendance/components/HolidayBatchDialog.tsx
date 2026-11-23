import { AlertCircle, AlertTriangle, Check, CheckCircle2, ExternalLink, RefreshCw, Sparkles, X } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  DAY_TYPE_LABELS,
  formatCivilDateVN,
  parseCalendarExceptionError,
  useBatchPreviewMutation,
  useCommitBatchMutation,
  useHolidayPresetsQuery,
  type BatchPreviewRequest,
  type CalendarPreviewDay,
  type HolidayBatchPlan,
  type HolidayPreset,
} from '@/features/work-schedule'
import { cn } from '@/lib/utils'
import { showSuccessToast } from '@/lib/toast'
import type { CalendarEditorSnapshot } from '@/features/work-schedule/lib/calendar-exception.editor'
import { buildHolidayBatchRequest, calendarYear, holidayName, HolidayBatchInputError, type CompanyHolidayInput } from '@/features/work-schedule/lib/holiday-batch'
import { DatePicker } from '@/shared/components/DatePicker'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  versionId: string
  scheduleRevision: number
  effectiveFrom?: string
  onReloadFresh?: () => Promise<CalendarEditorSnapshot>
  onRestoreFocus?: () => void
}

type TabType = 'PRESETS' | 'COMPANY'

export function HolidayBatchDialog({
  open,
  onOpenChange,
  versionId,
  scheduleRevision,
  effectiveFrom,
  onReloadFresh,
  onRestoreFocus,
}: Props) {
  const initialYear = calendarYear(effectiveFrom)

  const [selectedYear, setSelectedYear] = useState<number>(initialYear)
  const [activeTab, setActiveTab] = useState<TabType>('PRESETS')
  const [currentRevision, setCurrentRevision] = useState(scheduleRevision)

  // Selection states
  // selectedOptionMap: holidayCode -> presetId
  const [selectedOptionMap, setSelectedOptionMap] = useState<Record<string, string>>({})
  const [includeCompensatoryOff, setIncludeCompensatoryOff] = useState(false)

  // Company holiday items state
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHolidayInput[]>([])

  // Preview & Commit state
  const [review, setReview] = useState<{ plan: HolidayBatchPlan; request: BatchPreviewRequest; inputKey: string } | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [conflictError, setConflictError] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [confirmReload, setConfirmReload] = useState(false)
  const submittingRef = useRef(false)

  // Presets Query
  const {
    data: catalog,
    isLoading: isPresetsLoading,
    isError: isPresetsError,
    refetch: refetchPresets,
  } = useHolidayPresetsQuery(selectedYear)

  const previewMutation = useBatchPreviewMutation(versionId)
  const commitMutation = useCommitBatchMutation(versionId)

  const isBusy = previewMutation.isPending || commitMutation.isPending || isReloading

  const presets = catalog?.presets
  // Group presets by holidayCode
  const presetsByCode = useMemo(() => {
    if (!presets) return new Map<string, HolidayPreset[]>()
    const map = new Map<string, HolidayPreset[]>()
    for (const p of presets) {
      const list = map.get(p.holidayCode) ?? []
      list.push(p)
      map.set(p.holidayCode, list)
    }
    return map
  }, [presets])

  // Invalidate plan when inputs change
  const clearPlan = () => {
    setReview(null)
    if (!conflictError) setServerError(null)
  }

  const handleSelectOption = (holidayCode: string, presetId: string) => {
    if (isBusy || submittingRef.current) return
    clearPlan()
    setSelectedOptionMap((prev) => {
      const next = { ...prev }
      if (next[holidayCode] === presetId) {
        delete next[holidayCode]
      } else {
        next[holidayCode] = presetId
      }
      return next
    })
  }

  const handleToggleCompensatory = (checked: boolean) => {
    if (isBusy || submittingRef.current) return
    clearPlan()
    setIncludeCompensatoryOff(checked)
  }

  // Add Company holiday row
  const handleAddCompanyHoliday = () => {
    if (isBusy || submittingRef.current) return
    clearPlan()
    setCompanyHolidays((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        date: '',
        name: '',
        sourceReference: '',
        reason: '',
        isPaid: null,
      },
    ])
  }

  const handleRemoveCompanyHoliday = (id: string) => {
    if (isBusy || submittingRef.current) return
    clearPlan()
    setCompanyHolidays((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateCompanyHoliday = (
    id: string,
    field: keyof Omit<CompanyHolidayInput, 'id'>,
    value: string | boolean | null,
  ) => {
    if (isBusy || submittingRef.current) return
    clearPlan()
    setCompanyHolidays((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const submission = useMemo(() => {
    try {
      return { request: buildHolidayBatchRequest(catalog, selectedOptionMap, companyHolidays,
        currentRevision, includeCompensatoryOff, selectedYear), error: null }
    } catch (error) {
      return { request: null, error: error instanceof HolidayBatchInputError ? error.message : 'Thông tin kỳ nghỉ không hợp lệ.' }
    }
  }, [catalog, selectedOptionMap, companyHolidays, currentRevision, includeCompensatoryOff, selectedYear])
  const inputKey = JSON.stringify({ versionId, request: submission.request })
  const batchPlan = review?.inputKey === inputKey ? review.plan : null
  const planFingerprint = batchPlan?.planFingerprint ?? null

  const isDirty =
    Object.keys(selectedOptionMap).length > 0 ||
    companyHolidays.length > 0 ||
    includeCompensatoryOff

  // Preview Batch
  const handlePreview = async () => {
    if (isBusy || submittingRef.current || conflictError) return
    if (!submission.request) {
      setServerError(submission.error)
      return
    }
    submittingRef.current = true
    setReview(null)
    setServerError(null)
    setConflictError(false)

    try {
      const request = submission.request
      const plan = await previewMutation.mutateAsync(request)
      if (plan.scheduleRevision !== request.expectedRevision) {
        setConflictError(true)
        setServerError('Dữ liệu đã thay đổi trong lúc xem trước. Vui lòng tải lại bản nháp.')
        return
      }
      setReview({ plan, request, inputKey })
    } catch (err) {
      const parsed = parseCalendarExceptionError(err, 'Không thể tạo bản xem trước kỳ nghỉ.')
      if (parsed.isRevisionConflict) {
        setConflictError(true)
      }
      setServerError(parsed.message)
    } finally {
      submittingRef.current = false
    }
  }

  // Commit Batch
  const handleCommit = async () => {
    if (!batchPlan || !review || !planFingerprint || submittingRef.current || isBusy || conflictError) return
    submittingRef.current = true
    setServerError(null)
    setConflictError(false)

    try {
      const res = await commitMutation.mutateAsync({
        ...review.request,
        planFingerprint,
      })

      showSuccessToast(
        `Đã lưu kỳ nghỉ thành công (${res.created.length} ngoại lệ mới, ${res.skipped.length} ngày bỏ qua).`,
        'Thiết lập kỳ nghỉ thành công',
      )
      onOpenChange(false)
    } catch (err) {
      const parsed = parseCalendarExceptionError(err, 'Không thể lưu kỳ nghỉ.')
      if (parsed.isRevisionConflict) {
        setConflictError(true)
      } else if (parsed.code === 'WORK_CALENDAR_BATCH_PLAN_CHANGED') {
        setReview(null)
      }
      setServerError(parsed.message)
    } finally {
      submittingRef.current = false
    }
  }

  // Reload latest revision
  const handleReloadLatest = async () => {
    if (!onReloadFresh || isBusy) return
    setIsReloading(true)
    setServerError(null)
    try {
      const res = await onReloadFresh()
      if (res) {
        setCurrentRevision(res.scheduleRevision)
        setConflictError(false)
        setReview(null)
        setSelectedOptionMap({})
        setCompanyHolidays([])
        setIncludeCompensatoryOff(false)
        setSelectedYear(calendarYear(res.schedule.effectiveFrom))
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

  const handleClose = () => {
    if (!isBusy) {
      if (isDirty) setConfirmClose(true)
      else onOpenChange(false)
    }
  }

  const yearInputId = useId()
  const compOffId = useId()

  const previewRows = (batchPlan?.calendarDays ?? []).map((day: CalendarPreviewDay) => ({
    day,
    isSkipped: batchPlan?.skipped.some((s) => s.date === day.date) ?? false,
    proposed: batchPlan?.toCreate.find((p) => p.kind !== 'SWAP' && p.date === day.date),
    weekdayLabel: day.weekday === 7 ? 'Chủ Nhật' : `Thứ ${day.weekday + 1}`,
  }))

  return (
    <Dialog
      open={open}
      modal={!confirmClose && !confirmReload}
      onOpenChange={(val) => !val && handleClose()}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0"
        onInteractOutside={(event) => {
          if (confirmClose || confirmReload) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (confirmClose || confirmReload) event.preventDefault()
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onRestoreFocus?.()
        }}
      >
        <DialogHeader className="shrink-0 border-b border-border p-5 sm:p-6 pr-12">
          <div className="flex flex-wrap items-center gap-2.5">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="size-5 text-primary" aria-hidden="true" />
              Thiết lập kỳ nghỉ nhiều ngày
            </DialogTitle>
            <StatusBadge label={`rev ${currentRevision}`} tone="neutral" />
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Chọn các ngày lễ pháp định có sẵn hoặc thiết lập ngày nghỉ doanh nghiệp, xem trước kế
            hoạch và lưu toàn bộ vào bản nháp.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
          <fieldset disabled={isBusy} className="grid min-w-0 gap-5">
            {/* Server / Conflict Alert */}
            {serverError ? (
              <div
                role="alert"
                className={cn(
                  'rounded-lg border p-4 text-sm',
                  conflictError
                    ? 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-destructive/30 bg-destructive/10 text-destructive',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {conflictError ? 'Xung đột phiên bản (409 Conflict)' : 'Lỗi xử lý'}
                    </p>
                    <p className="mt-0.5 text-xs opacity-90">{serverError}</p>

                    {conflictError && onReloadFresh ? (
                      <div className="mt-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => (isDirty ? setConfirmReload(true) : void handleReloadLatest())}
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

            {/* Year selector & Category tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <Label htmlFor={yearInputId} className="text-xs font-semibold whitespace-nowrap">
                  Năm lịch:
                </Label>
                <Input
                  id={yearInputId}
                  type="number"
                  min={1}
                  max={9999}
                  value={selectedYear}
                  disabled={isBusy}
                  onChange={(e) => {
                    clearPlan()
                    setSelectedYear(Number(e.target.value))
                    setSelectedOptionMap({})
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {catalog?.year === selectedYear && catalog?.catalogVersion ? (
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    (Danh mục: {catalog.catalogVersion})
                  </span>
                ) : null}
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1.5 rounded-lg bg-muted p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('PRESETS')}
                  className={cn(
                    'rounded-md px-3 py-1 font-medium transition-colors',
                    activeTab === 'PRESETS'
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Lễ pháp định
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('COMPANY')}
                  className={cn(
                    'rounded-md px-3 py-1 font-medium transition-colors',
                    activeTab === 'COMPANY'
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Nghỉ doanh nghiệp ({companyHolidays.length})
                </button>
              </div>
            </div>

            {/* TAB 1: PRESETS */}
            {activeTab === 'PRESETS' ? (
              <div className="grid gap-4">
                {isPresetsLoading ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    <RefreshCw className="mx-auto size-5 animate-spin text-muted-foreground" />
                    <p className="mt-2">Đang tải danh mục ngày lễ năm {selectedYear}...</p>
                  </div>
                ) : isPresetsError ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
                    Không thể tải danh mục ngày lễ cho năm {selectedYear}.
                    <Button type="button" variant="outline" onClick={() => void refetchPresets()}>Thử lại danh mục</Button>
                  </div>
                ) : catalog ? (
                  <div className="grid gap-3">
                    {/* Notice */}
                    {catalog.notice ? (
                      <div className="rounded-md border border-sky-200 bg-sky-50/50 p-3 text-xs text-sky-900 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-300">
                        {catalog.notice}
                      </div>
                    ) : null}

                    {/* Presets List */}
                    <div className="grid gap-3">
                      {Array.from(presetsByCode.entries()).map(([code, presets]) => {
                        const isMultiOption = presets.length > 1
                        const activePresetId = selectedOptionMap[code]

                        return (
                          <div
                            key={code}
                            className="rounded-lg border border-border bg-card p-3 sm:p-4 transition-colors"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                              <div>
                                <h4 className="text-sm font-bold text-foreground">
                                  {presets[0].name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {isMultiOption
                                    ? `Có ${presets.length} phương án được cơ quan thẩm quyền công bố (chỉ được chọn 1 phương án)`
                                    : `Cố định theo Bộ luật Lao động`}
                                </p>
                              </div>
                              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                                Lễ pháp định (Hưởng lương)
                              </span>
                            </div>

                            {/* Preset Options */}
                            <div className="mt-3 grid gap-2">
                              {presets.map((preset) => {
                                const isSelected = activePresetId === preset.id

                                return (
                                  <div
                                    key={preset.id}
                                    onClick={() => handleSelectOption(code, preset.id)}
                                    role="button"
                                    aria-pressed={isSelected}
                                    aria-disabled={isBusy}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.target !== e.currentTarget) return
                                      if (e.key === ' ' || e.key === 'Enter') {
                                        e.preventDefault()
                                        handleSelectOption(code, preset.id)
                                      }
                                    }}
                                    className={cn(
                                      'flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                      isSelected
                                        ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                                        : 'border-border/80 bg-background text-muted-foreground hover:bg-muted/30 hover:text-foreground',
                                    )}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={cn(
                                          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                                          isMultiOption ? 'rounded-full' : 'rounded',
                                          isSelected
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input bg-background',
                                        )}
                                      >
                                        {isSelected ? <Check className="size-3" /> : null}
                                      </div>

                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-xs font-semibold text-foreground">
                                            {preset.optionLabel || preset.name}
                                          </span>
                                          <span className="text-[11px] font-medium text-primary">
                                            ({preset.dates.length} ngày:{' '}
                                            {preset.dates.map((d) => formatCivilDateVN(d)).join(', ')})
                                          </span>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                        {preset.sourceReference}
                                        <br />{preset.suggestedReason}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Links */}
                                    {preset.sourceUrls && preset.sourceUrls.length > 0 ? (
                                      <div
                                        className="flex items-center gap-1.5 self-end sm:self-center shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {preset.sourceUrls.map((url, index) => <a
                                          key={url}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                                        >
                                          <span>Nguồn {index + 1}</span>
                                          <ExternalLink className="size-3" />
                                        </a>)}
                                      </div>
                                    ) : null}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Unavailable Notice */}
                    {catalog.unavailable && catalog.unavailable.length > 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                          <div>
                            <p className="font-semibold">
                              Ngày lễ chưa được xác minh trong catalog cho năm {selectedYear}:
                            </p>
                            <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px]">
                              {catalog.unavailable.map((u) => (
                                <li key={u.holidayCode}>
                                  <span className="font-medium">{holidayName(u.holidayCode)}:</span> {u.reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* TAB 2: COMPANY HOLIDAYS */}
            {activeTab === 'COMPANY' ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Thêm các ngày nghỉ riêng của doanh nghiệp (ngày thành lập, du lịch, nghỉ thêm...).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCompanyHoliday}
                    className="h-8 gap-1 text-xs"
                  >
                    + Thêm ngày nghỉ
                  </Button>
                </div>

                {companyHolidays.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Chưa có ngày nghỉ doanh nghiệp nào được thêm. Bấm "+ Thêm ngày nghỉ" để bắt đầu.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {companyHolidays.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-card p-3 sm:p-4 grid gap-3"
                      >
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="text-xs font-semibold text-foreground">
                            Ngày nghỉ doanh nghiệp #{index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCompanyHoliday(item.id)}
                            className="h-7 px-2 text-destructive hover:bg-destructive/10"
                          >
                            <X className="size-3.5" />
                            Xóa
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label htmlFor={`${item.id}-date`} className="text-xs font-medium">
                              Ngày nghỉ (YYYY-MM-DD) <span className="text-destructive">*</span>
                            </Label>
                            <DatePicker
                              id={`${item.id}-date`}
                              value={item.date}
                              onChange={(date) =>
                                handleUpdateCompanyHoliday(item.id, 'date', date)
                              }
                              modal
                              popoverClassName="z-[60]"
                              disabled={isBusy}
                            />
                          </div>

                          <div className="grid gap-1.5">
                            <Label htmlFor={`${item.id}-name`} className="text-xs font-medium">
                              Tên ngày nghỉ <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`${item.id}-name`}
                              placeholder="Ví dụ: Kỷ niệm thành lập công ty"
                              value={item.name}
                              onChange={(e) =>
                                handleUpdateCompanyHoliday(item.id, 'name', e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label htmlFor={`${item.id}-source`} className="text-xs font-medium">Căn cứ nội bộ (bắt buộc)</Label>
                            <Input
                              id={`${item.id}-source`}
                              placeholder="Ví dụ: Quyết định số 15/QĐ-BGD..."
                              value={item.sourceReference}
                              onChange={(e) =>
                                handleUpdateCompanyHoliday(
                                  item.id,
                                  'sourceReference',
                                  e.target.value,
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">
                              Chế độ hưởng lương <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-pressed={item.isPaid === true}
                                onClick={() => handleUpdateCompanyHoliday(item.id, 'isPaid', true)}
                                className={cn(
                                  'flex-1 rounded border py-1.5 text-xs font-semibold transition-colors',
                                  item.isPaid === true
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                                )}
                              >
                                Có hưởng lương
                              </button>
                              <button
                                type="button"
                                aria-pressed={item.isPaid === false}
                                onClick={() => handleUpdateCompanyHoliday(item.id, 'isPaid', false)}
                                className={cn(
                                  'flex-1 rounded border py-1.5 text-xs font-semibold transition-colors',
                                  item.isPaid === false
                                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
                                    : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                                )}
                              >
                                Không hưởng lương
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`${item.id}-reason`}>Lý do nghỉ (bắt buộc)</Label>
                          <Input id={`${item.id}-reason`} value={item.reason}
                            onChange={(e) => handleUpdateCompanyHoliday(item.id, 'reason', e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Compensatory Off Checkbox */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
              <label htmlFor={compOffId} className="flex items-start gap-2.5 cursor-pointer">
                <input
                  id={compOffId}
                  type="checkbox"
                  checked={includeCompensatoryOff}
                  onChange={(e) => handleToggleCompensatory(e.target.checked)}
                  className="mt-1 size-4 rounded border-input text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    Đề xuất và bố trí nghỉ bù nếu ngày lễ trùng ngày nghỉ tuần
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Hệ thống đề xuất nghỉ bù theo ngày nghỉ tuần thực tế của lịch, không mặc định
                    thứ Bảy/Chủ Nhật. HR xem và xác nhận trước khi lưu.
                  </p>
                </div>
              </label>
            </div>

            {/* ACTION 1: Run Preview Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="text-xs text-muted-foreground">
                Tổng số ngày nghỉ cấu hình: <span className="font-bold text-foreground">{submission.request?.holidays.length ?? 0} ngày</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={isBusy || conflictError}
                onClick={() => void handlePreview()}
                className="gap-1.5"
              >
                {previewMutation.isPending ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4 text-primary" />
                )}
                {previewMutation.isPending ? 'Đang tạo xem trước...' : 'Xem trước kỳ nghỉ'}
              </Button>
            </div>

            {/* PREVIEW RESULTS DISPLAY */}
            {batchPlan ? (
              <div className="grid gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-foreground">
                      Bản xem trước kỳ nghỉ đã sẵn sàng
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    fingerprint: {batchPlan.planFingerprint.slice(0, 16)}...
                  </span>
                </div>

                {/* Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-lg border border-border bg-card p-2.5 text-center">
                    <span className="text-[11px] text-muted-foreground">Tạo mới (Lễ)</span>
                    <p className="mt-0.5 text-base font-bold text-rose-600">
                      {batchPlan.toCreate.filter((e) => e.kind === 'HOLIDAY').length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2.5 text-center">
                    <span className="text-[11px] text-muted-foreground">Tạo mới (Nghỉ bù)</span>
                    <p className="mt-0.5 text-base font-bold text-emerald-600">
                      {batchPlan.toCreate.filter((e) => e.kind === 'COMPENSATORY_OFF').length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2.5 text-center">
                    <span className="text-[11px] text-muted-foreground">Bỏ qua (Đã có)</span>
                    <p className="mt-0.5 text-base font-bold text-amber-600">
                      {batchPlan.skipped.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2.5 text-center">
                    <span className="text-[11px] text-muted-foreground">Tổng ngày kỳ nghỉ</span>
                    <p className="mt-0.5 text-base font-bold text-primary">
                      {batchPlan.calendarDays.length}
                    </p>
                  </div>
                </div>

                {/* Validation Warnings / Blockers if any */}
                {batchPlan.validation?.issues?.length > 0 ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="size-4" />
                      Lưu ý kiểm tra ({batchPlan.validation.issues.length} vấn đề):
                    </p>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5">
                      {batchPlan.validation.issues.map((issue, idx) => (
                        <li key={idx}>
                          <span className="font-semibold">[{issue.severity === 'BLOCKER' ? 'Cần xử lý' : 'Cảnh báo'}]</span> {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Calendar Days: table from sm up, compact rows on mobile */}
                <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-card">
                  <table className="hidden w-full text-left text-xs sm:table">
                    <thead className="sticky top-0 border-b border-border bg-muted/80 text-[11px] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Ngày</th>
                        <th className="px-3 py-2 font-medium">Thứ</th>
                        <th className="px-3 py-2 font-medium">Loại ngày</th>
                        <th className="px-3 py-2 font-medium">Trạng thái xử lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewRows.map(({ day, isSkipped, proposed, weekdayLabel }) => (
                        <tr key={day.date} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-semibold text-foreground">
                            {formatCivilDateVN(day.date)}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{weekdayLabel}</td>
                          <td className="px-3 py-2">
                            <DayTypeBadge day={day} />
                            <DayDetails day={day} reason={proposed?.reason} />
                          </td>
                          <td className="px-3 py-2">
                            <DayStatus isSkipped={isSkipped} isProposed={Boolean(proposed)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ul className="divide-y divide-border text-xs sm:hidden">
                    {previewRows.map(({ day, isSkipped, proposed, weekdayLabel }) => (
                      <li key={day.date} className="grid gap-1 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0">
                            <span className="font-semibold text-foreground">{formatCivilDateVN(day.date)}</span>
                            <span className="text-muted-foreground"> · {weekdayLabel}</span>
                          </p>
                          <DayTypeBadge day={day} />
                        </div>
                        <div className="grid gap-0.5 break-words text-muted-foreground">
                          <DayDetails day={day} reason={proposed?.reason} />
                        </div>
                        <DayStatus isSkipped={isSkipped} isProposed={Boolean(proposed)} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </fieldset>
        </div>

        {/* Footer Actions */}
        <div className="flex shrink-0 items-center justify-between border-t border-border p-4 sm:px-6">
          <Button type="button" variant="outline" disabled={isBusy} onClick={handleClose}>
            Đóng
          </Button>

          <Button
            type="button"
            disabled={!batchPlan || !planFingerprint || isBusy || conflictError}
            onClick={() => void handleCommit()}
            className="gap-1.5"
          >
            {commitMutation.isPending ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {commitMutation.isPending ? 'Đang lưu kỳ nghỉ...' : 'Xác nhận và lưu kỳ nghỉ'}
          </Button>
        </div>
      {/* Discard confirmation when closing dirty */}
      <ConfirmDialog
        open={confirmClose}
        title="Bỏ thay đổi chưa lưu?"
        description="Bạn đang có các lựa chọn ngày nghỉ chưa lưu. Bạn có chắc muốn đóng và bỏ các lựa chọn này không?"
        actionLabel="Bỏ thay đổi và đóng"
        onOpenChange={(next) => {
          if (!next) setConfirmClose(false)
        }}
        onConfirm={() => {
          setConfirmClose(false)
          onOpenChange(false)
        }}
      />

      {/* Discard confirmation when reloading on 409 conflict */}
      <ConfirmDialog
        open={confirmReload}
        title="Tải lại dữ liệu phiên bản mới?"
        description="Thao tác này sẽ bỏ các lựa chọn và nội dung chưa lưu, tải lại bản nháp mới nhất rồi yêu cầu xem trước lại. Bạn có muốn tiếp tục?"
        actionLabel="Tải lại ngay"
        onOpenChange={(next) => {
          if (!next) setConfirmReload(false)
        }}
        onConfirm={() => {
          setConfirmReload(false)
          void handleReloadLatest()
        }}
      />
      </DialogContent>
    </Dialog>
  )
}

function DayTypeBadge({ day }: { day: CalendarPreviewDay }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
        day.dayType === 'HOLIDAY'
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
          : day.dayType === 'COMPENSATORY_OFF'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : day.dayType === 'WEEKLY_OFF'
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary/10 text-primary',
      )}
    >
      {DAY_TYPE_LABELS[day.dayType] ?? day.dayType}
    </span>
  )
}

function DayDetails({ day, reason }: { day: CalendarPreviewDay; reason?: string }) {
  return (
    <>
      {day.holidayCategory ? <p>{day.holidayCategory === 'STATUTORY' ? 'Lễ pháp định' : day.holidayCategory === 'COMPANY' ? 'Nghỉ doanh nghiệp' : 'Chưa phân loại'}</p> : null}
      {day.holidayPayPolicy ? <p>{day.holidayPayPolicy === 'PAID' ? 'Có hưởng lương' : day.holidayPayPolicy === 'UNPAID' ? 'Không hưởng lương' : 'Chưa xác định hưởng lương'}</p> : null}
      {day.dayType === 'HOLIDAY' && day.isBaseWeeklyOff ? <p>Trùng ngày nghỉ tuần</p> : null}
      {reason ? <p>{reason}</p> : null}
    </>
  )
}

function DayStatus({ isSkipped, isProposed }: { isSkipped: boolean; isProposed: boolean }) {
  if (isSkipped) {
    return <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Đã tồn tại, không tạo lại</span>
  }
  if (isProposed) {
    return <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Sẽ tạo mới</span>
  }
  return <span className="text-[11px] text-muted-foreground">Đã có trong lịch (không tạo ngoại lệ mới)</span>
}

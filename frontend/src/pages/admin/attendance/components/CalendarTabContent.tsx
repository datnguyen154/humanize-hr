import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Pencil,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton, TableRowsSkeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  EXCEPTION_KIND_LABELS,
  formatCivilDateVN,
  formatEffectiveDate,
  parseCalendarExceptionError,
  useCalendarExceptionListQuery,
  useCalendarPreviewQuery,
  type CalendarExceptionDto,
  type CalendarExceptionKind,
} from '@/features/work-schedule'
import { useWorkScheduleOptionsQuery } from '@/features/work-schedule/hooks/useWorkScheduleQuery'
import { currentCalendarMonth, loadCalendarEditor, type CalendarEditorSnapshot } from '@/features/work-schedule/lib/calendar-exception.editor'
import { cn } from '@/lib/utils'

import { CalendarExceptionDeleteDialog } from './CalendarExceptionDeleteDialog'
import { CalendarExceptionDetailDialog } from './CalendarExceptionDetailDialog'
import { CalendarExceptionFormDialog } from './CalendarExceptionFormDialog'
import { HolidayBatchDialog } from './HolidayBatchDialog'
import { MonthlyPreviewCard } from './MonthlyPreviewCard'

export function CalendarTabContent() {
  const [period, setPeriod] = useState(currentCalendarMonth)
  const { year: selectedYear, month: selectedMonth } = period
  const [batchOpen, setBatchOpen] = useState(false)
  const batchTriggerRef = useRef<HTMLElement | null>(null)

  // 2. Load draft work schedules to select parent
  const {
    data: schedules = [],
    isLoading: isSchedulesLoading,
    isError: isSchedulesError,
    refetch: refetchSchedules,
  } = useWorkScheduleOptionsQuery()
  const [selectedVersionId, setSelectedVersionId] = useState<string>('')

  // Auto-select first schedule if none selected
  const activeVersionId = selectedVersionId || schedules[0]?.id || ''

  // 3. Exception list filters & pagination
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [kindFilter, setKindFilter] = useState<CalendarExceptionKind | 'ALL'>('ALL')

  const listParams = {
    page,
    limit: pageSize,
    ...(kindFilter !== 'ALL' ? { kind: kindFilter } : {}),
  }

  const {
    data: exceptionsResponse,
    isLoading: isExceptionsLoading,
    isError: isExceptionsError,
    refetch: refetchExceptions,
    isFetching: isExceptionsFetching,
  } = useCalendarExceptionListQuery(activeVersionId, listParams)

  const exceptions = exceptionsResponse?.data ?? []
  const meta = exceptionsResponse?.meta
  const scheduleRevision = exceptionsResponse?.scheduleRevision ?? schedules.find((s) => s.id === activeVersionId)?.revision ?? 1
  const totalPages = Math.max(1, meta?.totalPages ?? 1)
  const totalItems = meta?.totalItems ?? 0
  const isTrueEmpty = !isExceptionsError && Boolean(exceptionsResponse) && totalItems === 0
  const isPageOutOfBounds = !isExceptionsError && Boolean(exceptionsResponse) && totalItems > 0 && exceptions.length === 0
  const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, totalItems)

  const canGoPrevious = page > 1 && !isExceptionsFetching
  const canGoNext = Boolean(meta?.hasNextPage) && page < totalPages && !isExceptionsFetching

  const handlePrevPage = () => {
    if (!canGoPrevious) return
    setPage((curr) => Math.max(1, Math.min(curr - 1, totalPages)))
  }

  const handleNextPage = () => {
    if (!canGoNext) return
    setPage((curr) => (curr < totalPages ? curr + 1 : curr))
  }

  // 4. Monthly Preview query
  const {
    data: previewData,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    refetch: refetchPreview,
    isFetching: isPreviewFetching,
  } = useCalendarPreviewQuery({
    versionId: activeVersionId,
    year: selectedYear,
    month: selectedMonth,
  })

  // 5. Month navigation
  const handlePrevMonth = () => {
    setPeriod(({ year, month }) => year === 1 && month === 1 ? { year, month } :
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 })
  }

  const handleNextMonth = () => {
    setPeriod(({ year, month }) => year === 9999 && month === 12 ? { year, month } :
      month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 })
  }

  // 6. Dialog states & Focus restoration
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeException, setActiveException] = useState<CalendarExceptionDto | null>(null)
  const [editorSnapshot, setEditorSnapshot] = useState<CalendarEditorSnapshot | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const openingRef = useRef(false)
  const [openError, setOpenError] = useState<string | null>(null)
  const lastOpenRef = useRef<{ mode: 'form' | 'detail' | 'delete' | 'batch'; id?: string } | null>(null)

  const createButtonRef = useRef<HTMLButtonElement | null>(null)
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  const handleRestoreFocus = () => {
    const trigger = lastTriggerRef.current
    if (trigger && typeof trigger.focus === 'function' && trigger.isConnected) {
      trigger.focus()
      return
    }
    createButtonRef.current?.focus()
  }

  const openEditor = async (mode: 'form' | 'detail' | 'delete' | 'batch', id?: string, trigger?: HTMLElement | null) => {
    if (!activeVersionId || openingRef.current) return
    lastTriggerRef.current = trigger ?? lastTriggerRef.current ?? createButtonRef.current
    lastOpenRef.current = { mode, id }
    openingRef.current = true
    setIsOpening(true)
    setOpenError(null)
    try {
      const snapshot = await loadCalendarEditor(activeVersionId, id)
      setEditorSnapshot(snapshot)
      setActiveException(snapshot.exception ?? null)
      if (mode === 'form') setFormOpen(true)
      if (mode === 'detail') setDetailOpen(true)
      if (mode === 'delete') setDeleteOpen(true)
      if (mode === 'batch') setBatchOpen(true)
    } catch (error) {
      setOpenError(parseCalendarExceptionError(error, 'Không thể tải thông tin ngoại lệ. Vui lòng thử lại.').message)
    } finally {
      openingRef.current = false
      setIsOpening(false)
    }
  }
  const handleOpenCreate = (trigger?: HTMLElement | null) => openEditor('form', undefined, trigger)
  const handleOpenEdit = (item: CalendarExceptionDto, trigger?: HTMLElement | null) => openEditor('form', item.id, trigger)
  const handleOpenDetail = (item: CalendarExceptionDto, trigger?: HTMLElement | null) => openEditor('detail', item.id, trigger)
  const handleOpenDelete = (item: CalendarExceptionDto, trigger?: HTMLElement | null) => openEditor('delete', item.id, trigger)
  const handleReloadFresh = async () => {
    const snapshot = await loadCalendarEditor(editorSnapshot!.schedule.id, activeException?.id)
    setEditorSnapshot(snapshot)
    setActiveException(snapshot.exception ?? null)
    return snapshot
  }

  return (
    <div className="grid gap-6 min-w-0 w-full" id="settings-calendar-panel" role="tabpanel" aria-labelledby="settings-calendar-tab">
      {isOpening ? <p role="status">Đang tải thông tin ngoại lệ...</p> : null}
      {openError ? <div role="alert">{openError} <Button variant="outline" disabled={isOpening} onClick={() => {
        const target = lastOpenRef.current
        if (target) void openEditor(target.mode, target.id)
      }}>Thử lại</Button></div> : null}
      {/* Selector Toolbar: Choose Draft & Month/Year */}
      <Card className="border-border shadow-2xs min-w-0 w-full">
        <CardContent className="p-3.5 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0 w-full">
            {/* Draft Selector */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
              <label htmlFor="draft-select" className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                Bản nháp lịch:
              </label>
              {isSchedulesLoading ? (
                <Skeleton className="h-9 w-44 sm:w-52" />
              ) : schedules.length > 0 ? (
                <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
                  <select
                    id="draft-select"
                    value={activeVersionId}
                    disabled={isOpening}
                    onChange={(e) => {
                      setSelectedVersionId(e.target.value)
                      setPage(1)
                    }}
                    className="h-9 min-w-0 max-w-full flex-1 sm:flex-none rounded-md border border-input bg-background px-2.5 py-1 text-xs sm:text-sm font-medium shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring truncate"
                  >
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        Bản nháp v{s.version} (rev {s.revision}) – Hiệu lực {formatEffectiveDate(s.effectiveFrom)}
                      </option>
                    ))}
                  </select>
                  <StatusBadge label="Bản nháp" tone="warning" className="shrink-0 hidden xs:inline-flex" />
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-destructive">
                  Chưa có bản nháp nào. Vui lòng tạo bản nháp trước.
                </span>
              )}
            </div>

            {/* Month & Year Navigator */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                onClick={handlePrevMonth}
                disabled={selectedYear === 1 && selectedMonth === 1}
                aria-label="Tháng trước"
                title="Tháng trước"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>

              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1 text-xs sm:text-sm font-semibold text-foreground">
                <CalendarIcon className="size-4 text-primary shrink-0" aria-hidden="true" />
                <span>
                  Tháng {selectedMonth} / {selectedYear}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0"
                onClick={handleNextMonth}
                disabled={selectedYear === 9999 && selectedMonth === 12}
                aria-label="Tháng sau"
                title="Tháng sau"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetchExceptions()
                  void refetchPreview()
                }}
                disabled={isExceptionsFetching || isPreviewFetching}
                className="h-8 gap-1.5 text-xs ml-2"
              >
                <RotateCw
                  className={cn('size-3.5', (isExceptionsFetching || isPreviewFetching) && 'animate-spin')}
                  aria-hidden="true"
                />
                Làm mới
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Draft State */}
      {isSchedulesError ? (
        <div role="alert">Không thể tải bản nháp lịch làm việc. <Button variant="outline" onClick={() => void refetchSchedules()}>Thử lại</Button></div>
      ) : !isSchedulesLoading && schedules.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="Chưa có bản nháp lịch làm việc"
          description="Bạn cần tạo ít nhất một bản nháp lịch làm việc (DRAFT) ở tab Bản nháp trước khi thiết lập ngoại lệ và xem trước tháng."
        />
      ) : (
        <>
          {/* SECTION 1: MONTHLY PREVIEW */}
          <section className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  Xem trước lịch làm việc tháng {selectedMonth}/{selectedYear}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Bản xem trước tổng hợp từ lịch nền tuần và các ngoại lệ trong bản nháp (DRAFT).
                </p>
              </div>
            </div>

            {isSchedulesLoading || isPreviewLoading ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-80 rounded-xl" />
              </div>
            ) : isPreviewError ? (
              <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                <p className="text-sm font-semibold text-destructive">
                  Không thể tải bản xem trước tháng {selectedMonth}/{selectedYear}.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vui lòng kiểm tra lại kết nối và cấu hình bản nháp.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetchPreview()}
                  className="mt-4 gap-1.5"
                >
                  <RotateCw className="size-3.5" aria-hidden="true" />
                  Thử lại
                </Button>
              </div>
            ) : previewData ? (
              <MonthlyPreviewCard preview={previewData} isLoading={isPreviewFetching} />
            ) : null}
          </section>

          {/* SECTION 2: CALENDAR EXCEPTIONS LIST & CRUD */}
          <section className="grid gap-4 mt-4">
            <Card className="border-border shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Danh sách ngoại lệ lịch làm việc ({totalItems})
                    </CardTitle>
                    <CardDescription>
                      Thiết lập các ngày lễ, nghỉ bù, hoán đổi hoặc điều chỉnh ca làm việc trong bản nháp này.
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        batchTriggerRef.current = e.currentTarget
                        void openEditor('batch', undefined, e.currentTarget)
                      }}
                      disabled={!activeVersionId || isOpening || isSchedulesLoading}
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      <Sparkles className="size-4 text-primary" aria-hidden="true" />
                      <span>Thiết lập kỳ nghỉ nhiều ngày</span>
                    </Button>

                    <Button
                      ref={createButtonRef}
                      type="button"
                      onClick={(e) => handleOpenCreate(e.currentTarget)}
                      disabled={!activeVersionId || isOpening || isSchedulesLoading}
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      <span>Thêm ngoại lệ</span>
                    </Button>
                  </div>
                </div>

                {/* Filter Toolbar */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Filter className="size-3.5" aria-hidden="true" /> Lọc loại:
                    </span>
                    {(['ALL', 'HOLIDAY', 'COMPENSATORY_OFF', 'SWAP', 'WORK_OVERRIDE'] as const).map((kind) => {
                      const isSelected = kindFilter === kind
                      return (
                        <button
                          key={kind}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => {
                            setKindFilter(kind)
                            setPage(1)
                          }}
                          className={cn(
                            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                          )}
                        >
                          {kind === 'ALL' ? 'Tất cả' : EXCEPTION_KIND_LABELS[kind]}
                        </button>
                      )
                    })}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Phiên bản bản nháp: <span className="font-semibold text-foreground">rev {scheduleRevision}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {/* Initial Loading */}
                {isExceptionsLoading ? (
                  <div className="rounded-md border border-border">
                    <Table>
                      <TableBody>
                        <TableRowsSkeleton columns={5} />
                      </TableBody>
                    </Table>
                  </div>
                ) : null}

                {/* Error State */}
                {isExceptionsError ? (
                  <div role="alert" className="py-10 text-center">
                    <p className="text-sm font-semibold text-destructive">
                      Không thể tải danh sách ngoại lệ lịch làm việc.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => refetchExceptions()}
                      className="mt-3 gap-1.5"
                    >
                      <RotateCw className="size-3.5" aria-hidden="true" /> Thử lại
                    </Button>
                  </div>
                ) : null}

                {/* Empty State */}
                {isTrueEmpty ? (
                  <div className="py-8 text-center">
                    <EmptyState
                      icon={CalendarIcon}
                      title="Chưa có ngoại lệ nào"
                      description="Chưa có ngoại lệ nào được thiết lập cho bản nháp này. Nhấn 'Thêm ngoại lệ' để tạo mới."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleOpenCreate(e.currentTarget)}
                      className="mt-4 gap-1.5"
                    >
                      <Plus className="size-3.5" aria-hidden="true" /> Thêm ngoại lệ ngay
                    </Button>
                  </div>
                ) : null}

                {/* Out of Bounds State */}
                {isPageOutOfBounds ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-8 text-center">
                    <p className="text-sm font-medium text-foreground">
                      Trang {page} hiện không có bản ghi nào
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tổng cộng có {totalItems} ngoại lệ ({totalPages} trang).
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        disabled={isExceptionsFetching}
                      >
                        Quay lại trang cuối ({totalPages})
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={isExceptionsFetching}
                      >
                        Về trang đầu
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Data List */}
                {exceptions.length > 0 ? (
                  <>
                    {/* Mobile Cards */}
                    <div className="grid gap-3 md:hidden">
                      {exceptions.map((item) => {
                        const p = item.payload
                        return (
                          <article
                            key={item.id}
                            className="rounded-lg border border-border bg-card p-4 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <StatusBadge
                                    label={EXCEPTION_KIND_LABELS[p.kind]}
                                    tone={
                                      p.kind === 'HOLIDAY'
                                        ? 'danger'
                                        : p.kind === 'COMPENSATORY_OFF'
                                          ? 'neutral'
                                          : p.kind === 'SWAP'
                                            ? 'warning'
                                            : 'neutral'
                                    }
                                  />
                                  {p.kind === 'HOLIDAY' ? (
                                    p.holidayPolicy?.category === 'STATUTORY' ? (
                                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                        Pháp định (Hưởng lương)
                                      </span>
                                    ) : p.holidayPolicy?.category === 'COMPANY' ? (
                                      <span
                                        className={cn(
                                          'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                          p.holidayPolicy.isPaid
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                                        )}
                                      >
                                        {p.holidayPolicy.isPaid ? 'DN (Có lương)' : 'DN (Không lương)'}
                                      </span>
                                    ) : (
                                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                        Chưa phân loại
                                      </span>
                                    )
                                  ) : null}
                                </div>
                                <div className="mt-2 text-sm font-semibold text-foreground">
                                  {p.kind === 'HOLIDAY'
                                    ? p.name
                                    : p.kind === 'COMPENSATORY_OFF'
                                      ? `Nghỉ bù ngày ${formatCivilDateVN(p.date)}`
                                      : p.kind === 'SWAP'
                                        ? `Hoán đổi: Nghỉ ${formatCivilDateVN(p.offDate)} ⇄ Làm ${formatCivilDateVN(p.workDate)}`
                                        : `Ca ${p.startTime}–${p.endTime} (${formatCivilDateVN(p.date)})`}
                                </div>
                              </div>
                            </div>

                            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                              {p.reason}
                            </p>

                            <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleOpenDetail(item, e.currentTarget)}
                                className="h-8 gap-1 text-xs"
                              >
                                <Eye className="size-3.5" aria-hidden="true" /> Chi tiết
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleOpenEdit(item, e.currentTarget)}
                                className="h-8 gap-1 text-xs"
                              >
                                <Pencil className="size-3.5" aria-hidden="true" /> Sửa
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleOpenDelete(item, e.currentTarget)}
                                className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3.5" aria-hidden="true" /> Xóa
                              </Button>
                            </div>
                          </article>
                        )
                      })}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[140px]">Loại ngoại lệ</TableHead>
                            <TableHead className="w-[180px]">Ngày áp dụng</TableHead>
                            <TableHead>Nội dung chi tiết</TableHead>
                            <TableHead>Lý do / Căn cứ</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {exceptions.map((item) => {
                            const p = item.payload
                            return (
                              <TableRow key={item.id} className="hover:bg-muted/40">
                                <TableCell>
                                  <div className="flex flex-col items-start gap-1">
                                    <StatusBadge
                                      label={EXCEPTION_KIND_LABELS[p.kind]}
                                      tone={
                                        p.kind === 'HOLIDAY'
                                          ? 'danger'
                                          : p.kind === 'COMPENSATORY_OFF'
                                            ? 'neutral'
                                            : p.kind === 'SWAP'
                                              ? 'warning'
                                              : 'neutral'
                                      }
                                    />
                                    {p.kind === 'HOLIDAY' ? (
                                      p.holidayPolicy?.category === 'STATUTORY' ? (
                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                          Pháp định (Hưởng lương)
                                        </span>
                                      ) : p.holidayPolicy?.category === 'COMPANY' ? (
                                        <span
                                          className={cn(
                                            'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                            p.holidayPolicy.isPaid
                                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                                          )}
                                        >
                                          {p.holidayPolicy.isPaid ? 'DN (Có lương)' : 'DN (Không lương)'}
                                        </span>
                                      ) : (
                                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                          Chưa phân loại
                                        </span>
                                      )
                                    ) : null}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-foreground">
                                  {p.kind === 'SWAP' ? (
                                    <div className="text-xs">
                                      <div>Nghỉ: {formatCivilDateVN(p.offDate)}</div>
                                      <div className="text-muted-foreground">Làm: {formatCivilDateVN(p.workDate)}</div>
                                    </div>
                                  ) : (
                                    formatCivilDateVN(p.date)
                                  )}
                                </TableCell>
                                <TableCell>
                                  {p.kind === 'HOLIDAY' ? (
                                    <div>
                                      <span className="font-semibold text-foreground">{p.name}</span>
                                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                                        Căn cứ: {p.sourceReference}
                                      </div>
                                    </div>
                                  ) : p.kind === 'COMPENSATORY_OFF' ? (
                                    <div className="text-xs">
                                      Nghỉ bù cho lễ ngày: <span className="font-medium">{formatCivilDateVN(p.sourceHolidayDate)}</span>
                                    </div>
                                  ) : p.kind === 'SWAP' ? (
                                    <div className="text-xs text-muted-foreground">
                                      Đổi ca ngày làm sang ngày nghỉ tuần
                                    </div>
                                  ) : (
                                    <div className="text-xs">
                                      Ca làm việc: <span className="font-semibold">{p.startTime}–{p.endTime}</span>
                                      <span className="text-muted-foreground ml-1.5">
                                        (nghỉ {p.breaks[0]?.startTime}–{p.breaks[0]?.endTime})
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground" title={p.reason}>
                                  {p.reason}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => handleOpenDetail(item, e.currentTarget)}
                                      className="h-8 gap-1 px-2.5 text-xs"
                                    >
                                      <Eye className="size-3.5" aria-hidden="true" /> Chi tiết
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => handleOpenEdit(item, e.currentTarget)}
                                      className="h-8 gap-1 px-2.5 text-xs"
                                    >
                                      <Pencil className="size-3.5" aria-hidden="true" /> Sửa
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => handleOpenDelete(item, e.currentTarget)}
                                      className="h-8 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="size-3.5" aria-hidden="true" /> Xóa
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : null}

                {/* Pagination Controls */}
                {totalItems > 0 ? (
                  <div className="mt-4 flex flex-col gap-3 border-t border-border pr-16 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pr-40">
                    <p className="text-sm text-muted-foreground">
                      {exceptions.length > 0 ? (
                        <>Hiển thị {fromItem}-{toItem} trong tổng số {totalItems} ngoại lệ</>
                      ) : (
                        <>Tổng số {totalItems} ngoại lệ ({totalPages} trang)</>
                      )}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={!canGoPrevious}
                        aria-label="Trang trước"
                        title="Trang trước"
                        onClick={handlePrevPage}
                      >
                        <ChevronLeft className="size-4" aria-hidden="true" />
                      </Button>
                      <span className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                        Trang {page} / {totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={!canGoNext}
                        aria-label="Trang sau"
                        title="Trang sau"
                        onClick={handleNextPage}
                      >
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* Form Dialog for Create & Edit */}
      {formOpen ? (
        <CalendarExceptionFormDialog
          key={activeException ? activeException.id : 'create-new-exception'}
          open={formOpen}
          onOpenChange={setFormOpen}
          versionId={editorSnapshot!.schedule.id}
          scheduleRevision={editorSnapshot!.scheduleRevision}
          exception={activeException}
          effectiveFrom={editorSnapshot!.schedule.effectiveFrom}
          defaultShift={editorSnapshot!.schedule}
          onReloadFresh={handleReloadFresh}
          onRestoreFocus={handleRestoreFocus}
        />
      ) : null}

      {/* Detail Dialog */}
      <CalendarExceptionDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        exception={activeException}
        onEdit={(item) => {
          setActiveException(item)
          setFormOpen(true)
        }}
        onDelete={(item) => {
          setActiveException(item)
          setDeleteOpen(true)
        }}
        onRestoreFocus={handleRestoreFocus}
      />

      {/* Delete Dialog */}
      {deleteOpen ? (
        <CalendarExceptionDeleteDialog
          key={activeException?.id ?? 'delete-dialog'}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          versionId={editorSnapshot!.schedule.id}
          exception={activeException}
          scheduleRevision={editorSnapshot!.scheduleRevision}
          onReloadFresh={handleReloadFresh}
          onRestoreFocus={handleRestoreFocus}
        />
      ) : null}

      {/* Holiday Batch Dialog */}
      {batchOpen && editorSnapshot ? (
        <HolidayBatchDialog
          open={batchOpen}
          onOpenChange={setBatchOpen}
          versionId={editorSnapshot.schedule.id}
          scheduleRevision={editorSnapshot.scheduleRevision}
          effectiveFrom={editorSnapshot.schedule.effectiveFrom}
          onReloadFresh={handleReloadFresh}
          onRestoreFocus={() => batchTriggerRef.current?.focus()}
        />
      ) : null}
    </div>
  )
}

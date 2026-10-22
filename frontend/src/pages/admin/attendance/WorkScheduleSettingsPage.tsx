import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Pencil,
  RotateCw,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  formatEffectiveDate,
  formatWeekdayList,
  getWorkScheduleVersionById,
  useWorkScheduleListQuery,
  workScheduleQueryKeys,
  type WorkScheduleDto,
  type WorkScheduleListResponse,
} from '@/features/work-schedule'

import { WorkScheduleDetailDialog } from './components/WorkScheduleDetailDialog'
import { WorkScheduleFormDialog } from './components/WorkScheduleFormDialog'

export function WorkScheduleSettingsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const {
    data: listResponse,
    isLoading,
    isError,
    isSuccess,
    refetch,
    isFetching,
  } = useWorkScheduleListQuery({ page, limit: pageSize })

  const schedules = listResponse?.data ?? []
  const meta = listResponse?.meta
  const totalPages = Math.max(1, meta?.totalPages ?? 1)
  const totalItems = meta?.totalItems ?? 0
  const isTrueEmpty = isSuccess && totalItems === 0
  const isPageOutOfBounds = isSuccess && totalItems > 0 && schedules.length === 0
  const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, totalItems)

  const canGoPrevious = page > 1 && !isFetching
  const canGoNext = Boolean(meta?.hasNextPage) && page < totalPages && !isFetching

  const handlePrevPage = () => {
    if (!canGoPrevious) return
    setPage((curr) => Math.max(1, Math.min(curr - 1, totalPages)))
  }

  const handleNextPage = () => {
    if (!canGoNext) return
    setPage((curr) => (curr < totalPages ? curr + 1 : curr))
  }

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<WorkScheduleDto | null>(null)

  // Focus restoration refs
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

  const handleOpenCreate = (triggerElement?: HTMLElement | null) => {
    lastTriggerRef.current = triggerElement ?? createButtonRef.current
    setSelectedSchedule(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (
    schedule: WorkScheduleDto,
    triggerElement?: HTMLElement | null,
  ) => {
    if (triggerElement) {
      lastTriggerRef.current = triggerElement
    }
    setSelectedSchedule(schedule)
    setFormOpen(true)
  }

  const handleOpenDetail = (
    schedule: WorkScheduleDto,
    triggerElement?: HTMLElement | null,
  ) => {
    if (triggerElement) {
      lastTriggerRef.current = triggerElement
    }
    setSelectedSchedule(schedule)
    setDetailOpen(true)
  }

  const handleReloadFresh = async () => {
    if (!selectedSchedule) {
      throw new Error('Không tìm thấy bản nháp đang chọn để tải lại.')
    }
    const fresh = await getWorkScheduleVersionById(selectedSchedule.id)
    if (!fresh) {
      throw new Error('Không thể tìm thấy dữ liệu bản nháp mới nhất.')
    }
    setSelectedSchedule(fresh)
    queryClient.setQueryData(workScheduleQueryKeys.detail(fresh.id), fresh)
    queryClient.setQueriesData<WorkScheduleListResponse>(
      { queryKey: workScheduleQueryKeys.lists() },
      (current) => current ? {
        ...current,
        data: current.data.map((item) => item.id === fresh.id ? fresh : item),
      } : current,
    )
    return fresh
  }

  return (
    <section className="grid gap-6">
      {/* Back link */}
      <div>
        <Link
          to="/admin/attendance"
          className="group inline-flex w-fit items-center gap-2 rounded-md bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
        >
          <ArrowLeft
            className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Quay lại danh sách chấm công
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Cài đặt lịch làm việc
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý các bản nháp lịch làm việc và giờ làm việc tiêu chuẩn của công ty.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RotateCw
              className={isFetching ? 'size-4 animate-spin' : 'size-4'}
              aria-hidden="true"
            />
            Làm mới
          </Button>

          <Button
            ref={createButtonRef}
            type="button"
            onClick={(e) => handleOpenCreate(e.currentTarget)}
            className="gap-1.5"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Tạo bản nháp mới
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Danh sách bản nháp (DRAFT)</CardTitle>
          <CardDescription>
            Các bản nháp cấu hình ca làm việc. Chưa kích hoạt hoặc tác động đến việc tính công.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Initial Loading */}
          {isLoading ? (
            <>
              {/* Mobile Skeleton */}
              <div className="grid gap-3 md:hidden">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid flex-1 gap-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="mt-4 grid gap-2">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Skeleton */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Phiên bản</TableHead>
                      <TableHead>Ngày hiệu lực</TableHead>
                      <TableHead>Ngày làm việc</TableHead>
                      <TableHead>Giờ làm việc</TableHead>
                      <TableHead>Nghỉ trưa</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRowsSkeleton columns={7} />
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}

          {/* Error State */}
          {isError ? (
            <div role="alert" className="py-10 text-center">
              <p className="text-sm font-medium text-destructive">
                Không thể tải danh sách bản nháp lịch làm việc.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Vui lòng kiểm tra kết nối tới máy chủ và thử lại.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-4 gap-1.5"
              >
                <RotateCw className="size-3.5" aria-hidden="true" />
                Thử lại
              </Button>
            </div>
          ) : null}

          {/* Empty State */}
          {isTrueEmpty ? (
            <div className="py-6">
              <EmptyState
                icon={Calendar}
                title="Chưa có bản nháp lịch làm việc"
                description="Hệ thống chưa có bản nháp nào. Nhấn 'Tạo bản nháp mới' để thiết lập ca làm việc đầu tiên."
              />
              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handleOpenCreate(e.currentTarget)}
                  className="gap-1.5"
                >
                  <CalendarPlus className="size-4" aria-hidden="true" />
                  Tạo bản nháp ngay
                </Button>
              </div>
            </div>
          ) : null}

          {/* Out of bounds state */}
          {isPageOutOfBounds ? (
            <div className="rounded-lg border border-border bg-muted/20 p-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Trang {page} hiện không có bản ghi nào
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tổng cộng có {totalItems} bản ghi ({totalPages} trang).
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={isFetching}
                >
                  Quay lại trang cuối (trang {totalPages})
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={isFetching}
                >
                  Về trang đầu
                </Button>
              </div>
            </div>
          ) : null}

          {/* Data List */}
          {schedules.length > 0 ? (
            <>
              {/* Mobile Cards */}
              <div className="grid gap-3 md:hidden">
                {schedules.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg border border-border bg-card p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-semibold text-foreground">
                            Phiên bản v{item.version}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            (rev {item.revision})
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Hiệu lực từ:{' '}
                          <span className="font-medium text-foreground">
                            {formatEffectiveDate(item.effectiveFrom)}
                          </span>
                        </p>
                      </div>
                      <StatusBadge label="Bản nháp" tone="warning" />
                    </div>

                    <dl className="mt-3 grid gap-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Ngày trong tuần:</dt>
                        <dd className="font-medium text-foreground">
                          {formatWeekdayList(item.weekdays)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Giờ làm việc:</dt>
                        <dd className="font-medium text-foreground">
                          {item.startTime} – {item.endTime}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Nghỉ trưa:</dt>
                        <dd className="font-medium text-foreground">
                          {item.breaks[0]?.startTime ?? '--:--'} –{' '}
                          {item.breaks[0]?.endTime ?? '--:--'}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleOpenDetail(item, e.currentTarget)}
                        className="h-8 gap-1 text-xs"
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                        Chi tiết
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleOpenEdit(item, e.currentTarget)}
                        className="h-8 gap-1 text-xs"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Chỉnh sửa
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Phiên bản</TableHead>
                      <TableHead>Ngày hiệu lực</TableHead>
                      <TableHead>Ngày làm việc</TableHead>
                      <TableHead>Giờ làm việc</TableHead>
                      <TableHead>Nghỉ trưa</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium text-foreground">
                          <span>v{item.version}</span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            (rev {item.revision})
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatEffectiveDate(item.effectiveFrom)}
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-block max-w-[200px] truncate"
                            title={formatWeekdayList(item.weekdays)}
                          >
                            {formatWeekdayList(item.weekdays)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Clock
                              className="size-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                            {item.startTime} – {item.endTime}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.breaks[0]?.startTime ?? '--:--'} –{' '}
                          {item.breaks[0]?.endTime ?? '--:--'}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge label="Bản nháp" tone="warning" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) =>
                                handleOpenDetail(item, e.currentTarget)
                              }
                              className="h-8 gap-1 px-2.5 text-xs"
                            >
                              <Eye className="size-3.5" aria-hidden="true" />
                              Chi tiết
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) =>
                                handleOpenEdit(item, e.currentTarget)
                              }
                              className="h-8 gap-1 px-2.5 text-xs"
                            >
                              <Pencil className="size-3.5" aria-hidden="true" />
                              Sửa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}

          {/* Pagination */}
          {totalItems > 0 ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-border pr-16 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pr-40">
              <p className="text-sm text-muted-foreground">
                {schedules.length > 0 ? (
                  <>
                    Hiển thị {fromItem}-{toItem} trong tổng số {totalItems}{' '}
                    bản ghi
                  </>
                ) : (
                  <>Tổng số {totalItems} bản ghi ({totalPages} trang)</>
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

      {/* Form Dialog for Create & Edit */}
      {formOpen ? (
        <WorkScheduleFormDialog
          key={selectedSchedule ? selectedSchedule.id : 'create-new'}
          open={formOpen}
          onOpenChange={setFormOpen}
          schedule={selectedSchedule}
          onReloadFresh={handleReloadFresh}
          onRestoreFocus={handleRestoreFocus}
        />
      ) : null}

      {/* Detail Dialog */}
      <WorkScheduleDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        schedule={selectedSchedule}
        onEdit={(schedule) => {
          setSelectedSchedule(schedule)
          setFormOpen(true)
        }}
        onRestoreFocus={handleRestoreFocus}
      />
    </section>
  )
}

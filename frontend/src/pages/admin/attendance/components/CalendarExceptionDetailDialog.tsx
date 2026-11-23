import { Calendar, Clock, Edit, FileText, Trash2 } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  EXCEPTION_KIND_LABELS,
  formatCivilDateVN,
  formatDateTime,
  type CalendarExceptionDto,
} from '@/features/work-schedule'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exception: CalendarExceptionDto | null
  onEdit: (exception: CalendarExceptionDto) => void
  onDelete: (exception: CalendarExceptionDto) => void
  onRestoreFocus?: () => void
}

export function CalendarExceptionDetailDialog({
  open,
  onOpenChange,
  exception,
  onEdit,
  onDelete,
  onRestoreFocus,
}: Props) {
  const isSwitchingRef = useRef(false)

  if (!exception) return null

  const p = exception.payload

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSwitchingRef.current) {
          // Normal close
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          if (isSwitchingRef.current) {
            isSwitchingRef.current = false
            return
          }
          onRestoreFocus?.()
        }}
      >
        <DialogHeader className="shrink-0 border-b border-border p-6 pr-12">
          <div className="flex flex-wrap items-center gap-2.5">
            <DialogTitle>Chi tiết ngoại lệ lịch làm việc</DialogTitle>
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
          </div>
          <DialogDescription>
            Tác động từ ngày {formatCivilDateVN(exception.firstAffectedDate)}. Cấu hình áp dụng trong bản nháp này.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto p-6">
          <div className="grid gap-5 text-sm">
            {/* Kind Specific Details */}
            {p.kind === 'HOLIDAY' ? (
              <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <Calendar className="size-4" aria-hidden="true" />
                    Thông tin ngày lễ
                  </div>
                  {p.holidayPolicy?.category === 'STATUTORY' ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      Lễ pháp định (Hưởng lương)
                    </span>
                  ) : p.holidayPolicy?.category === 'COMPANY' ? (
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                        p.holidayPolicy.isPaid
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                      )}
                    >
                      {p.holidayPolicy.isPaid ? 'Nghỉ doanh nghiệp (Có lương)' : 'Nghỉ doanh nghiệp (Không lương)'}
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Chưa phân loại chính sách
                    </span>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Tên ngày lễ:</span>
                    <p className="font-semibold text-foreground">{p.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Ngày lễ:</span>
                    <p className="font-semibold text-foreground">{formatCivilDateVN(p.date)}</p>
                  </div>
                </div>
                {p.holidayPolicy?.category === 'STATUTORY' && p.holidayPolicy.presetId ? (
                  <div className="text-xs text-muted-foreground">
                    <span>Mẫu danh mục: </span>
                    <span className="font-mono text-[11px] text-foreground">{p.holidayPolicy.presetId}</span>
                  </div>
                ) : null}
                <div className="border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">Căn cứ văn bản/quyết định:</span>
                  <p className="mt-0.5 text-xs font-medium text-foreground">{p.sourceReference}</p>
                </div>
              </div>
            ) : null}

            {p.kind === 'COMPENSATORY_OFF' ? (
              <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                  <Calendar className="size-4" aria-hidden="true" />
                  Thông tin nghỉ bù
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Ngày nghỉ bù:</span>
                    <p className="font-semibold text-foreground">{formatCivilDateVN(p.date)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Nghỉ bù cho ngày lễ:</span>
                    <p className="font-semibold text-foreground">{formatCivilDateVN(p.sourceHolidayDate)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {p.kind === 'SWAP' ? (
              <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                  <Calendar className="size-4" aria-hidden="true" />
                  Cặp ngày hoán đổi
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-border/80 bg-muted/30 p-2.5">
                    <span className="text-xs font-medium text-muted-foreground">Ngày nghỉ hoán đổi:</span>
                    <p className="mt-1 text-base font-bold text-foreground">{formatCivilDateVN(p.offDate)}</p>
                    <p className="text-[11px] text-muted-foreground">Vốn là ngày làm việc</p>
                  </div>
                  <div className="rounded-md border border-border/80 bg-muted/30 p-2.5">
                    <span className="text-xs font-medium text-muted-foreground">Ngày làm bù:</span>
                    <p className="mt-1 text-base font-bold text-foreground">{formatCivilDateVN(p.workDate)}</p>
                    <p className="text-[11px] text-muted-foreground">Vốn là ngày nghỉ tuần</p>
                  </div>
                </div>
              </div>
            ) : null}

            {p.kind === 'WORK_OVERRIDE' ? (
              <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                  <Clock className="size-4" aria-hidden="true" />
                  Thời gian làm việc điều chỉnh
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Ngày áp dụng:</span>
                    <p className="font-semibold text-foreground">{formatCivilDateVN(p.date)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Ca làm việc:</span>
                    <p className="font-semibold text-foreground">{p.startTime} – {p.endTime}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">Khoảng nghỉ giữa ca:</span>
                  <p className="font-medium text-foreground">
                    {p.breaks[0]?.startTime ?? '--:--'} – {p.breaks[0]?.endTime ?? '--:--'}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Reason */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                <FileText className="size-4" aria-hidden="true" />
                Lý do & Ghi chú
              </div>
              <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{p.reason}</p>
            </div>

            {/* Audit Metadata */}
            <div className="grid gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <span className="font-medium text-foreground">Tạo lúc:</span>{' '}
                {formatDateTime(exception.createdAt)}
              </div>
              <div>
                <span className="font-medium text-foreground">Cập nhật lúc:</span>{' '}
                {formatDateTime(exception.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex items-center justify-between border-t border-border p-4 sm:px-6">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              isSwitchingRef.current = true
              onOpenChange(false)
              onDelete(exception)
            }}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Xóa
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                isSwitchingRef.current = true
                onOpenChange(false)
                onEdit(exception)
              }}
            >
              <Edit className="size-3.5" aria-hidden="true" />
              Chỉnh sửa
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

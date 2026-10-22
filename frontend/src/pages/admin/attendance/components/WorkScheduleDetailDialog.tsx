import { useRef } from 'react'
import { Edit, Calendar, Clock, Globe } from 'lucide-react'

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
  formatDateTime,
  formatEffectiveDate,
  WEEKDAYS,
  type WorkScheduleDto,
} from '@/features/work-schedule'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: WorkScheduleDto | null
  onEdit: (schedule: WorkScheduleDto) => void
  onRestoreFocus?: () => void
}

export function WorkScheduleDetailDialog({
  open,
  onOpenChange,
  schedule,
  onEdit,
  onRestoreFocus,
}: Props) {
  const isSwitchingToEditRef = useRef(false)

  if (!schedule) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSwitchingToEditRef.current) {
          // Normal close
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          if (isSwitchingToEditRef.current) {
            isSwitchingToEditRef.current = false
            return
          }
          onRestoreFocus?.()
        }}
      >
        <DialogHeader className="shrink-0 border-b border-border p-6 pr-12">
          <div className="flex flex-wrap items-center gap-2.5">
            <DialogTitle>Bản nháp lịch làm việc v{schedule.version}</DialogTitle>
            <StatusBadge label="Bản nháp" tone="warning" />
            <span className="text-xs text-muted-foreground">
              (rev {schedule.revision})
            </span>
          </div>
          <DialogDescription>
            Cấu hình thời gian làm việc chuẩn của công ty (chưa áp dụng vào tính công).
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto p-6">
          <div className="grid gap-5 text-sm">
            {/* Effective date & Timezone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Calendar className="size-4" aria-hidden="true" />
                  Ngày hiệu lực
                </div>
                <p className="mt-1.5 text-base font-semibold text-foreground">
                  {formatEffectiveDate(schedule.effectiveFrom)}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Globe className="size-4" aria-hidden="true" />
                  Múi giờ
                </div>
                <p className="mt-1.5 text-base font-semibold text-foreground">
                  {schedule.timezone}
                </p>
              </div>
            </div>

            {/* Weekdays */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Ngày làm việc trong tuần
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {WEEKDAYS.map((day) => {
                  const isWorkDay = schedule.weekdays.includes(day.value)
                  return (
                    <span
                      key={day.value}
                      className={
                        isWorkDay
                          ? 'inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary'
                          : 'inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground opacity-50'
                      }
                    >
                      {day.label} ({day.short})
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Working & Break hours */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="size-4" aria-hidden="true" />
                  Thời gian làm việc
                </div>
                <p className="mt-2 text-lg font-bold text-foreground">
                  {schedule.startTime} – {schedule.endTime}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Thời gian vào ca đến khi kết thúc
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="size-4" aria-hidden="true" />
                  Khoảng nghỉ giữa ca
                </div>
                <p className="mt-2 text-lg font-bold text-foreground">
                  {schedule.breaks[0]?.startTime ?? '--:--'} –{' '}
                  {schedule.breaks[0]?.endTime ?? '--:--'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Không tính vào giờ làm việc thực tế
                </p>
              </div>
            </div>

            {/* Audit timestamps */}
            <div className="grid gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <span className="font-medium text-foreground">Tạo lúc:</span>{' '}
                {formatDateTime(schedule.createdAt)}
              </div>
              <div>
                <span className="font-medium text-foreground">Cập nhật lúc:</span>{' '}
                {formatDateTime(schedule.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border p-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          <Button
            type="button"
            className="gap-1.5"
            onClick={() => {
              isSwitchingToEditRef.current = true
              onOpenChange(false)
              onEdit(schedule)
            }}
          >
            <Edit className="size-4" aria-hidden="true" />
            Chỉnh sửa bản nháp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

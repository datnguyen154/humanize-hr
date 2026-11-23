import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function TimesheetError({ onRetry, isFetching, message }: { onRetry: () => void; isFetching: boolean; message: string }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 p-4 text-sm">
      <span className="text-destructive">{message}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={isFetching}>Thử lại</Button>
    </div>
  )
}

export function TimesheetSkeleton() {
  return (
    <div className="grid gap-4" aria-label="Đang tải bảng công">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

/** Shown when part of the month has no ACTIVE calendar: standard days cannot be determined yet. */
export function IncompleteCalendarNotice({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        Một phần tháng chưa có lịch làm việc được kích hoạt, nên chưa xác định được ngày công chuẩn. Những ngày đó không được tính công.
        {isAdmin ? ' Kích hoạt lịch trong Cài đặt lịch làm việc để hoàn thiện bảng công.' : ''}
      </p>
    </div>
  )
}

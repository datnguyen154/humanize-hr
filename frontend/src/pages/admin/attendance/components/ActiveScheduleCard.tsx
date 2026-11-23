import { CalendarCheck2, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatEffectiveDate, formatWeekdayList, useWorkScheduleListQuery } from '@/features/work-schedule'

/** ACTIVE versions are immutable; the newest effectiveFrom applies from its start date onwards. */
export function ActiveScheduleCard() {
  const { data, isLoading, isError, refetch, isFetching } = useWorkScheduleListQuery({ page: 1, limit: 5, status: 'ACTIVE' })
  const versions = data?.data ?? []
  // Versions come newest effectiveFrom first; the first one already started is the one applying today.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
  const currentId = versions.find((item) => item.effectiveFrom <= today)?.id
  const stateOf = (effectiveFrom: string, id: string) =>
    effectiveFrom > today ? { label: 'Sắp áp dụng', tone: 'warning' as const }
      : id === currentId ? { label: 'Đang áp dụng', tone: 'success' as const }
        : { label: 'Đã được thay thế', tone: 'neutral' as const }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarCheck2 className="size-5 text-primary" aria-hidden="true" />
          Lịch đang áp dụng
        </CardTitle>
        <CardDescription>
          Chấm công tính đi muộn theo giờ vào của lịch có hiệu lực trong ngày. Lịch đã kích hoạt không thể chỉnh sửa.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="grid gap-2">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : isError ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-destructive">Không thể tải lịch đang áp dụng.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
              <RotateCw className="size-3.5" aria-hidden="true" />
              Thử lại
            </Button>
          </div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có lịch nào được kích hoạt. Chấm công đang dùng mốc mặc định: sau 08:00 là đi muộn.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {versions.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Phiên bản v{item.version} · từ {formatEffectiveDate(item.effectiveFrom)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatWeekdayList(item.weekdays)} · {item.startTime}–{item.endTime} · nghỉ {item.breaks[0].startTime}–{item.breaks[0].endTime}
                  </p>
                </div>
                <StatusBadge {...stateOf(item.effectiveFrom, item.id)} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Activity } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getActivityIcon } from '@/features/dashboard/lib/employee-dashboard-activity'
import type { EmployeeDashboardRecentActivity } from '@/features/dashboard/types/employee-dashboard.types'

dayjs.extend(relativeTime)
dayjs.locale('vi')

type RecentActivitiesCardProps = {
  activities: EmployeeDashboardRecentActivity[] | undefined
}

export function RecentActivitiesCard({ activities }: RecentActivitiesCardProps) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Hoạt động gần đây
          </h3>
        </div>

        {activities?.length ? (
          <div className="mt-2 divide-y divide-border">
            {activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type)

              return (
                <div
                  key={`${activity.type}-${activity.createdAt}`}
                  className="flex gap-3 rounded-md py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                    <ActivityIcon className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dayjs(activity.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="Chưa có hoạt động nào"
            description="Các hoạt động chấm công và nghỉ phép của bạn sẽ xuất hiện tại đây."
            className="py-10"
          />
        )}
      </CardContent>
    </Card>
  )
}

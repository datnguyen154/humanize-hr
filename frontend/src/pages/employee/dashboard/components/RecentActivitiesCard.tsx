import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'

import { Card, CardContent } from '@/components/ui/card'
import { getActivityIcon } from '@/features/dashboard/lib/employee-dashboard-activity'
import type { EmployeeDashboardRecentActivity } from '@/features/dashboard/types/employee-dashboard.types'

dayjs.extend(relativeTime)
dayjs.locale('vi')

type RecentActivitiesCardProps = {
  activities: EmployeeDashboardRecentActivity[] | undefined
}

export function RecentActivitiesCard({ activities }: RecentActivitiesCardProps) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4">
        <h3 className="text-base font-semibold text-foreground">
          Hoạt động gần đây
        </h3>

        {activities?.length ? (
          <div className="grid gap-3">
            {activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type)

              return (
                <div
                  key={`${activity.type}-${activity.createdAt}`}
                  className="flex items-center gap-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <ActivityIcon className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayjs(activity.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa có hoạt động gần đây
          </p>
        )}
      </CardContent>
    </Card>
  )
}

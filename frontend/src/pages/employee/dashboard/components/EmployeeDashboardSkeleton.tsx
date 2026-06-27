import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function EmployeeDashboardKpiSkeleton() {
  return (
    <div className="grid h-full auto-rows-fr gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function RecentActivitiesSkeleton() {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-full max-w-56" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

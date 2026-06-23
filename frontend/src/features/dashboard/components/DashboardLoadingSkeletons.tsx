import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardKPISkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-9 w-20" />
            </div>
            <Skeleton className="size-11 shrink-0 rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardChartSkeleton() {
  return (
    <div className="grid h-72 content-end gap-3">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function DashboardActivitySkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-full max-w-72" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      ))}
    </div>
  )
}

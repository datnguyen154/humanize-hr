import type { HTMLAttributes } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

type TableRowsSkeletonProps = {
  rows?: number
  columns: number
}

export function TableRowsSkeleton({
  rows = 5,
  columns,
}: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton
                className={cn(
                  'h-4',
                  columnIndex === 0 ? 'w-28' : 'w-full max-w-36',
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

type DetailPageSkeletonProps = {
  cards?: number
  fieldsPerCard?: number
  columnsClassName?: string
}

export function DetailPageSkeleton({
  cards = 2,
  fieldsPerCard = 3,
  columnsClassName = 'lg:grid-cols-2',
}: DetailPageSkeletonProps) {
  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Skeleton className="size-20 shrink-0 rounded-full" />
              <div className="grid w-full min-w-0 gap-3">
                <Skeleton className="h-7 w-56 max-w-full" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={cn('grid gap-5', columnsClassName)}>
        {Array.from({ length: cards }).map((_, cardIndex) => (
          <Card key={cardIndex}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {Array.from({ length: fieldsPerCard }).map((__, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <Skeleton className="size-9 shrink-0 rounded-lg" />
                    <div className="grid flex-1 gap-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-full max-w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

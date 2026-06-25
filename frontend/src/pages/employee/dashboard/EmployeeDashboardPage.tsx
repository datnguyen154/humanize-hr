import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useEmployeeDashboardQuery } from '@/features/dashboard/hooks/useEmployeeDashboardQuery'
import { getActivityIcon } from '@/features/dashboard/lib/employee-dashboard-activity'
import type {
  EmployeeDashboardAttendanceSummary,
  EmployeeDashboardLeaveSummary,
  EmployeeDashboardTodayAttendance,
  EmployeeDashboardWorkingStatus,
} from '@/features/dashboard/types/employee-dashboard.types'

dayjs.extend(relativeTime)
dayjs.locale('vi')

type EmployeeDashboardKpi = {
  label: string
  value: string
}

type TodayAttendanceCardViewModel = {
  workingStatus: string
  attendanceStatus: string
  checkInTime: string
  checkOutTime: string
}

type QuickAction = {
  label: string
  path: string
}

const quickActions: QuickAction[] = [
  {
    label: 'Chấm công',
    path: '/employee/attendance',
  },
  {
    label: 'Tạo đơn nghỉ phép',
    path: '/employee/leave-requests/create',
  },
  {
    label: 'Xem đơn nghỉ phép',
    path: '/employee/leave-requests',
  },
  {
    label: 'Hồ sơ cá nhân',
    path: '/employee/profile',
  },
]

const todayAttendanceStatusLabel: Record<string, string> = {
  PRESENT: 'Đúng giờ',
  LATE: 'Đi muộn',
}

const workingStatusLabel: Record<EmployeeDashboardWorkingStatus, string> = {
  NOT_CHECKED_IN: 'Chưa chấm công',
  WORKING: 'Đang làm việc',
  CHECKED_OUT: 'Đã hoàn thành ca làm',
}

const formatTime = (date: string | null | undefined) => {
  if (!date) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(new Date(date))
}

const getTodayAttendanceLabel = (
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined,
) => {
  if (!todayAttendance?.status) {
    return 'Chưa có trạng thái'
  }

  return todayAttendanceStatusLabel[todayAttendance.status] ?? todayAttendance.status
}

const resolveWorkingStatus = (
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined,
): EmployeeDashboardWorkingStatus => {
  if (todayAttendance?.workingStatus) {
    return todayAttendance.workingStatus
  }

  if (todayAttendance?.checkInTime) {
    return todayAttendance.checkOutTime ? 'CHECKED_OUT' : 'WORKING'
  }

  return 'NOT_CHECKED_IN'
}

const createTodayAttendanceCardViewModel = (
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined,
): TodayAttendanceCardViewModel => {
  const workingStatus = resolveWorkingStatus(todayAttendance)

  return {
    workingStatus: workingStatusLabel[workingStatus],
    attendanceStatus: getTodayAttendanceLabel(todayAttendance),
    checkInTime: formatTime(todayAttendance?.checkInTime),
    checkOutTime: formatTime(todayAttendance?.checkOutTime),
  }
}

const createEmployeeDashboardKpis = ({
  todayAttendance,
  attendanceSummary,
  leaveSummary,
}: {
  todayAttendance: EmployeeDashboardTodayAttendance | null | undefined
  attendanceSummary: EmployeeDashboardAttendanceSummary | undefined
  leaveSummary: EmployeeDashboardLeaveSummary | undefined
}): EmployeeDashboardKpi[] => [
  {
    label: 'Trạng thái hôm nay',
    value: getTodayAttendanceLabel(todayAttendance),
  },
  {
    label: 'Đi làm đúng giờ',
    value: String(attendanceSummary?.present ?? 0),
  },
  {
    label: 'Đi muộn',
    value: String(attendanceSummary?.late ?? 0),
  },
  {
    label: 'Đơn chờ duyệt',
    value: String(leaveSummary?.pendingLeaveRequests ?? 0),
  },
]

function EmployeeDashboardKpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

function TodayAttendanceSkeleton() {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-2 sm:grid-cols-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivitiesSkeleton() {
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

export function EmployeeDashboardPage() {
  const {
    todayAttendance,
    attendanceSummary,
    leaveSummary,
    recentActivities,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useEmployeeDashboardQuery()
  const kpiCards = createEmployeeDashboardKpis({
    todayAttendance,
    attendanceSummary,
    leaveSummary,
  })
  const todayAttendanceCard =
    createTodayAttendanceCardViewModel(todayAttendance)

  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-bold text-foreground">
        Bảng điều khiển nhân viên
      </h2>

      {isError ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">
              Không thể tải dữ liệu bảng điều khiển nhân viên
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={refetch}
              disabled={isFetching}
            >
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <EmployeeDashboardKpiSkeleton />
      ) : !isError ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <TodayAttendanceSkeleton />
      ) : !isError ? (
        <Card>
          <CardContent className="grid gap-3 p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Chấm công hôm nay</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {todayAttendanceCard.workingStatus}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <p>
                <span className="text-muted-foreground">Trạng thái: </span>
                <span className="font-medium text-foreground">
                  {todayAttendanceCard.attendanceStatus}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Giờ vào: </span>
                <span className="font-medium text-foreground">
                  {todayAttendanceCard.checkInTime}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Giờ ra: </span>
                <span className="font-medium text-foreground">
                  {todayAttendanceCard.checkOutTime}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="grid gap-3 p-4">
          <h3 className="text-base font-semibold text-foreground">
            Thao tác nhanh
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <RecentActivitiesSkeleton />
      ) : !isError ? (
        <Card>
          <CardContent className="grid gap-3 p-4">
            <h3 className="text-base font-semibold text-foreground">
              Hoạt động gần đây
            </h3>

            {recentActivities?.length ? (
              <div className="grid gap-3">
                {recentActivities.map((activity) => {
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
      ) : null}
    </section>
  )
}

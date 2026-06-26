import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useEmployeeDashboardQuery } from '@/features/dashboard/hooks/useEmployeeDashboardQuery'
import { useMyEmployeeProfileQuery } from '@/features/employee'

import { EmployeeDashboardHeader } from './components/EmployeeDashboardHeader'
import {
  EmployeeDashboardKpiSkeleton,
  RecentActivitiesSkeleton,
  TodayAttendanceSkeleton,
} from './components/EmployeeDashboardSkeleton'
import { EmployeeKpiCards } from './components/EmployeeKpiCards'
import { EmployeeQuickActions } from './components/EmployeeQuickActions'
import { RecentActivitiesCard } from './components/RecentActivitiesCard'
import { TodayAttendanceCard } from './components/TodayAttendanceCard'

export function EmployeeDashboardPage() {
  const employeeProfileQuery = useMyEmployeeProfileQuery()
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

  return (
    <section className="grid gap-4">
      <EmployeeDashboardHeader fullName={employeeProfileQuery.data?.fullName} />

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
        <EmployeeKpiCards
          todayAttendance={todayAttendance}
          attendanceSummary={attendanceSummary}
          leaveSummary={leaveSummary}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <EmployeeQuickActions />
        </div>
        <div className="lg:col-span-8">
          {isLoading ? (
            <TodayAttendanceSkeleton />
          ) : !isError ? (
            <TodayAttendanceCard todayAttendance={todayAttendance} />
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <RecentActivitiesSkeleton />
      ) : !isError ? (
        <RecentActivitiesCard activities={recentActivities} />
      ) : null}
    </section>
  )
}

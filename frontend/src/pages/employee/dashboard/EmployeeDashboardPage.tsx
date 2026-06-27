import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCheckInMutation } from '@/features/attendance/hooks/useCheckInMutation'
import { useCheckOutMutation } from '@/features/attendance/hooks/useCheckOutMutation'
import { attendanceQueryKeys } from '@/features/attendance/hooks/useAttendanceHistoryQuery'
import { getAttendanceErrorMessage } from '@/features/attendance/lib/attendance-error'
import {
  employeeDashboardQueryKey,
  useEmployeeDashboardQuery,
} from '@/features/dashboard/hooks/useEmployeeDashboardQuery'
import { useMyEmployeeProfileQuery } from '@/features/employee'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

import { EmployeeAttendanceWidget } from './components/EmployeeAttendanceWidget'
import { EmployeeDashboardHeader } from './components/EmployeeDashboardHeader'
import {
  EmployeeDashboardKpiSkeleton,
  RecentActivitiesSkeleton,
} from './components/EmployeeDashboardSkeleton'
import { EmployeeKpiCards } from './components/EmployeeKpiCards'
import { EmployeeQuickActions } from './components/EmployeeQuickActions'
import { RecentActivitiesCard } from './components/RecentActivitiesCard'
import { resolveWorkingStatus } from './components/employee-dashboard.mappers'

export function EmployeeDashboardPage() {
  const queryClient = useQueryClient()
  const employeeProfileQuery = useMyEmployeeProfileQuery()
  const checkInMutation = useCheckInMutation()
  const checkOutMutation = useCheckOutMutation()
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

  const refreshAttendanceData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: employeeDashboardQueryKey }),
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all }),
    ])
  }

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync()
      await refreshAttendanceData()
      showSuccessToast(
        'Thời gian vào làm đã được ghi nhận.',
        'Chấm công vào thành công',
      )
    } catch (error) {
      showErrorToast(
        getAttendanceErrorMessage(error, 'check-in'),
        'Không thể check in',
      )
    }
  }

  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync()
      await refreshAttendanceData()
      showSuccessToast(
        'Thời gian ra về đã được ghi nhận.',
        'Chấm công ra thành công',
      )
    } catch (error) {
      showErrorToast(
        getAttendanceErrorMessage(error, 'check-out'),
        'Không thể check out',
      )
    }
  }

  return (
    <section className="grid gap-4">
      <EmployeeDashboardHeader fullName={employeeProfileQuery.data?.fullName}>
        {isLoading ? (
          <Skeleton className="h-[70px] w-full rounded-xl lg:w-[320px]" />
        ) : !isError ? (
          <EmployeeAttendanceWidget
            workingStatus={resolveWorkingStatus(todayAttendance)}
            status={todayAttendance?.status}
            checkInTime={todayAttendance?.checkInTime}
            checkOutTime={todayAttendance?.checkOutTime}
            isCheckingIn={checkInMutation.isPending}
            isCheckingOut={checkOutMutation.isPending}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
        ) : null}
      </EmployeeDashboardHeader>

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

      <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
        <div className="min-w-0 lg:col-span-5">
          <EmployeeQuickActions />
        </div>

        <div className="min-w-0 lg:col-span-7">
          {isLoading ? (
            <EmployeeDashboardKpiSkeleton />
          ) : !isError ? (
            <EmployeeKpiCards
              todayAttendance={todayAttendance}
              attendanceSummary={attendanceSummary}
              leaveSummary={leaveSummary}
            />
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

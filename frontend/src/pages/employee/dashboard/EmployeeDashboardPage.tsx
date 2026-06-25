import { useEmployeeDashboardQuery } from '@/features/dashboard/hooks/useEmployeeDashboardQuery'

export function EmployeeDashboardPage() {
  const {
    todayAttendance,
    attendanceSummary,
    leaveSummary,
    recentActivities,
    isLoading,
    isError,
  } = useEmployeeDashboardQuery()

  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-bold text-foreground">
        Bảng điều khiển nhân viên
      </h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Đang tải dữ liệu bảng điều khiển...
        </p>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive">
          Không thể tải dữ liệu bảng điều khiển
        </p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>
            Chấm công hôm nay:{' '}
            <span className="font-medium text-foreground">
              {todayAttendance?.status ?? 'Chưa chấm công'}
            </span>
          </p>
          <p>
            Đi làm đúng giờ:{' '}
            <span className="font-medium text-foreground">
              {attendanceSummary?.present ?? 0}
            </span>
          </p>
          <p>
            Đi muộn:{' '}
            <span className="font-medium text-foreground">
              {attendanceSummary?.late ?? 0}
            </span>
          </p>
          <p>
            Đơn nghỉ phép chờ duyệt:{' '}
            <span className="font-medium text-foreground">
              {leaveSummary?.pendingLeaveRequests ?? 0}
            </span>
          </p>
          <p>
            Hoạt động gần đây:{' '}
            <span className="font-medium text-foreground">
              {recentActivities?.length ?? 0}
            </span>
          </p>
        </div>
      ) : null}
    </section>
  )
}

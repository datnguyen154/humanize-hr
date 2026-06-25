import { Card, CardContent } from '@/components/ui/card'
import { useEmployeeDashboardQuery } from '@/features/dashboard/hooks/useEmployeeDashboardQuery'
import type {
  EmployeeDashboardAttendanceSummary,
  EmployeeDashboardLeaveSummary,
  EmployeeDashboardTodayAttendance,
} from '@/features/dashboard/types/employee-dashboard.types'

type EmployeeDashboardKpi = {
  label: string
  value: string
}

const todayAttendanceStatusLabel: Record<string, string> = {
  PRESENT: 'Đúng giờ',
  LATE: 'Đi muộn',
}

const getTodayAttendanceLabel = (
  todayAttendance: EmployeeDashboardTodayAttendance | undefined,
) => {
  if (!todayAttendance?.status) {
    return 'Chưa chấm công'
  }

  return todayAttendanceStatusLabel[todayAttendance.status] ?? todayAttendance.status
}

const createEmployeeDashboardKpis = ({
  todayAttendance,
  attendanceSummary,
  leaveSummary,
}: {
  todayAttendance: EmployeeDashboardTodayAttendance | undefined
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

export function EmployeeDashboardPage() {
  const {
    todayAttendance,
    attendanceSummary,
    leaveSummary,
    isLoading,
    isError,
  } = useEmployeeDashboardQuery()
  const kpiCards = createEmployeeDashboardKpis({
    todayAttendance,
    attendanceSummary,
    leaveSummary,
  })

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

      {!isError ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {isLoading ? 'Đang tải...' : item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  )
}

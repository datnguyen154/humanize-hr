import type {
  DashboardActivity,
  DashboardActivityMapperInput,
} from '../types/dashboard.types'

const ACTIVITY_LIMIT = 10

export const mapDashboardActivities = ({
  attendanceRecords,
  leaveRequests,
  departments,
}: DashboardActivityMapperInput): DashboardActivity[] => {
  const attendanceActivities: DashboardActivity[] = attendanceRecords.map(
    (record) => ({
      id: `attendance-${record.id}`,
      type: 'attendance',
      message: `${record.employee.fullName} đã chấm công`,
      createdAt: record.createdAt,
    }),
  )

  const leaveRequestActivities: DashboardActivity[] = leaveRequests.map(
    (leaveRequest) => ({
      id: `leave-request-${leaveRequest.id}`,
      type: 'leave-request',
      message: `${leaveRequest.employee.fullName} gửi đơn nghỉ phép`,
      createdAt: leaveRequest.createdAt,
    }),
  )

  const departmentActivities: DashboardActivity[] = departments.map(
    (department) => ({
      id: `department-${department.id}`,
      type: 'department',
      message: `Phòng ban ${department.name} được tạo`,
      createdAt: department.createdAt,
    }),
  )

  return [
    ...attendanceActivities,
    ...leaveRequestActivities,
    ...departmentActivities,
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, ACTIVITY_LIMIT)
}

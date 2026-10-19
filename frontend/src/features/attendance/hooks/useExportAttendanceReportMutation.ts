import { useMutation } from '@tanstack/react-query'
import { exportAttendanceMonthlyReport } from '../api/attendance.api'

export function useExportAttendanceReportMutation() {
  return useMutation({ mutationFn: exportAttendanceMonthlyReport })
}

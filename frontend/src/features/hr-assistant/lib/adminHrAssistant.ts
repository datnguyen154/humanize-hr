import { getAttendanceList } from '@/features/attendance/api/attendance.api'
import { getDepartments } from '@/features/department/api/department.api'
import { getEmployees } from '@/features/employee/api/employee.api'
import { getLeaveRequests } from '@/features/leave-request/api/leaveRequest.api'

import type { HrAssistantQueryResult, HrAssistantQuestion } from '../types/hrAssistant.types'

export const adminAssistantQuestions = [
  { key: 'ADMIN_TOTAL_EMPLOYEES', label: 'Hiện có bao nhiêu nhân viên?' },
  { key: 'ADMIN_ACTIVE_EMPLOYEES', label: 'Có bao nhiêu nhân viên đang làm việc?' },
  { key: 'ADMIN_INACTIVE_EMPLOYEES', label: 'Có bao nhiêu nhân viên đang tạm ngưng?' },
  { key: 'ADMIN_TOTAL_DEPARTMENTS', label: 'Hiện có bao nhiêu phòng ban?' },
  { key: 'ADMIN_ACTIVE_DEPARTMENTS', label: 'Có bao nhiêu phòng ban đang hoạt động?' },
  { key: 'ADMIN_TODAY_ATTENDANCE', label: 'Hôm nay có bao nhiêu nhân viên đã chấm công?' },
  { key: 'ADMIN_TODAY_LATE', label: 'Hôm nay có bao nhiêu nhân viên đi muộn?' },
  { key: 'ADMIN_PENDING_LEAVE', label: 'Có bao nhiêu đơn nghỉ phép đang chờ duyệt?' },
  { key: 'ADMIN_TOTAL_LEAVE', label: 'Hiện có bao nhiêu đơn nghỉ phép?' },
] as const satisfies readonly HrAssistantQuestion[]

type AdminQuestionKey = typeof adminAssistantQuestions[number]['key']

const countFormat = new Intl.NumberFormat('vi-VN')
const pageParams = { page: 1, limit: 1 }

// Attendance dates follow the backend's company timezone, even when traveling.
const getTodayParams = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value
  const date = `${part('year')}-${part('month')}-${part('day')}`
  return { ...pageParams, fromDate: date, toDate: date }
}

// Counts come from server pagination metadata, never the first page's length.
const answerResolvers: Record<AdminQuestionKey, () => Promise<string>> = {
  ADMIN_TOTAL_EMPLOYEES: async () => {
    const { meta } = await getEmployees(pageParams)
    return `Hệ thống hiện có ${countFormat.format(meta.totalItems)} nhân viên.`
  },
  ADMIN_ACTIVE_EMPLOYEES: async () => {
    const { meta } = await getEmployees({ ...pageParams, status: 'ACTIVE' })
    return `Hiện có ${countFormat.format(meta.totalItems)} nhân viên đang làm việc.`
  },
  ADMIN_INACTIVE_EMPLOYEES: async () => {
    const { meta } = await getEmployees({ ...pageParams, status: 'INACTIVE' })
    return `Hiện có ${countFormat.format(meta.totalItems)} nhân viên đang tạm ngưng.`
  },
  ADMIN_TOTAL_DEPARTMENTS: async () => {
    const { meta } = await getDepartments(pageParams)
    return `Hệ thống hiện có ${countFormat.format(meta.totalItems)} phòng ban.`
  },
  ADMIN_ACTIVE_DEPARTMENTS: async () => {
    const { meta } = await getDepartments({ ...pageParams, status: 'ACTIVE' })
    return `Hiện có ${countFormat.format(meta.totalItems)} phòng ban đang hoạt động.`
  },
  ADMIN_TODAY_ATTENDANCE: async () => {
    const { meta } = await getAttendanceList(getTodayParams())
    return `Hôm nay có ${countFormat.format(meta.totalItems)} nhân viên đã chấm công.`
  },
  ADMIN_TODAY_LATE: async () => {
    const { meta } = await getAttendanceList({ ...getTodayParams(), status: 'LATE' })
    return `Hôm nay có ${countFormat.format(meta.totalItems)} nhân viên đi muộn.`
  },
  ADMIN_PENDING_LEAVE: async () => {
    const { meta } = await getLeaveRequests({ ...pageParams, status: 'PENDING' })
    return `Hiện có ${countFormat.format(meta.totalItems)} đơn nghỉ phép đang chờ duyệt trong hệ thống.`
  },
  ADMIN_TOTAL_LEAVE: async () => {
    const { meta } = await getLeaveRequests(pageParams)
    return `Hệ thống hiện có ${countFormat.format(meta.totalItems)} đơn nghỉ phép.`
  },
}

export async function queryAdminHrAssistant(questionKey: string): Promise<HrAssistantQueryResult> {
  const question = adminAssistantQuestions.find((item) => item.key === questionKey)
  if (!question) throw new Error('Câu hỏi không hợp lệ.')

  return {
    questionKey: question.key,
    answer: await answerResolvers[question.key](),
    type: 'TEXT',
  }
}

import type { EmployeeStatus } from '../types/employee.types'

export const employeeStatusLabel: Record<EmployeeStatus, string> = {
  ACTIVE: 'Đang làm việc',
  INACTIVE: 'Tạm ngưng',
}

export const formatEmployeeDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN').format(new Date(date))

export const toDateInputValue = (date: string) => date.slice(0, 10)

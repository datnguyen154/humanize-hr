import { z } from 'zod'

import type {
  EmployeeDetail,
  UpdateEmployeeRequest,
} from '@/features/employee'
import { toDateInputValue } from '@/features/employee'

export const employeeEditSchema = z.object({
  employeeCode: z.string().min(1, 'Vui lòng nhập mã nhân viên'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  phone: z.string().optional(),
  position: z.string().min(1, 'Vui lòng nhập chức vụ'),
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Vui lòng chọn trạng thái',
  }),
  joinedAt: z.string().min(1, 'Vui lòng chọn ngày vào làm'),
})

export type EmployeeEditFormValues = z.infer<typeof employeeEditSchema>

export const employeeInformationEditSchema = employeeEditSchema.omit({
  status: true,
})

export type EmployeeInformationEditFormValues = z.infer<
  typeof employeeInformationEditSchema
>

export const emptyEmployeeEditFormValues: EmployeeEditFormValues = {
  employeeCode: '',
  fullName: '',
  email: '',
  phone: '',
  position: '',
  status: 'ACTIVE',
  joinedAt: '',
}

export const emptyEmployeeInformationEditFormValues: EmployeeInformationEditFormValues = {
  employeeCode: '',
  fullName: '',
  email: '',
  phone: '',
  position: '',
  joinedAt: '',
}

export const toEmployeeEditFormValues = (
  employee: EmployeeDetail,
): EmployeeEditFormValues => ({
  employeeCode: employee.employeeCode,
  fullName: employee.fullName,
  email: employee.email,
  phone: employee.phone ?? '',
  position: employee.position,
  status: employee.status,
  joinedAt: toDateInputValue(employee.joinedAt),
})

export const toEmployeeInformationEditFormValues = (
  employee: EmployeeDetail,
): EmployeeInformationEditFormValues => ({
  employeeCode: employee.employeeCode,
  fullName: employee.fullName,
  email: employee.email,
  phone: employee.phone ?? '',
  position: employee.position,
  joinedAt: toDateInputValue(employee.joinedAt),
})

export const toUpdateEmployeeRequest = (
  values: EmployeeEditFormValues,
): UpdateEmployeeRequest => ({
  employeeCode: values.employeeCode,
  fullName: values.fullName,
  email: values.email,
  phone: values.phone?.trim() || undefined,
  position: values.position,
  status: values.status,
  joinedAt: new Date(`${values.joinedAt}T00:00:00.000Z`).toISOString(),
})

export const toUpdateEmployeeInformationRequest = (
  values: EmployeeInformationEditFormValues,
): UpdateEmployeeRequest => ({
  employeeCode: values.employeeCode,
  fullName: values.fullName,
  email: values.email,
  phone: values.phone?.trim() || undefined,
  position: values.position,
  joinedAt: new Date(`${values.joinedAt}T00:00:00.000Z`).toISOString(),
})

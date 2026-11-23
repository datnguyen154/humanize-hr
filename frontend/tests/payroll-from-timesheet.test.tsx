import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { getEmployeeTimesheet } from '@/features/attendance/api/attendance.api'
import { currentCompanyPeriod } from '@/features/attendance/lib/timesheet'
import type { EmployeeTimesheet } from '@/features/attendance/types/timesheet.types'
import { createPayroll, createPayrollFromTimesheet } from '@/features/payroll/api/payroll.api'
import { proratedBaseSalary } from '@/features/payroll'
import { CreatePayrollDialog } from '@/pages/admin/payrolls/components/CreatePayrollDialog'

vi.mock('@/features/attendance/api/attendance.api', () => ({ getEmployeeTimesheet: vi.fn() }))
vi.mock('@/features/payroll/api/payroll.api', () => ({ createPayroll: vi.fn(), createPayrollFromTimesheet: vi.fn() }))
vi.mock('@/lib/toast', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn() }))
vi.mock('@/features/employee', () => ({
  useEmployeesQuery: () => ({ data: { data: [{ id: 'e1', fullName: 'Trần Minh Anh', employeeCode: 'NV001' }] } }),
}))

const sheet = (standardDays: number | null): EmployeeTimesheet => ({
  period: { year: 2026, month: 10 }, standardDays, isCalendarComplete: standardDays !== null,
  employee: { id: 'e1', employeeCode: 'NV001', fullName: 'Trần Minh Anh', departmentName: null, status: 'ACTIVE', joinedAt: '2024-01-01' },
  summary: { requiredDays: 22, presentDays: 18, lateDays: 1, paidLeaveDays: 1, unpaidLeaveDays: 0, absentDays: 3, upcomingDays: 0,
    outOfScheduleDays: 0, missingCheckOutDays: 0, noScheduleDays: 0, payableDays: 19 },
  days: [],
})

function setup() {
  const onOpenChange = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter><CreatePayrollDialog open onOpenChange={onOpenChange} /></MemoryRouter></QueryClientProvider>)
  return { onOpenChange }
}
const fill = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const submit = () => screen.getByRole('button', { name: 'Tạo bảng lương' }) as HTMLButtonElement

beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

it('preview mirrors the backend rounding rule', () => {
  expect(proratedBaseSalary(15000000, 19, 22)).toBe(12954545)
  expect(proratedBaseSalary(10000000, 1, 6)).toBe(1666667)
  expect(proratedBaseSalary(10000000, 0, 0)).toBe(0)
})

it('timesheet mode shows payable/standard days, previews base salary and posts monthlySalary only', async () => {
  vi.mocked(getEmployeeTimesheet).mockResolvedValue(sheet(22))
  vi.mocked(createPayrollFromTimesheet).mockResolvedValue({} as never)
  const { onOpenChange } = setup()
  fill(/Nhân viên/, 'e1')
  fill(/Lương tháng theo hợp đồng/, '15000000')
  await screen.findByText('19 / 22')
  expect(screen.getAllByText(/12\.954\.545/).length).toBeGreaterThan(0)
  fireEvent.click(submit())
  await waitFor(() => expect(createPayrollFromTimesheet).toHaveBeenCalledTimes(1))
  const payload = vi.mocked(createPayrollFromTimesheet).mock.calls[0][0]
  expect(payload).toMatchObject({ employeeId: 'e1', monthlySalary: 15000000, bonus: 0, deduction: 0 })
  expect(payload).not.toHaveProperty('baseSalary')
  expect(createPayroll).not.toHaveBeenCalled()
  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
})

it('blocks the current (open) month and months without a complete calendar', async () => {
  vi.mocked(getEmployeeTimesheet).mockResolvedValue(sheet(null))
  setup()
  fill(/Nhân viên/, 'e1')
  await screen.findByText(/chưa xác định được ngày công chuẩn/)
  expect(submit().disabled).toBe(true)
  const now = currentCompanyPeriod()
  fill(/Năm/, String(now.year))
  fill(/Tháng/, String(now.month))
  await screen.findByText(/chưa kết thúc/)
  expect(submit().disabled).toBe(true)
})

it('manual mode keeps the original base-salary flow', async () => {
  vi.mocked(createPayroll).mockResolvedValue({} as never)
  setup()
  fireEvent.click(screen.getByLabelText('Nhập tay'))
  fill(/Nhân viên/, 'e1')
  fill(/Lương cơ bản/, '9000000')
  fireEvent.click(submit())
  await waitFor(() => expect(createPayroll).toHaveBeenCalledTimes(1))
  expect(vi.mocked(createPayroll).mock.calls[0][0]).toMatchObject({ baseSalary: 9000000 })
  expect(getEmployeeTimesheet).not.toHaveBeenCalled()
})

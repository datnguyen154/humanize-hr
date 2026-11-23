import { cleanup, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { getCompanyTimesheet, getEmployeeTimesheet, getMyTimesheet } from '@/features/attendance/api/attendance.api'
import { periodFromSearch, shiftPeriod } from '@/features/attendance/lib/timesheet'
import type { EmployeeTimesheet, TimesheetDay, TimesheetSummary } from '@/features/attendance/types/timesheet.types'
import { CompanyTimesheetPage } from '@/pages/attendance-timesheet/CompanyTimesheetPage'
import { EmployeeTimesheetPage } from '@/pages/attendance-timesheet/EmployeeTimesheetPage'

vi.mock('@/features/attendance/api/attendance.api', () => ({
  getCompanyTimesheet: vi.fn(), getEmployeeTimesheet: vi.fn(), getMyTimesheet: vi.fn(),
}))

const summary: TimesheetSummary = { requiredDays: 22, presentDays: 18, lateDays: 2, paidLeaveDays: 1, unpaidLeaveDays: 1,
  absentDays: 2, upcomingDays: 0, outOfScheduleDays: 1, missingCheckOutDays: 1, noScheduleDays: 0, payableDays: 19 }
const employee = { id: '44444444-4444-4444-8444-444444444444', employeeCode: 'NV001', fullName: 'Trần Minh Anh',
  departmentName: 'Kỹ thuật', status: 'ACTIVE' as const, joinedAt: '2024-01-01' }
const day = (date: string, extra: Partial<TimesheetDay>): TimesheetDay => ({ date, weekday: 2, dayType: 'WORKDAY', status: 'PRESENT',
  isPayable: true, checkInTime: null, checkOutTime: null, missingCheckOut: false, leaveType: null, ...extra })
const detail: EmployeeTimesheet = { period: { year: 2026, month: 12 }, standardDays: 22, isCalendarComplete: true, employee, summary,
  days: [day('2026-12-01', { weekday: 2, checkInTime: '2026-12-01T01:00:00.000Z', checkOutTime: '2026-12-01T10:00:00.000Z' }),
    day('2026-12-02', { weekday: 3, status: 'ABSENT', isPayable: false }),
    day('2026-12-03', { weekday: 4, status: 'LATE', checkInTime: '2026-12-03T01:20:00.000Z', missingCheckOut: true })] }

function renderAt(path: string, element: React.ReactNode, route: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path={route} element={element} />
  </Routes></MemoryRouter></QueryClientProvider>)
}
beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

it('period helpers wrap years and reject invalid URL values', () => {
  expect(shiftPeriod({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
  expect(shiftPeriod({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 })
  expect(periodFromSearch(new URLSearchParams('year=2026&month=3'))).toEqual({ year: 2026, month: 3 })
  expect(periodFromSearch(new URLSearchParams('year=2026&month=13')).month).not.toBe(13)
})

it('company timesheet reads the period from the URL, warns when the calendar is incomplete and links to details', async () => {
  vi.mocked(getCompanyTimesheet).mockResolvedValue({ period: { year: 2026, month: 11 }, standardDays: null, isCalendarComplete: false,
    employees: [{ employee, summary }] })
  renderAt('/admin/attendance/timesheet?year=2026&month=11', <CompanyTimesheetPage />, '/admin/attendance/timesheet')
  await screen.findByText(/chưa xác định được ngày công chuẩn/)
  expect(vi.mocked(getCompanyTimesheet).mock.calls[0][0]).toEqual({ year: 2026, month: 11 })
  const links = screen.getAllByRole('link', { name: /Trần Minh Anh/ })
  expect(links[0].getAttribute('href')).toBe(`/admin/attendance/timesheet/${employee.id}?year=2026&month=11`)
})

it('admin detail never calls the employee-only endpoint and offers no adjustment links', async () => {
  vi.mocked(getEmployeeTimesheet).mockResolvedValue(detail)
  renderAt(`/admin/attendance/timesheet/${employee.id}?year=2026&month=12`, <EmployeeTimesheetPage audience="ADMIN" />, '/admin/attendance/timesheet/:employeeId')
  await screen.findByText('Bảng công · Trần Minh Anh')
  expect(getMyTimesheet).not.toHaveBeenCalled()
  expect(screen.getByText('Ngày cần đối soát (2)')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Gửi yêu cầu điều chỉnh' })).toBeNull()
})

it('employee view shows payable/standard, readable day labels and prefilled adjustment links for days to reconcile', async () => {
  vi.mocked(getMyTimesheet).mockResolvedValue(detail)
  renderAt('/employee/attendance/timesheet?year=2026&month=12', <EmployeeTimesheetPage audience="EMPLOYEE" />, '/employee/attendance/timesheet')
  await screen.findByText('Bảng công của tôi')
  expect(getEmployeeTimesheet).not.toHaveBeenCalled()
  await screen.findByText((_, el) => el?.tagName === 'P' && el.textContent === '19 / 22')
  const calendar = screen.getByRole('list', { name: 'Lịch công tháng' })
  expect(within(calendar).getByText('02/12: Vắng')).toBeTruthy()
  expect(within(calendar).getByText(/03\/12: Đi muộn, vào \d{2}:\d{2}, thiếu giờ ra/)).toBeTruthy()
  const links = screen.getAllByRole('link', { name: 'Gửi yêu cầu điều chỉnh' })
  expect(links.map((l) => l.getAttribute('href'))).toEqual([
    '/employee/attendance/adjustments/new?date=2026-12-02', '/employee/attendance/adjustments/new?date=2026-12-03'])
})

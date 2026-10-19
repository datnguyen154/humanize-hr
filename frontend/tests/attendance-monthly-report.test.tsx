import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AttendanceMonthlyReportPage } from '@/pages/admin/attendance/AttendanceMonthlyReportPage'
import { exportAttendanceMonthlyReport, getAttendanceMonthlyReport } from '@/features/attendance/api/attendance.api'
import type { AttendanceMonthlyReport } from '@/features/attendance/types/attendance-report.types'
import { downloadBlob } from '@/shared/lib/download-blob'
import { showErrorToast } from '@/lib/toast'

vi.mock('@/features/attendance/api/attendance.api', () => ({ getAttendanceMonthlyReport: vi.fn(), exportAttendanceMonthlyReport: vi.fn() }))
vi.mock('@/shared/lib/download-blob', () => ({ downloadBlob: vi.fn() }))
vi.mock('@/lib/toast', () => ({ showErrorToast: vi.fn() }))

const fixture: AttendanceMonthlyReport = {
  period: { year: 2026, month: 2 },
  employees: [{ employeeId: 'a', employeeCode: 'EMP001', fullName: 'Nguyễn Văn An', present: 110, late: 12, totalRecords: 122, missingCheckOut: 4 }],
  totals: { totalEmployees: 1, present: 110, late: 12, totalRecords: 122, missingCheckOut: 4 },
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = render(<QueryClientProvider client={client}><MemoryRouter><AttendanceMonthlyReportPage /></MemoryRouter></QueryClientProvider>)
  return () => { view.unmount(); client.clear() }
}

beforeEach(() => { vi.resetAllMocks() })

describe('Monthly attendance report', () => {
  it('shows loading then full counts, with desktop table and separate mobile cards', async () => {
    let resolve!: (data: AttendanceMonthlyReport) => void
    vi.mocked(getAttendanceMonthlyReport).mockImplementationOnce(() => new Promise((done) => { resolve = done }))
    const cleanup = setup()
    expect(screen.getByLabelText('Đang tải báo cáo chấm công')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Xuất Excel' }) as HTMLButtonElement).disabled).toBe(true)
    await act(async () => resolve(fixture))
    expect(await screen.findAllByText('Nguyễn Văn An')).toHaveLength(2)
    const table = screen.getByRole('table')
    expect(table.parentElement?.parentElement?.className).toContain('hidden')
    expect(screen.getAllByText('122')).toHaveLength(3)
    cleanup()
  })

  it('only requests a new period after applying filters, without list pagination params', async () => {
    vi.mocked(getAttendanceMonthlyReport).mockResolvedValue(fixture)
    const cleanup = setup()
    await screen.findAllByText('EMP001')
    fireEvent.change(screen.getByLabelText('Năm'), { target: { value: '2020' } })
    fireEvent.change(screen.getByLabelText('Tháng'), { target: { value: '12' } })
    expect(getAttendanceMonthlyReport).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo' }))
    await waitFor(() => expect(getAttendanceMonthlyReport).toHaveBeenCalledTimes(2))
    expect(vi.mocked(getAttendanceMonthlyReport).mock.calls[1][0]).toEqual({ year: 2020, month: 12 })
    cleanup()
  })

  it('rejects invalid year locally and never sends that request', async () => {
    vi.mocked(getAttendanceMonthlyReport).mockResolvedValue(fixture)
    const cleanup = setup()
    await screen.findAllByText('EMP001')
    fireEvent.change(screen.getByLabelText('Năm'), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo' }))
    expect(screen.getByRole('alert').textContent).toContain('Vui lòng nhập năm hợp lệ')
    expect(getAttendanceMonthlyReport).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('shows Vietnamese error and recovers after retry', async () => {
    vi.mocked(getAttendanceMonthlyReport).mockRejectedValueOnce(new Error('English backend error')).mockResolvedValueOnce(fixture)
    const cleanup = setup()
    expect(await screen.findByText('Không thể tải báo cáo chấm công tháng')).toBeTruthy()
    expect(screen.queryByText('English backend error')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findAllByText('EMP001')
    expect(getAttendanceMonthlyReport).toHaveBeenCalledTimes(2)
    cleanup()
  })

  it('shows empty month and disables export', async () => {
    vi.mocked(getAttendanceMonthlyReport).mockResolvedValue({ ...fixture, employees: [], totals: { totalEmployees: 0, totalRecords: 0, present: 0, late: 0, missingCheckOut: 0 } })
    const cleanup = setup()
    await screen.findByText('Chưa có dữ liệu chấm công trong tháng này')
    expect((screen.getByRole('button', { name: 'Xuất Excel' }) as HTMLButtonElement).disabled).toBe(true)
    cleanup()
  })

  it('locks export/period controls during export and downloads the applied period', async () => {
    vi.mocked(getAttendanceMonthlyReport).mockResolvedValue(fixture)
    let resolve!: (blob: Blob) => void
    vi.mocked(exportAttendanceMonthlyReport).mockImplementationOnce(() => new Promise((done) => { resolve = done }))
    const cleanup = setup()
    await screen.findAllByText('EMP001')
    const applied = vi.mocked(getAttendanceMonthlyReport).mock.calls[0][0]
    fireEvent.change(screen.getByLabelText('Năm'), { target: { value: '2020' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xuất Excel' }))
    const button = await screen.findByRole('button', { name: 'Đang xuất...' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Năm') as HTMLInputElement).disabled).toBe(true)
    fireEvent.click(button)
    expect(exportAttendanceMonthlyReport).toHaveBeenCalledTimes(1)
    expect(vi.mocked(exportAttendanceMonthlyReport).mock.calls[0][0]).toEqual(applied)
    const blob = new Blob(['xlsx'])
    await act(async () => resolve(blob))
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(blob, `attendance-${applied.year}-${String(applied.month).padStart(2, '0')}.xlsx`))
    cleanup()
  })

  it('export failure keeps report visible and shows a localized toast', async () => {
    vi.mocked(getAttendanceMonthlyReport).mockResolvedValue(fixture)
    vi.mocked(exportAttendanceMonthlyReport).mockRejectedValue(new Error('Export failed'))
    const cleanup = setup()
    await screen.findAllByText('EMP001')
    fireEvent.click(screen.getByRole('button', { name: 'Xuất Excel' }))
    await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith('Không thể xuất báo cáo chấm công. Vui lòng thử lại.', 'Xuất Excel thất bại'))
    expect(screen.getAllByText('Nguyễn Văn An')).toHaveLength(2)
    expect(downloadBlob).not.toHaveBeenCalled()
    cleanup()
  })
})

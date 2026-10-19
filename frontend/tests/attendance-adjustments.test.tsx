import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AttendanceAdjustmentListPage } from '@/pages/attendance-adjustments/AttendanceAdjustmentListPage'
import { AttendanceAdjustmentDetailPage } from '@/pages/attendance-adjustments/AttendanceAdjustmentDetailPage'
import { CreateAttendanceAdjustmentPage } from '@/pages/attendance-adjustments/CreateAttendanceAdjustmentPage'
import { getAttendanceHistory } from '@/features/attendance/api/attendance.api'
import { createAttendanceAdjustment, getAttendanceAdjustmentById, getAttendanceAdjustments, reviewAttendanceAdjustment } from '@/features/attendance/api/attendance-adjustment.api'
import type { AttendanceAdjustment } from '@/features/attendance/types/attendance-adjustment.types'

vi.mock('@/features/attendance/api/attendance.api', () => ({ getAttendanceHistory: vi.fn() }))
vi.mock('@/features/attendance/api/attendance-adjustment.api', () => ({
  createAttendanceAdjustment: vi.fn(), getAttendanceAdjustmentById: vi.fn(),
  getAttendanceAdjustments: vi.fn(), reviewAttendanceAdjustment: vi.fn(),
}))
vi.mock('@/lib/toast', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn() }))
vi.mock('@/shared/components/DatePicker', () => ({
  DatePicker: ({ onChange }: { onChange: (value: string) => void }) =>
    <button type="button" onClick={() => onChange('2026-08-12')}>Chọn ngày kiểm thử</button>,
}))

const fixture: AttendanceAdjustment = {
  id: '11111111-1111-4111-8111-111111111111', employeeId: 'emp-1', attendanceId: null,
  attendanceDate: '2026-08-12T00:00:00.000Z', originalCheckInTime: null,
  originalCheckOutTime: null, originalUpdatedAt: null,
  requestedCheckInTime: '2026-08-12T01:30:00.000Z', requestedCheckOutTime: null,
  reason: 'Quên chấm công', status: 'PENDING', reviewedBy: null, reviewedAt: null,
  reviewNote: null, createdAt: '2026-08-12T03:00:00.000Z', updatedAt: '2026-08-12T03:00:00.000Z',
  employee: { id: 'emp-1', employeeCode: 'EMP001', fullName: 'Nguyễn Văn An' },
  reviewer: null, attendance: null,
}

function setup(element: React.ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/" element={element} /><Route path="/employee/attendance/adjustments/new" element={element} />
      <Route path="/employee/attendance/adjustments" element={<p>Danh sách nhân viên</p>} />
      <Route path="/admin/attendance/adjustments/:id" element={element} /></Routes>
  </MemoryRouter></QueryClientProvider>)
  return () => { view.unmount(); client.clear() }
}

beforeEach(() => vi.resetAllMocks())

describe('Attendance adjustment flow', () => {
  it('opens admin details in a dialog, approves and refreshes the list without navigation', async () => {
    const response = { data: [fixture], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false } }
    vi.mocked(getAttendanceAdjustments).mockResolvedValue(response)
    vi.mocked(getAttendanceAdjustmentById).mockResolvedValue(fixture)
    const approved: AttendanceAdjustment = { ...fixture, status: 'APPROVED', reviewedAt: '2026-08-13T03:00:00.000Z', reviewer: { id: 'admin', fullName: 'Quản trị viên' } }
    vi.mocked(reviewAttendanceAdjustment).mockResolvedValue(approved)
    const cleanup = setup(<AttendanceAdjustmentListPage audience="ADMIN" />)
    expect(screen.getByRole('link', { name: 'Quay lại danh sách chấm công' }).getAttribute('href')).toBe('/admin/attendance')
    fireEvent.click(await screen.findByRole('button', { name: /Nguyễn Văn An/ }))
    const dialog = await screen.findByRole('dialog')
    await within(dialog).findByText('Quên chấm công')
    expect(screen.getByText('Danh sách yêu cầu')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Duyệt yêu cầu' }))
    expect(reviewAttendanceAdjustment).not.toHaveBeenCalled()
    vi.mocked(getAttendanceAdjustmentById).mockResolvedValue(approved)
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Duyệt' }))
    await waitFor(() => expect(reviewAttendanceAdjustment).toHaveBeenCalledWith(fixture.id, { status: 'APPROVED', reviewNote: null }))
    await within(dialog).findByText('Người duyệt: Quản trị viên')
    expect(within(dialog).queryByRole('button', { name: 'Duyệt yêu cầu' })).toBeNull()
    await waitFor(() => expect(getAttendanceAdjustments).toHaveBeenCalledTimes(2))
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Đóng' })[0])
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    cleanup()
  })

  it('keeps the dialog open after a review failure and resets the note on reopening', async () => {
    vi.mocked(getAttendanceAdjustments).mockResolvedValue({ data: [fixture], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
    vi.mocked(getAttendanceAdjustmentById).mockResolvedValue(fixture)
    vi.mocked(reviewAttendanceAdjustment).mockRejectedValue(new Error('server error'))
    const cleanup = setup(<AttendanceAdjustmentListPage audience="ADMIN" />)
    fireEvent.click(await screen.findByRole('button', { name: /Nguyễn Văn An/ }))
    const dialog = await screen.findByRole('dialog')
    const note = await within(dialog).findByLabelText('Ghi chú duyệt (bắt buộc khi từ chối)')
    fireEvent.change(note, { target: { value: 'Không đủ chứng từ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Từ chối' }))
    await within(dialog).findByText('Không thể xử lý yêu cầu điều chỉnh.')
    expect((note as HTMLTextAreaElement).value).toBe('Không đủ chứng từ')
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Đóng' })[0])
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: /Nguyễn Văn An/ }))
    expect((await screen.findByLabelText('Ghi chú duyệt (bắt buộc khi từ chối)') as HTMLTextAreaElement).value).toBe('')
    cleanup()
  })

  it('lists employee requests without sending an employeeId filter', async () => {
    vi.mocked(getAttendanceAdjustments).mockResolvedValue({ data: [fixture], meta: {
      page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false,
    } })
    const cleanup = setup(<AttendanceAdjustmentListPage audience="EMPLOYEE" />)
    await screen.findByText('Ngày 12/8/2026')
    expect(vi.mocked(getAttendanceAdjustments).mock.calls[0][0]).toEqual({ page: 1, limit: 10, status: undefined, search: undefined })
    expect(screen.getByRole('link', { name: 'Quay lại lịch sử chấm công' }).getAttribute('href')).toBe('/employee/attendance')
    expect(screen.getByRole('button', { name: 'Gửi yêu cầu' }).getAttribute('aria-haspopup')).toBe('dialog')
    cleanup()
  })

  it('shows employee details in a read-only dialog without admin approval actions', async () => {
    vi.mocked(getAttendanceAdjustments).mockResolvedValue({ data: [fixture], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
    vi.mocked(getAttendanceAdjustmentById).mockResolvedValue(fixture)
    const cleanup = setup(<AttendanceAdjustmentListPage audience="EMPLOYEE" />)
    fireEvent.click(await screen.findByRole('button', { name: /Ngày 12\/8\/2026/ }))
    const dialog = await screen.findByRole('dialog')
    await within(dialog).findByText('Quên chấm công')
    expect(within(dialog).queryByRole('button', { name: 'Duyệt yêu cầu' })).toBeNull()
    expect(within(dialog).queryByRole('button', { name: 'Từ chối' })).toBeNull()
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Đóng' })[0])
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByText('Danh sách yêu cầu')).toBeTruthy()
    expect(reviewAttendanceAdjustment).not.toHaveBeenCalled()
    cleanup()
  })

  it('submits through the employee create dialog and refreshes the list without navigation', async () => {
    vi.mocked(getAttendanceAdjustments).mockResolvedValue({ data: [], meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } })
    vi.mocked(getAttendanceHistory).mockResolvedValue({ data: [], meta: { page: 1, limit: 1, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } })
    vi.mocked(createAttendanceAdjustment).mockResolvedValue(fixture)
    const cleanup = setup(<AttendanceAdjustmentListPage audience="EMPLOYEE" />)
    await screen.findByText('Chưa có yêu cầu nào')
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Chọn ngày kiểm thử' }))
    await within(dialog).findByText('Ngày này chưa có bản ghi chấm công.')
    fireEvent.change(within(dialog).getByLabelText('Giờ vào đề xuất'), { target: { value: '08:30' } })
    fireEvent.change(within(dialog).getByLabelText('Lý do điều chỉnh'), { target: { value: 'Quên chấm công' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi yêu cầu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(vi.mocked(createAttendanceAdjustment).mock.calls[0][0]).toEqual({ attendanceDate: '2026-08-12', checkInTime: '2026-08-12T01:30:00.000Z', checkOutTime: null, reason: 'Quên chấm công' })
    await waitFor(() => expect(getAttendanceAdjustments).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Danh sách yêu cầu')).toBeTruthy()
    cleanup()
  })

  it('keeps create form values after failure and clears them after cancelling and reopening', async () => {
    vi.mocked(getAttendanceAdjustments).mockResolvedValue({ data: [], meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } })
    vi.mocked(getAttendanceHistory).mockResolvedValue({ data: [], meta: { page: 1, limit: 1, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } })
    vi.mocked(createAttendanceAdjustment).mockRejectedValue(new Error('server error'))
    const cleanup = setup(<AttendanceAdjustmentListPage audience="EMPLOYEE" />)
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Chọn ngày kiểm thử' }))
    await within(dialog).findByText('Ngày này chưa có bản ghi chấm công.')
    fireEvent.change(within(dialog).getByLabelText('Giờ vào đề xuất'), { target: { value: '08:30' } })
    fireEvent.change(within(dialog).getByLabelText('Lý do điều chỉnh'), { target: { value: 'Lý do cần giữ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi yêu cầu' }))
    await within(dialog).findByText('Không thể gửi yêu cầu điều chỉnh.')
    expect((within(dialog).getByLabelText('Lý do điều chỉnh') as HTMLTextAreaElement).value).toBe('Lý do cần giữ')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    expect((await screen.findByLabelText('Lý do điều chỉnh') as HTMLTextAreaElement).value).toBe('')
    cleanup()
  })

  it('creates a missing-day request with company-local time converted to ISO', async () => {
    vi.mocked(getAttendanceHistory).mockResolvedValue({ data: [], meta: { page: 1, limit: 1, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } })
    vi.mocked(createAttendanceAdjustment).mockResolvedValue(fixture)
    const cleanup = setup(<CreateAttendanceAdjustmentPage />, '/employee/attendance/adjustments/new')
    fireEvent.click(screen.getByRole('button', { name: 'Chọn ngày kiểm thử' }))
    await screen.findByText('Ngày này chưa có bản ghi chấm công.')
    fireEvent.change(screen.getByLabelText('Giờ vào đề xuất'), { target: { value: '08:30' } })
    fireEvent.change(screen.getByLabelText('Lý do điều chỉnh'), { target: { value: 'Quên chấm công' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    await waitFor(() => expect(vi.mocked(createAttendanceAdjustment).mock.calls[0]?.[0]).toEqual({
      attendanceDate: '2026-08-12', checkInTime: '2026-08-12T01:30:00.000Z',
      checkOutTime: null, reason: 'Quên chấm công',
    }))
    await screen.findByText('Danh sách nhân viên')
    cleanup()
  })

  it('requires a note to reject a pending request', async () => {
    vi.mocked(getAttendanceAdjustmentById).mockResolvedValue(fixture)
    const cleanup = setup(<AttendanceAdjustmentDetailPage audience="ADMIN" />, `/admin/attendance/adjustments/${fixture.id}`)
    await screen.findByText('Quên chấm công')
    expect((screen.getByRole('button', { name: 'Từ chối' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Ghi chú duyệt (bắt buộc khi từ chối)'), { target: { value: 'Không đủ chứng từ' } })
    expect((screen.getByRole('button', { name: 'Từ chối' }) as HTMLButtonElement).disabled).toBe(false)
    expect(reviewAttendanceAdjustment).not.toHaveBeenCalled()
    cleanup()
  })
})

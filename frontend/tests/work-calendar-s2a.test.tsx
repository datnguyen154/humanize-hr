import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'

import { WorkScheduleSettingsPage } from '@/pages/admin/attendance/WorkScheduleSettingsPage'
import {
  getWorkScheduleVersionById,
  getWorkScheduleVersions,
} from '@/features/work-schedule/api/work-schedule.api'
import {
  createCalendarException,
  deleteCalendarException,
  getCalendarExceptions,
  getCalendarExceptionById,
  getCalendarPreview,
  getHolidayPresets,
  updateCalendarException,
} from '@/features/work-schedule/api/calendar-exception.api'
import {
  type CalendarExceptionDto,
  type CalendarExceptionListResponse,
  type CalendarPreviewDto,
  type CalendarPreviewDay,
  type WorkScheduleDto,
  type WorkScheduleListResponse,
} from '@/features/work-schedule'

vi.mock('@/features/work-schedule/api/work-schedule.api', () => ({
  getWorkScheduleVersions: vi.fn(),
  getWorkScheduleVersionById: vi.fn(),
  createWorkScheduleVersion: vi.fn(),
  updateWorkScheduleVersion: vi.fn(),
}))

vi.mock('@/features/work-schedule/api/calendar-exception.api', () => ({
  getCalendarExceptions: vi.fn(),
  getCalendarExceptionById: vi.fn(),
  createCalendarException: vi.fn(),
  updateCalendarException: vi.fn(),
  deleteCalendarException: vi.fn(),
  getCalendarPreview: vi.fn(),
  getHolidayPresets: vi.fn(),
  previewHolidayBatch: vi.fn(),
  commitHolidayBatch: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  showInfoToast: vi.fn(),
}))

vi.mock('@/shared/components/DatePicker', () => ({
  DatePicker: ({
    id,
    value,
    onChange,
    placeholder,
    disabled,
  }: {
    id?: string
    value?: string
    onChange: (val: string) => void
    placeholder?: string
    disabled?: boolean
  }) => (
    <input
      id={id}
      data-testid={id ? `date-picker-${id}` : 'mock-date-picker'}
      placeholder={placeholder}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

const fixtureSchedule: WorkScheduleDto = {
  id: '11111111-1111-4111-8111-111111111111',
  version: 1,
  revision: 3,
  status: 'DRAFT',
  effectiveFrom: '2026-11-01',
  timezone: 'Asia/Ho_Chi_Minh',
  weekdays: [1, 2, 3, 4, 5],
  startTime: '08:00',
  endTime: '17:00',
  breaks: [{ startTime: '12:00', endTime: '13:00' }],
  createdBy: 'user-admin-1',
  updatedBy: 'user-admin-1',
  createdAt: '2026-10-19T00:00:00.000Z',
  updatedAt: '2026-10-19T00:00:00.000Z',
}

const fixtureHolidayException: CalendarExceptionDto = {
  id: '22222222-2222-4222-8222-222222222221',
  scheduleVersionId: fixtureSchedule.id,
  firstAffectedDate: '2026-11-20',
  payload: {
    kind: 'HOLIDAY',
    date: '2026-11-20',
    name: 'Ngày Nhà giáo Việt Nam',
    sourceReference: 'Quyết định 123/QĐ-BGD',
    reason: 'Nghỉ lễ tri ân các thầy cô',
  },
  createdBy: 'user-admin-1',
  updatedBy: 'user-admin-1',
  createdAt: '2026-10-20T00:00:00.000Z',
  updatedAt: '2026-10-20T00:00:00.000Z',
}

const fixtureSwapException: CalendarExceptionDto = {
  id: '22222222-2222-4222-8222-222222222222',
  scheduleVersionId: fixtureSchedule.id,
  firstAffectedDate: '2026-11-27',
  payload: {
    kind: 'SWAP',
    offDate: '2026-11-27',
    workDate: '2026-11-28',
    reason: 'Hoán đổi ngày Thứ 6 nghỉ và đi làm bù vào Thứ 7',
  },
  createdBy: 'user-admin-1',
  updatedBy: 'user-admin-1',
  createdAt: '2026-10-20T00:00:00.000Z',
  updatedAt: '2026-10-20T00:00:00.000Z',
}

function fixtureDays(year = 2026, month = 11): CalendarPreviewDay[] {
  const prefix = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
  return Array.from({ length: 31 }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`)
    .filter((date) => new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date)
    .map((date) => {
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay() || 7
      const special = date === '2026-11-20' ? 'HOLIDAY' : date === '2026-11-27' ? 'SWAPPED_OFF' : date === '2026-11-28' ? 'SWAPPED_WORKDAY' : null
      const working = special === 'SWAPPED_WORKDAY' || (!special && weekday <= 5)
      return { date, weekday, dayType: special ?? (working ? 'WORKDAY' : 'WEEKLY_OFF'), isBaseWeeklyOff: weekday >= 6,
        isWorkingDay: Boolean(working), shift: working ? { startTime: '08:00', endTime: '17:00', breaks: [{ startTime: '12:00', endTime: '13:00' }] } : null,
        requiredWorkingMinutes: working ? 480 : 0, scheduleVersionId: fixtureSchedule.id, exceptionIds: [] }
    })
}

const fixturePreviewComplete: CalendarPreviewDto = {
  mode: 'DRAFT_PROJECTION',
  versionId: fixtureSchedule.id,
  scheduleRevision: fixtureSchedule.revision,
  effectiveFrom: fixtureSchedule.effectiveFrom,
  timezone: 'Asia/Ho_Chi_Minh',
  year: 2026,
  month: 11,
  sourceFingerprint: 'mock-fingerprint-1',
  summary: {
    totalDays: 30,
    resolvedDays: 30,
    missingScheduleDays: 0,
    unresolvedDays: 0,
    isComplete: true,
    requiredWorkingDays: 20,
    requiredWorkingMinutes: 9600,
    partialRequiredWorkingDays: 20,
    partialRequiredWorkingMinutes: 9600,
  },
  days: fixtureDays(),
  validation: {
    hasBlockingIssues: false,
    issues: [],
  },
}

const fixturePreviewIncompleteWithBlocker: CalendarPreviewDto = {
  mode: 'DRAFT_PROJECTION',
  versionId: fixtureSchedule.id,
  scheduleRevision: fixtureSchedule.revision,
  effectiveFrom: fixtureSchedule.effectiveFrom,
  timezone: 'Asia/Ho_Chi_Minh',
  year: 2026,
  month: 11,
  sourceFingerprint: 'mock-fingerprint-2',
  summary: {
    totalDays: 30,
    resolvedDays: 29,
    missingScheduleDays: 0,
    unresolvedDays: 1,
    isComplete: false,
    requiredWorkingDays: null,
    requiredWorkingMinutes: null,
    partialRequiredWorkingDays: 19,
    partialRequiredWorkingMinutes: 9120,
  },
  days: fixtureDays().map((day) => day.date === '2026-11-15'
    ? { ...day, dayType: 'HOLIDAY', isWorkingDay: false, shift: null, requiredWorkingMinutes: 0 }
    : day.date === '2026-11-16' ? { ...day, dayType: 'UNRESOLVED', isWorkingDay: null, shift: null, requiredWorkingMinutes: null } : day),
  validation: {
    hasBlockingIssues: true,
    issues: [
      {
        code: 'COMPENSATORY_OFF_REQUIRED',
        severity: 'BLOCKER',
        scope: 'DRAFT',
        message: 'Ngày lễ 2026-11-15 trùng ngày nghỉ tuần nhưng chưa bố trí nghỉ bù.',
        date: '2026-11-15',
        exceptionIds: [],
      },
    ],
  },
}

function setup(element: React.ReactNode, path = '/admin/attendance/settings?tab=calendar') {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/attendance/settings" element={element} />
          <Route path="/admin/attendance" element={<p>Trang chấm công</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return Object.assign(() => {
    view.unmount()
    client.clear()
  }, { client })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-01T00:00:00Z'))
  vi.mocked(getWorkScheduleVersionById).mockResolvedValue(fixtureSchedule)
  vi.mocked(getCalendarExceptionById).mockImplementation(async (_version, id) => ({
    exception: id === fixtureSwapException.id ? fixtureSwapException : fixtureHolidayException,
    scheduleRevision: 3,
  }))
})
afterEach(() => vi.useRealTimers())

describe('Work Calendar S2A — Exceptions & Monthly Preview', () => {
  it('opens the first batch editor from a fresh parent snapshot instead of the list revision', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({ data: [fixtureSchedule], meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
    vi.mocked(getCalendarExceptions).mockResolvedValue({ data: [], scheduleRevision: 3, meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewComplete)
    vi.mocked(getWorkScheduleVersionById).mockResolvedValue({ ...fixtureSchedule, revision: 9, effectiveFrom: '2027-01-01' })
    vi.mocked(getHolidayPresets).mockResolvedValue({ catalogVersion: 'test', year: 2027, timezone: 'Asia/Ho_Chi_Minh', requiresConfirmation: true, presets: [], unavailable: [], notice: 'Chưa có dữ liệu' })
    const dispose = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings?tab=calendar')
    const batchButton = await screen.findByRole('button', { name: 'Thiết lập kỳ nghỉ nhiều ngày' })
    await waitFor(() => expect((batchButton as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(batchButton)
    await waitFor(() => expect((screen.getByLabelText('Năm lịch:') as HTMLInputElement).value).toBe('2027'))
    expect(getWorkScheduleVersionById).toHaveBeenCalledWith(fixtureSchedule.id)
    expect(getCalendarExceptionById).not.toHaveBeenCalled()
    dispose()
  })

  it('switches between Schedules and Calendar tabs using query parameter', async () => {
    const mockedSchedules: WorkScheduleListResponse = {
      data: [fixtureSchedule],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }
    vi.mocked(getWorkScheduleVersions).mockResolvedValue(mockedSchedules)

    const mockedExceptions: CalendarExceptionListResponse = {
      data: [fixtureHolidayException],
      scheduleRevision: fixtureSchedule.revision,
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }
    vi.mocked(getCalendarExceptions).mockResolvedValue(mockedExceptions)
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewComplete)

    const cleanup = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings')

    // Initial render defaults to 'schedules'
    await waitFor(() => {
      expect(screen.getByText('Bản nháp lịch làm việc (DRAFT)')).toBeTruthy()
      expect(screen.getByRole('button', { name: /Tạo bản nháp mới/i })).toBeTruthy()
    })

    // Click Calendar tab
    const calendarTab = screen.getByRole('tab', { name: /Lịch ngoại lệ & Xem trước tháng/i })
    fireEvent.click(calendarTab)

    // Calendar tab content should render
    await waitFor(() => {
      expect(screen.getByText(/Bản nháp lịch:/i)).toBeTruthy()
      expect((screen.getByRole('button', { name: /Thêm ngoại lệ/i }) as HTMLButtonElement).disabled).toBe(false)
      expect(screen.getAllByText('Ngày Nhà giáo Việt Nam').length).toBeGreaterThan(0)
    })

    cleanup()
  })

  it('renders complete monthly preview and calendar grid cells', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureSchedule],
      meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarExceptions).mockResolvedValue({
      data: [fixtureHolidayException, fixtureSwapException],
      scheduleRevision: 3,
      meta: { page: 1, limit: 10, totalItems: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewComplete)

    const cleanup = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings?tab=calendar')

    await waitFor(() => {
      // Summary cards
      expect(screen.getAllByText('20').some((element) => element.textContent?.includes('ngày'))).toBe(true)
      expect(screen.getByText('160h')).toBeTruthy() // working hours (10080 min = 168h)
      expect(screen.getByText(/Tháng 11\/2026 đã xác định đầy đủ/i)).toBeTruthy()

      // Exceptions list table & mobile cards
      expect(screen.getAllByText('Ngày Nhà giáo Việt Nam').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Nghỉ: 27\/11\/2026/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Làm: 28\/11\/2026/).length).toBeGreaterThan(0)
    })

    cleanup()
  })

  it('renders incomplete monthly preview with warning badge and BLOCKER issue alert', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureSchedule],
      meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarExceptions).mockResolvedValue({
      data: [],
      scheduleRevision: 3,
      meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewIncompleteWithBlocker)

    const cleanup = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings?tab=calendar')

    await waitFor(() => {
      // Must NOT display 0 for incomplete requiredWorkingDays/Minutes
      expect(screen.getAllByText('Tạm tính').length).toBeGreaterThan(0)
      expect(screen.getAllByText('19').some((element) => element.textContent?.includes('ngày'))).toBe(true)

      // BLOCKER alert
      expect(
        screen.getByText(/Có vấn đề cần xử lý trên bản nháp/i),
      ).toBeTruthy()
      expect(
        screen.getByText(/Ngày lễ 2026-11-15 trùng ngày nghỉ tuần nhưng chưa bố trí nghỉ bù/i),
      ).toBeTruthy()
    })

    cleanup()
  })

  it('filters exceptions by kind', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureSchedule],
      meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarExceptions).mockResolvedValue({
      data: [fixtureHolidayException],
      scheduleRevision: 3,
      meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewComplete)

    const cleanup = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings?tab=calendar')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tất cả' })).toBeTruthy()
    })

    // Click filter button for Ngày lễ (HOLIDAY)
    const holidayFilterBtn = screen.getByRole('button', { name: 'Ngày lễ' })
    fireEvent.click(holidayFilterBtn)

    await waitFor(() => {
      expect(getCalendarExceptions).toHaveBeenCalledWith(
        fixtureSchedule.id,
        expect.objectContaining({ kind: 'HOLIDAY', page: 1 }),
        expect.anything(),
      )
    })

    cleanup()
  })

  it('submits a new SWAP exception using a single form with both dates', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureSchedule],
      meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarExceptions).mockResolvedValue({
      data: [],
      scheduleRevision: 3,
      meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewComplete)
    vi.mocked(createCalendarException).mockResolvedValue({
      exception: fixtureSwapException,
      scheduleRevision: 4,
    })

    const cleanup = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings?tab=calendar')

    await waitFor(() => {
      expect((screen.getByRole('button', { name: /Thêm ngoại lệ/i }) as HTMLButtonElement).disabled).toBe(false)
    })

    // Open create dialog
    fireEvent.click(screen.getByRole('button', { name: /Thêm ngoại lệ/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByText('Thêm ngoại lệ lịch làm việc')).toBeTruthy()
    })

    // Select SWAP kind card button
    fireEvent.click(screen.getByRole('button', { name: /Hoán đổi ngày làm/i }))

    // Fill swap dates and reason
    const offDateInput = screen.getByTestId('date-picker-swap-offDate')
    const workDateInput = screen.getByTestId('date-picker-swap-workDate')
    const reasonInput = screen.getByPlaceholderText(/Nhập lý do chi tiết để phục vụ đối soát/i)

    fireEvent.change(offDateInput, { target: { value: '2026-11-27' } })
    fireEvent.change(workDateInput, { target: { value: '2026-11-28' } })
    fireEvent.change(reasonInput, { target: { value: 'Hoán đổi ngày làm bù sang Thứ 7' } })

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Thêm ngoại lệ' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(createCalendarException).toHaveBeenCalledWith(
        fixtureSchedule.id,
        {
          expectedRevision: 3,
          exception: {
            kind: 'SWAP',
            offDate: '2026-11-27',
            workDate: '2026-11-28',
            reason: 'Hoán đổi ngày làm bù sang Thứ 7',
          },
        },
      )
    })

    cleanup()
  })

  it('validates SWAP dates cannot be identical', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureSchedule],
      meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarExceptions).mockResolvedValue({
      data: [],
      scheduleRevision: 3,
      meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewComplete)

    const cleanup = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings?tab=calendar')

    await waitFor(() => {
      expect((screen.getByRole('button', { name: /Thêm ngoại lệ/i }) as HTMLButtonElement).disabled).toBe(false)
    })

    fireEvent.click(screen.getByRole('button', { name: /Thêm ngoại lệ/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /Hoán đổi ngày làm/i }))

    const offDateInput = screen.getByTestId('date-picker-swap-offDate')
    const workDateInput = screen.getByTestId('date-picker-swap-workDate')
    const reasonInput = screen.getByPlaceholderText(/Nhập lý do chi tiết để phục vụ đối soát/i)

    // Identical dates
    fireEvent.change(offDateInput, { target: { value: '2026-11-27' } })
    fireEvent.change(workDateInput, { target: { value: '2026-11-27' } })
    fireEvent.change(reasonInput, { target: { value: 'Thử trùng ngày' } })

    fireEvent.click(screen.getByRole('button', { name: 'Thêm ngoại lệ' }))

    await waitFor(() => {
      expect(
        screen.getByText('Ngày nghỉ hoán đổi và ngày làm bù không được trùng nhau.'),
      ).toBeTruthy()
      expect(createCalendarException).not.toHaveBeenCalled()
    })

    cleanup()
  })

  it('deletes an exception with required audit reason and expectedRevision', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureSchedule],
      meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarExceptions).mockResolvedValue({
      data: [fixtureHolidayException],
      scheduleRevision: 3,
      meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewComplete)
    vi.mocked(deleteCalendarException).mockResolvedValue({
      removedExceptionId: fixtureHolidayException.id,
      scheduleRevision: 4,
    })

    const cleanup = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings?tab=calendar')

    await waitFor(() => {
      expect(screen.getAllByText('Ngày Nhà giáo Việt Nam').length).toBeGreaterThan(0)
    })

    // Click delete button on the row
    const deleteButtons = screen.getAllByRole('button', { name: /Xóa/i })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Xóa ngoại lệ lịch làm việc')).toBeTruthy()
    })

    const reasonInput = screen.getByLabelText(/Lý do xóa ngoại lệ/i)
    fireEvent.change(reasonInput, { target: { value: 'Hủy kế hoạch nghỉ lễ này' } })

    const confirmDeleteBtn = screen.getByRole('button', { name: /Xác nhận xóa/i })
    fireEvent.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(deleteCalendarException).toHaveBeenCalledWith(
        fixtureSchedule.id,
        fixtureHolidayException.id,
        {
          expectedRevision: 3,
          reason: 'Hủy kế hoạch nghỉ lễ này',
        },
      )
    })

    cleanup()
  })

  it('handles 409 revision conflict and reloads only after explicit discard confirmation', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureSchedule],
      meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarExceptions).mockResolvedValue({
      data: [fixtureHolidayException],
      scheduleRevision: 3,
      meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewComplete)

    // Simulate 409 Conflict from server
    const conflictError = new AxiosError('Conflict')
    conflictError.response = {
      status: 409,
      data: {
        code: 'WORK_SCHEDULE_REVISION_CONFLICT',
        message: 'Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu.',
      },
    } as AxiosResponse
    vi.mocked(updateCalendarException).mockRejectedValue(conflictError)

    const cleanup = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings?tab=calendar')

    await waitFor(() => {
      expect(screen.getAllByText('Ngày Nhà giáo Việt Nam').length).toBeGreaterThan(0)
    })

    // Click Edit on holiday
    const editButtons = screen.getAllByRole('button', { name: /Sửa/i })
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Chỉnh sửa ngoại lệ/i)).toBeTruthy()
    })

    // Change reason
    const reasonInput = screen.getByPlaceholderText(/Nhập lý do chi tiết để phục vụ đối soát/i)
    fireEvent.change(reasonInput, { target: { value: 'Lý do mới đang sửa dở dang' } })

    // Submit
    const saveBtn = screen.getByRole('button', { name: 'Lưu thay đổi' })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText(/Xung đột phiên bản/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /Tải lại dữ liệu mới nhất/i })).toBeTruthy()
      // Form values are preserved!
      expect((reasonInput as HTMLTextAreaElement).value).toBe('Lý do mới đang sửa dở dang')
    })

    // Mock fresh schedule fetch with revision 4
    const freshSchedule: WorkScheduleDto = {
      ...fixtureSchedule,
      revision: 4,
    }
    vi.mocked(getWorkScheduleVersionById).mockResolvedValue(freshSchedule)
    vi.mocked(getCalendarExceptionById).mockResolvedValue({ exception: fixtureHolidayException, scheduleRevision: 4 })

    // Click reload button
    const reloadBtn = screen.getByRole('button', { name: /Tải lại dữ liệu mới nhất/i })
    await act(async () => {
      fireEvent.click(reloadBtn)
    })
    expect((reasonInput as HTMLTextAreaElement).value).toBe('Lý do mới đang sửa dở dang')
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ thay đổi và tiếp tục' }))

    await waitFor(() => {
      expect(getWorkScheduleVersionById).toHaveBeenCalledWith(fixtureSchedule.id)
      // Explicit discard replaces values and revision from the same snapshot.
      expect(screen.queryByText(/Xung đột phiên bản/i)).toBeNull()
      expect((screen.getByPlaceholderText(/Nhập lý do chi tiết để phục vụ đối soát/i) as HTMLTextAreaElement).value).toBe(fixtureHolidayException.payload.reason)
    })

    cleanup()
  })

  it('restores focus to trigger button when dialogs close', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureSchedule],
      meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarExceptions).mockResolvedValue({
      data: [fixtureHolidayException],
      scheduleRevision: 3,
      meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })
    vi.mocked(getCalendarPreview).mockResolvedValue(fixturePreviewComplete)

    const cleanup = setup(<WorkScheduleSettingsPage />, '/admin/attendance/settings?tab=calendar')

    await waitFor(() => {
      expect((screen.getByRole('button', { name: /Thêm ngoại lệ/i }) as HTMLButtonElement).disabled).toBe(false)
    })

    const createBtn = screen.getByRole('button', { name: /Thêm ngoại lệ/i })
    createBtn.focus()
    expect(document.activeElement).toBe(createBtn)

    fireEvent.click(createBtn)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })

    // Close dialog using "Hủy" button
    const cancelBtn = screen.getByRole('button', { name: 'Hủy' })
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(createBtn)
    })

    cleanup()
  })
})

function mockCalendarPage(items = [fixtureHolidayException]) {
  vi.mocked(getWorkScheduleVersions).mockResolvedValue({ data: [fixtureSchedule], meta: { page: 1, limit: 100, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
  vi.mocked(getCalendarExceptions).mockResolvedValue({ data: items, scheduleRevision: 3, meta: { page: 1, limit: 10, totalItems: items.length, totalPages: items.length ? 1 : 0, hasNextPage: false, hasPreviousPage: false } })
  vi.mocked(getCalendarPreview).mockImplementation(async (params) => ({ ...fixturePreviewComplete, ...params, days: fixtureDays(params.year, params.month) }))
}

for (const kind of ['HOLIDAY', 'COMPENSATORY_OFF', 'WORK_OVERRIDE'] as const) {
  it(`submits the full ${kind} payload and refetches each active query once`, async () => {
    mockCalendarPage()
    const cleanup = setup(<WorkScheduleSettingsPage />)
    try {
      await screen.findByText('Lịch tháng 11/2026')
      fireEvent.click(screen.getByRole('button', { name: 'Thêm ngoại lệ' }))
      await screen.findByRole('dialog')
      if (kind !== 'HOLIDAY') fireEvent.click(screen.getByRole('button', { name: kind === 'COMPENSATORY_OFF' ? /Nghỉ bù.*Bố trí/ : /Điều chỉnh giờ làm.*Thay đổi/ }))
      const prefix = kind === 'HOLIDAY' ? 'holiday' : kind === 'COMPENSATORY_OFF' ? 'comp' : 'override'
      fireEvent.change(screen.getByTestId(`date-picker-${prefix}-date`), { target: { value: '2026-11-23' } })
      fireEvent.change(screen.getByLabelText(/Lý do \/ Căn cứ ngoại lệ/), { target: { value: 'Lý do kiểm thử' } })
      let payload
      if (kind === 'HOLIDAY') {
        fireEvent.click(screen.getByRole('button', { name: /Nghỉ bổ sung doanh nghiệp/ }))
        fireEvent.click(screen.getByRole('button', { name: 'Có hưởng lương' }))
        fireEvent.change(screen.getByLabelText(/Lý do \/ Căn cứ ngoại lệ/), { target: { value: 'Lý do kiểm thử' } })
        fireEvent.change(screen.getByLabelText(/Tên ngày lễ/), { target: { value: 'Ngày lễ kiểm thử' } })
        fireEvent.change(screen.getByLabelText(/Căn cứ văn bản/), { target: { value: 'Nguồn kiểm thử' } })
        payload = { kind, date: '2026-11-23', name: 'Ngày lễ kiểm thử', sourceReference: 'Nguồn kiểm thử', reason: 'Lý do kiểm thử', holidayPolicy: { category: 'COMPANY' as const, isPaid: true } }
      } else if (kind === 'COMPENSATORY_OFF') {
        fireEvent.change(screen.getByTestId('date-picker-comp-sourceHolidayDate'), { target: { value: '2026-11-22' } })
        payload = { kind, date: '2026-11-23', sourceHolidayDate: '2026-11-22', reason: 'Lý do kiểm thử' }
      } else {
        payload = { kind, date: '2026-11-23', startTime: '08:00', endTime: '17:00', breaks: [{ startTime: '12:00', endTime: '13:00' }] as [{ startTime: string; endTime: string }], reason: 'Lý do kiểm thử' }
      }
      vi.mocked(createCalendarException).mockResolvedValue({ exception: { ...fixtureHolidayException, payload }, scheduleRevision: 4 })
      const listBefore = vi.mocked(getCalendarExceptions).mock.calls.length
      const previewBefore = vi.mocked(getCalendarPreview).mock.calls.length
      const submit = screen.getByRole('button', { name: 'Thêm ngoại lệ' })
      fireEvent.click(submit)
      fireEvent.click(submit)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(createCalendarException).toHaveBeenCalledExactlyOnceWith(fixtureSchedule.id, { expectedRevision: 3, exception: payload })
      expect(getCalendarExceptions).toHaveBeenCalledTimes(listBefore + 1)
      expect(getCalendarPreview).toHaveBeenCalledTimes(previewBefore + 1)
    } finally { cleanup() }
  })
}

it('loads draft options beyond the first page, not just the first fifty drafts', async () => {
  mockCalendarPage()
  const first = Array.from({ length: 100 }, (_, i) => ({ ...fixtureSchedule, id: i === 0 ? fixtureSchedule.id : `draft-${i}`, version: i + 1 }))
  const last = { ...fixtureSchedule, id: 'older-draft', version: 101 }
  vi.mocked(getWorkScheduleVersions).mockImplementation(async (params) => ({
    data: params?.page === 2 ? [last] : first,
    meta: { page: params?.page ?? 1, limit: 100, totalItems: 101, totalPages: 2, hasNextPage: params?.page !== 2, hasPreviousPage: params?.page === 2 },
  }))
  const cleanup = setup(<WorkScheduleSettingsPage />)
  try {
    await screen.findByRole('option', { name: /Bản nháp v101/ })
    expect(getWorkScheduleVersions).toHaveBeenCalledTimes(2)
  } finally { cleanup() }
})

it('rapid Next clicks never skip past the last page, and year navigation stays consistent', async () => {
  mockCalendarPage()
  vi.mocked(getCalendarExceptions).mockImplementation(async (_version, params) => ({
    data: [fixtureHolidayException], scheduleRevision: 3,
    meta: { page: params?.page ?? 1, limit: 10, totalItems: 11, totalPages: 2, hasNextPage: params?.page === 1, hasPreviousPage: params?.page === 2 },
  }))
  const cleanup = setup(<WorkScheduleSettingsPage />)
  try {
    await screen.findByText('Trang 1 / 2')
    const next = screen.getByRole('button', { name: 'Trang sau' })
    await act(async () => { fireEvent.click(next); fireEvent.click(next); fireEvent.click(next) })
    await screen.findByText('Trang 2 / 2')
    expect(vi.mocked(getCalendarExceptions).mock.calls.every(([, params]) => (params?.page ?? 1) <= 2)).toBe(true)
    const month = screen.getByRole('button', { name: 'Tháng sau' })
    await act(async () => { fireEvent.click(month); fireEvent.click(month) })
    await waitFor(() => expect(getCalendarPreview).toHaveBeenLastCalledWith({ versionId: fixtureSchedule.id, year: 2027, month: 1 }, expect.anything()))
  } finally { cleanup() }
})
function conflict() {
  const error = new AxiosError('Conflict')
  error.response = { status: 409, data: { code: 'WORK_SCHEDULE_REVISION_CONFLICT' } } as AxiosResponse
  return error
}
async function openHolidayEdit() {
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Sửa' }).length).toBeGreaterThan(0))
  fireEvent.click(screen.getAllByRole('button', { name: 'Sửa' })[0])
  await screen.findByRole('button', { name: 'Lưu thay đổi' })
  return screen.getByLabelText(/Lý do \/ Căn cứ ngoại lệ/)
}

it('uses detail GET, reports a failed opening request and supports retry without a stale editor', async () => {
  mockCalendarPage()
  vi.mocked(getCalendarExceptionById).mockRejectedValueOnce(new Error('failed GET'))
  const cleanup = setup(<WorkScheduleSettingsPage />)
  try {
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Sửa' }).length).toBeGreaterThan(0))
    fireEvent.click(screen.getAllByRole('button', { name: 'Sửa' })[0])
    await screen.findByText('Không thể tải thông tin ngoại lệ. Vui lòng thử lại.')
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findByRole('button', { name: 'Lưu thay đổi' })
    expect(getCalendarExceptionById).toHaveBeenCalledTimes(2)
  } finally { cleanup() }
})

it('keeps dirty input and revision lock when reload fails or parent/detail revisions differ', async () => {
  mockCalendarPage()
  vi.mocked(updateCalendarException).mockRejectedValue(conflict())
  const cleanup = setup(<WorkScheduleSettingsPage />)
  try {
    const reason = await openHolidayEdit()
    fireEvent.change(reason, { target: { value: 'Nội dung chưa lưu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await screen.findByText(/Xung đột phiên bản/)
    for (const mode of ['network', 'mismatch']) {
      if (mode === 'network') vi.mocked(getWorkScheduleVersionById).mockRejectedValueOnce(new Error('GET failed'))
      else vi.mocked(getWorkScheduleVersionById).mockResolvedValueOnce({ ...fixtureSchedule, revision: 4 })
      fireEvent.click(screen.getByRole('button', { name: 'Tải lại dữ liệu mới nhất' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Bỏ thay đổi và tiếp tục' }))
      await screen.findByText(mode === 'network' ? 'Không thể tải lại dữ liệu bản nháp mới nhất.' : 'Dữ liệu đã thay đổi trong lúc tải lại. Vui lòng thử lại.')
      expect((reason as HTMLTextAreaElement).value).toBe('Nội dung chưa lưu')
      expect((screen.getByRole('button', { name: 'Lưu thay đổi' }) as HTMLButtonElement).disabled).toBe(true)
    }
    expect(updateCalendarException).toHaveBeenCalledTimes(1)
  } finally { cleanup() }
})

it('does not attach a background revision to unsaved fields; reload can safely change exception kind', async () => {
  mockCalendarPage()
  vi.mocked(updateCalendarException).mockRejectedValueOnce(conflict()).mockResolvedValue({ exception: fixtureSwapException, scheduleRevision: 5 })
  const cleanup = setup(<WorkScheduleSettingsPage />)
  try {
    const reason = await openHolidayEdit()
    fireEvent.change(reason, { target: { value: 'Bản sửa giữ revision cũ' } })
    vi.mocked(getCalendarExceptions).mockResolvedValue({ data: [fixtureHolidayException], scheduleRevision: 4, meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
    await act(async () => { await cleanup.client.invalidateQueries({ queryKey: ['calendar-exception'] }) })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await screen.findByText(/Xung đột phiên bản/)
    expect(updateCalendarException).toHaveBeenLastCalledWith(fixtureSchedule.id, fixtureHolidayException.id, expect.objectContaining({ expectedRevision: 3 }))
    vi.mocked(getWorkScheduleVersionById).mockResolvedValue({ ...fixtureSchedule, revision: 4 })
    vi.mocked(getCalendarExceptionById).mockResolvedValue({ exception: { ...fixtureSwapException, id: fixtureHolidayException.id }, scheduleRevision: 4 })
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại dữ liệu mới nhất' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Bỏ thay đổi và tiếp tục' }))
    await screen.findByTestId('date-picker-swap-offDate')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(updateCalendarException).toHaveBeenLastCalledWith(fixtureSchedule.id, fixtureHolidayException.id, { expectedRevision: 4, exception: fixtureSwapException.payload }))
  } finally { cleanup() }
})

it('confirms close/kind changes instead of losing dirty form values', async () => {
  mockCalendarPage()
  const cleanup = setup(<WorkScheduleSettingsPage />)
  try {
    const reason = await openHolidayEdit()
    fireEvent.change(reason, { target: { value: 'Giữ phần nhập dở' } })
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    const warning = await screen.findByRole('alertdialog')
    expect(warning).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Hủy' }).at(-1)!)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect((screen.getByLabelText(/Lý do \/ Căn cứ ngoại lệ/) as HTMLTextAreaElement).value).toBe('Giữ phần nhập dở')
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Bỏ thay đổi và tiếp tục' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(updateCalendarException).not.toHaveBeenCalled()
  } finally { cleanup() }
})

it('delete conflict blocks retry until fresh detail/revision is explicitly reloaded', async () => {
  mockCalendarPage()
  vi.mocked(deleteCalendarException).mockRejectedValueOnce(conflict()).mockResolvedValue({ removedExceptionId: fixtureHolidayException.id, scheduleRevision: 5 })
  const cleanup = setup(<WorkScheduleSettingsPage />)
  try {
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Xóa' }).length).toBeGreaterThan(0))
    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0])
    const reason = await screen.findByLabelText(/Lý do xóa ngoại lệ/)
    fireEvent.change(reason, { target: { value: 'Lý do trước conflict' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa' }))
    await screen.findByText('Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu.')
    expect((screen.getByRole('button', { name: 'Xác nhận xóa' }) as HTMLButtonElement).disabled).toBe(true)
    vi.mocked(getWorkScheduleVersionById).mockResolvedValue({ ...fixtureSchedule, revision: 4 })
    vi.mocked(getCalendarExceptionById).mockResolvedValue({ exception: fixtureHolidayException, scheduleRevision: 4 })
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại dữ liệu mới nhất' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Bỏ thay đổi và tiếp tục' }))
    await waitFor(() => expect((screen.getByLabelText(/Lý do xóa ngoại lệ/) as HTMLTextAreaElement).value).toBe(''))
    fireEvent.change(screen.getByLabelText(/Lý do xóa ngoại lệ/), { target: { value: 'Đã kiểm tra lại dữ liệu mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa' }))
    await waitFor(() => expect(deleteCalendarException).toHaveBeenLastCalledWith(fixtureSchedule.id, fixtureHolidayException.id, { expectedRevision: 4, reason: 'Đã kiểm tra lại dữ liệu mới' }))
  } finally { cleanup() }
})

it('changing version hides previous-version records and changing month hides old preview', async () => {
  mockCalendarPage()
  const other = { ...fixtureSchedule, id: '33333333-3333-4333-8333-333333333333', version: 2 }
  vi.mocked(getWorkScheduleVersions).mockResolvedValue({ data: [fixtureSchedule, other], meta: { page: 1, limit: 100, totalItems: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })
  const cleanup = setup(<WorkScheduleSettingsPage />)
  try {
    await screen.findByText(/Lịch tháng 11\/2026/)
    vi.mocked(getCalendarPreview).mockImplementation(() => new Promise(() => {}))
    fireEvent.click(screen.getByRole('button', { name: 'Tháng sau' }))
    await screen.findByText('Xem trước lịch làm việc tháng 12/2026')
    expect(screen.queryByText('Lịch tháng 11/2026')).toBeNull()
    vi.mocked(getCalendarExceptions).mockImplementation(() => new Promise(() => {}))
    fireEvent.change(screen.getByLabelText('Bản nháp lịch:'), { target: { value: other.id } })
    await waitFor(() => expect(screen.queryByText('Ngày Nhà giáo Việt Nam')).toBeNull())
    expect(screen.queryByRole('button', { name: 'Sửa' })).toBeNull()
  } finally { cleanup() }
})

it('shows a parent-list error with retry rather than treating failure as no drafts', async () => {
  mockCalendarPage()
  vi.mocked(getWorkScheduleVersions).mockRejectedValueOnce(new Error('network'))
  const cleanup = setup(<WorkScheduleSettingsPage />)
  try {
    await screen.findByText('Không thể tải bản nháp lịch làm việc.')
    expect(screen.queryByText('Chưa có bản nháp lịch làm việc')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findByText('Lịch tháng 11/2026')
  } finally { cleanup() }
})

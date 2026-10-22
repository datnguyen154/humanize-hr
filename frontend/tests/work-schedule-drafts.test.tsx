import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'

import { WorkScheduleSettingsPage } from '@/pages/admin/attendance/WorkScheduleSettingsPage'
import {
  createWorkScheduleVersion,
  getWorkScheduleVersionById,
  getWorkScheduleVersions,
  updateWorkScheduleVersion,
} from '@/features/work-schedule/api/work-schedule.api'
import {
  parseWorkScheduleError,
  workScheduleFormSchema,
  type WorkScheduleDto,
  type WorkScheduleListResponse,
} from '@/features/work-schedule'

vi.mock('@/features/work-schedule/api/work-schedule.api', () => ({
  getWorkScheduleVersions: vi.fn(),
  getWorkScheduleVersionById: vi.fn(),
  createWorkScheduleVersion: vi.fn(),
  updateWorkScheduleVersion: vi.fn(),
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
      data-testid="mock-date-picker"
      placeholder={placeholder}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

const fixtureDraft: WorkScheduleDto = {
  id: '11111111-1111-4111-8111-111111111111',
  version: 1,
  revision: 1,
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

function setup(element: React.ReactNode, path = '/admin/attendance/settings') {
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
  return () => {
    view.unmount()
    client.clear()
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Work Schedule Drafts flow (S1)', () => {
  it('renders settings page, lists draft versions and provides back link to attendance', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureDraft],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })

    const cleanup = setup(<WorkScheduleSettingsPage />)

    expect(
      screen.getByRole('link', { name: /Quay lại danh sách chấm công/i }).getAttribute('href'),
    ).toBe('/admin/attendance')

    await screen.findByText('Cài đặt lịch làm việc')
    await screen.findByText('Phiên bản v1')
    expect(screen.getAllByText('01/11/2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Thứ Hai – Thứ Sáu (T2–T6)').length).toBeGreaterThan(0)

    cleanup()
  })

  it('shows empty state when no draft exists and can trigger create dialog', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })

    const cleanup = setup(<WorkScheduleSettingsPage />)

    await screen.findByText('Chưa có bản nháp lịch làm việc')
    const createBtn = screen.getByRole('button', { name: 'Tạo bản nháp ngay' })
    fireEvent.click(createBtn)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Tạo bản nháp lịch làm việc')).toBeTruthy()

    cleanup()
  })

  it('applies demo template, keeps effectiveFrom untouched, validates and submits create draft', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    vi.mocked(createWorkScheduleVersion).mockResolvedValue(fixtureDraft)

    const cleanup = setup(<WorkScheduleSettingsPage />)

    fireEvent.click(await screen.findByRole('button', { name: /Tạo bản nháp mới/i }))
    const dialog = await screen.findByRole('dialog')

    // Click "Dùng mẫu demo"
    const demoBtn = within(dialog).getByRole('button', { name: /Dùng mẫu demo/i })
    fireEvent.click(demoBtn)

    // Form is filled with demo template: 08:00, 17:00, 12:00, 13:00
    expect((within(dialog).getByLabelText(/Giờ vào ca/i) as HTMLInputElement).value).toBe('08:00')
    expect((within(dialog).getByLabelText(/Giờ ra ca/i) as HTMLInputElement).value).toBe('17:00')
    expect((within(dialog).getByLabelText(/Bắt đầu nghỉ/i) as HTMLInputElement).value).toBe('12:00')
    expect((within(dialog).getByLabelText(/Kết thúc nghỉ/i) as HTMLInputElement).value).toBe('13:00')

    // effectiveFrom is still empty
    const datePicker = within(dialog).getByTestId('mock-date-picker')
    expect((datePicker as HTMLInputElement).value).toBe('')

    // Try submit without effectiveFrom -> validation error
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo bản nháp' }))
    await within(dialog).findByText('Vui lòng chọn ngày hiệu lực.')
    expect(createWorkScheduleVersion).not.toHaveBeenCalled()

    // Now fill effectiveFrom
    fireEvent.change(datePicker, { target: { value: '2026-11-01' } })

    // Submit form
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo bản nháp' }))

    await waitFor(() => {
      expect(createWorkScheduleVersion).toHaveBeenCalledWith({
        effectiveFrom: '2026-11-01',
        timezone: 'Asia/Ho_Chi_Minh',
        weekdays: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '17:00',
        breaks: [{ startTime: '12:00', endTime: '13:00' }],
      })
    })

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    cleanup()
  })

  it('opens edit dialog with prefilled data and submits with expectedRevision', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureDraft],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })
    const updatedDraft: WorkScheduleDto = {
      ...fixtureDraft,
      revision: 2,
      endTime: '17:30',
    }
    vi.mocked(updateWorkScheduleVersion).mockResolvedValue(updatedDraft)

    const cleanup = setup(<WorkScheduleSettingsPage />)

    // Click "Sửa" on the row
    const editBtns = await screen.findAllByRole('button', { name: /Sửa|Chỉnh sửa/i })
    fireEvent.click(editBtns[0])

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Chỉnh sửa bản nháp v1/i)).toBeTruthy()

    // Verify prefilled values
    const endTimeInput = within(dialog).getByLabelText(/Giờ ra ca/i) as HTMLInputElement
    expect(endTimeInput.value).toBe('17:00')

    // Change endTime to 17:30
    fireEvent.change(endTimeInput, { target: { value: '17:30' } })

    // Submit
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => {
      expect(updateWorkScheduleVersion).toHaveBeenCalledWith(fixtureDraft.id, {
        expectedRevision: 1,
        effectiveFrom: '2026-11-01',
        timezone: 'Asia/Ho_Chi_Minh',
        weekdays: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '17:30',
        breaks: [{ startTime: '12:00', endTime: '13:00' }],
      })
    })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    cleanup()
  })

  it('handles 409 revision conflict gracefully, shows alert, keeps form open and allows reloading latest', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureDraft],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })

    // Simulate 409 AxiosError
    const axiosConflictError = new AxiosError('Conflict')
    axiosConflictError.response = {
      status: 409,
      data: {
        code: 'WORK_SCHEDULE_REVISION_CONFLICT',
        message: 'Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu.',
      },
    } as AxiosResponse

    vi.mocked(updateWorkScheduleVersion).mockRejectedValue(axiosConflictError)

    const freshDraft: WorkScheduleDto = {
      ...fixtureDraft,
      revision: 2,
      endTime: '18:00',
    }
    vi.mocked(getWorkScheduleVersionById).mockResolvedValue(freshDraft)

    const cleanup = setup(<WorkScheduleSettingsPage />)

    const editBtns = await screen.findAllByRole('button', { name: /Sửa|Chỉnh sửa/i })
    fireEvent.click(editBtns[0])

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    // Shows 409 error message
    await within(dialog).findByText('Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu.')
    expect(within(dialog).getByRole('alert')).toBeTruthy()

    // Does NOT close dialog
    expect(screen.getByRole('dialog')).toBeTruthy()

    // Click "Tải lại dữ liệu mới nhất"
    const reloadBtn = within(dialog).getByRole('button', { name: /Tải lại dữ liệu mới nhất/i })
    fireEvent.click(reloadBtn)

    await waitFor(() => {
      expect(getWorkScheduleVersionById).toHaveBeenCalledWith(fixtureDraft.id)
    })

    // Form is updated with fresh data
    await waitFor(() => {
      expect(
        (within(dialog).getByLabelText(/Giờ ra ca/i) as HTMLInputElement).value,
      ).toBe('18:00')
    })

    cleanup()
  })

  it('opens detail dialog, shows full schedule breakdown, and transitions to edit mode', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureDraft],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })

    const cleanup = setup(<WorkScheduleSettingsPage />)

    const detailBtns = await screen.findAllByRole('button', { name: /Chi tiết/i })
    fireEvent.click(detailBtns[0])

    const detailDialog = await screen.findByRole('dialog')
    within(detailDialog).getByText('Bản nháp lịch làm việc v1')
    within(detailDialog).getByText('08:00 – 17:00')
    within(detailDialog).getByText('12:00 – 13:00')
    within(detailDialog).getByText('Asia/Ho_Chi_Minh')

    // Click "Chỉnh sửa bản nháp" inside detail dialog
    fireEvent.click(within(detailDialog).getByRole('button', { name: /Chỉnh sửa bản nháp/i }))

    // Switches to Form dialog in edit mode
    await waitFor(() => {
      expect(screen.getByText(/Chỉnh sửa bản nháp v1/i)).toBeTruthy()
    })

    cleanup()
  })

  it('F01 & F03: locks inputs during reload, catches reload errors with Vietnamese message, preserves user input, and retries successfully', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureDraft],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })

    const axiosConflict = new AxiosError('Conflict')
    axiosConflict.response = {
      status: 409,
      data: {
        code: 'WORK_SCHEDULE_REVISION_CONFLICT',
        message: 'Bản nháp đã được cập nhật bởi quản trị viên khác.',
      },
    } as AxiosResponse
    vi.mocked(updateWorkScheduleVersion).mockRejectedValue(axiosConflict)

    const cleanup = setup(<WorkScheduleSettingsPage />)

    const editBtns = await screen.findAllByRole('button', { name: /Sửa|Chỉnh sửa/i })
    fireEvent.click(editBtns[0])

    const dialog = await screen.findByRole('dialog')

    // User types new end time 18:30
    const endTimeInput = within(dialog).getByLabelText(/Giờ ra ca/i) as HTMLInputElement
    fireEvent.change(endTimeInput, { target: { value: '18:30' } })

    // Submit -> triggers 409
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))
    await within(dialog).findByText('Bản nháp đã được cập nhật bởi quản trị viên khác.')

    // Editing the date/demo does not make a stale revision current again.
    fireEvent.click(within(dialog).getByRole('button', { name: /Dùng mẫu demo/i }))
    fireEvent.change(within(dialog).getByTestId('mock-date-picker'), {
      target: { value: '2026-11-02' },
    })
    fireEvent.change(endTimeInput, { target: { value: '18:30' } })
    expect(within(dialog).getByRole('button', { name: /Tải lại dữ liệu mới nhất/i })).toBeTruthy()

    // 1st reload attempt fails (Network Error)
    let rejectReload: ((err: unknown) => void) | null = null
    vi.mocked(getWorkScheduleVersionById).mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectReload = reject
        }),
    )

    const reloadBtn = within(dialog).getByRole('button', { name: /Tải lại dữ liệu mới nhất/i })
    fireEvent.click(reloadBtn)

    // Verify isBusy: buttons and inputs are disabled
    const busyBtns = within(dialog).getAllByRole('button', { name: /Đang tải lại/i })
    expect(busyBtns.length).toBeGreaterThanOrEqual(1)
    expect(reloadBtn.hasAttribute('disabled')).toBe(true)
    expect(within(dialog).getByRole('button', { name: 'Hủy' }).hasAttribute('disabled')).toBe(true)
    expect(endTimeInput.matches(':disabled')).toBe(true)
    expect(dialog.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true)
    await act(async () => {
      fireEvent.submit(dialog.querySelector('form')!)
    })
    expect(updateWorkScheduleVersion).toHaveBeenCalledTimes(1)

    // Simulate Network Error during reload
    rejectReload!(new AxiosError('Network Error', 'ERR_NETWORK'))

    // Error is displayed in Vietnamese, not raw English "Network Error"
    await within(dialog).findByText(
      'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.',
    )

    // User typed value "18:30" is preserved!
    expect(endTimeInput.value).toBe('18:30')

    // Reload button is re-enabled for retry
    expect(reloadBtn.hasAttribute('disabled')).toBe(false)

    // 2nd reload attempt succeeds
    const freshDraft: WorkScheduleDto = {
      ...fixtureDraft,
      revision: 2,
      endTime: '17:45',
    }
    vi.mocked(getWorkScheduleVersionById).mockResolvedValueOnce(freshDraft)

    fireEvent.click(reloadBtn)

    // Form is updated to latest revision
    await waitFor(() => {
      expect(within(dialog).getByText(/rev 2/i)).toBeTruthy()
      expect((within(dialog).getByLabelText(/Giờ ra ca/i) as HTMLInputElement).value).toBe('17:45')
    })

    // Closing and opening again must not restore the stale list snapshot.
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }))
    fireEvent.click(screen.getAllByRole('button', { name: /Sửa|Chỉnh sửa/i })[0])
    const reopenedDialog = await screen.findByRole('dialog')
    expect(within(reopenedDialog).getByText(/rev 2/i)).toBeTruthy()
    expect((within(reopenedDialog).getByLabelText(/Giờ ra ca/i) as HTMLInputElement).value).toBe('17:45')

    vi.mocked(updateWorkScheduleVersion).mockResolvedValueOnce({ ...freshDraft, revision: 3 })
    fireEvent.click(within(reopenedDialog).getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => {
      expect(updateWorkScheduleVersion).toHaveBeenLastCalledWith(
        fixtureDraft.id,
        expect.objectContaining({ expectedRevision: 2 }),
      )
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(getWorkScheduleVersions).toHaveBeenCalledTimes(2)

    cleanup()
  })

  it('F02: disables pagination next on last page and recovers safely from out-of-bounds page', async () => {
    // 2 pages total
    vi.mocked(getWorkScheduleVersions).mockResolvedValueOnce({
      data: [fixtureDraft],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 12,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    })

    const cleanup = setup(<WorkScheduleSettingsPage />)

    await screen.findByText('Trang 1 / 2')
    const nextBtn = screen.getByRole('button', { name: 'Trang sau' })
    const prevBtn = screen.getByRole('button', { name: 'Trang trước' })

    expect(prevBtn.hasAttribute('disabled')).toBe(true)
    expect(nextBtn.hasAttribute('disabled')).toBe(false)

    // Second call returns empty array for page 2 (simulating out of bounds / deleted items)
    vi.mocked(getWorkScheduleVersions).mockResolvedValueOnce({
      data: [],
      meta: {
        page: 2,
        limit: 10,
        totalItems: 12,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    })

    fireEvent.click(nextBtn)

    // Next page is loaded
    await screen.findByText('Trang 2 hiện không có bản ghi nào')
    expect(screen.getByText(/Tổng cộng có 12 bản ghi \(2 trang\)/i)).toBeTruthy()

    // Next button must be disabled on page 2 / 2
    expect(nextBtn.hasAttribute('disabled')).toBe(true)

    // Out-of-bounds recovery buttons exist
    const returnLastBtn = screen.getByRole('button', { name: /Quay lại trang cuối/i })
    expect(returnLastBtn).toBeTruthy()
    const returnFirstBtn = screen.getByRole('button', { name: /Về trang đầu/i })
    expect(returnFirstBtn).toBeTruthy()

    // Previous button remains available to navigate back
    await waitFor(() => {
      expect(prevBtn.hasAttribute('disabled')).toBe(false)
    })

    cleanup()
  })

  it('F04: parseWorkScheduleError converts network errors, 500s and English text to Vietnamese', () => {
    // Network Error
    const netErr = new AxiosError('Network Error', 'ERR_NETWORK')
    expect(parseWorkScheduleError(netErr, 'Lỗi mặc định').message).toBe(
      'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.',
    )

    // Timeout
    const timeoutErr = new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED')
    expect(parseWorkScheduleError(timeoutErr, 'Lỗi mặc định').message).toBe(
      'Hết thời gian chờ phản hồi từ máy chủ. Vui lòng thử lại.',
    )

    // 500 Server Error
    const server500 = new AxiosError('Internal Server Error')
    server500.response = { status: 500, data: { message: 'Internal Server Error' } } as AxiosResponse
    expect(parseWorkScheduleError(server500, 'Lỗi mặc định').message).toBe(
      'Không thể xử lý lịch làm việc. Vui lòng thử lại sau.',
    )

    // English message leaked from custom backend error
    const englishLeak = new AxiosError('Failed')
    englishLeak.response = {
      status: 400,
      data: { message: 'The specified schedule cannot be created due to validation failure' },
    } as AxiosResponse
    expect(parseWorkScheduleError(englishLeak, 'Dữ liệu không hợp lệ.').message).toBe(
      'Dữ liệu không hợp lệ.',
    )

    // Unknown messages are not a localization contract, regardless of accents.
    const vnMsg = new AxiosError('Lỗi')
    vnMsg.response = {
      status: 400,
      data: { message: 'Ngày hiệu lực không được trùng lặp.' },
    } as AxiosResponse
    expect(parseWorkScheduleError(vnMsg, 'Lỗi mặc định').message).toBe(
      'Lỗi mặc định',
    )
  })

  it('F04: never guesses the language of unknown Unicode/server/client errors', () => {
    for (const message of ['Request couldn’t be completed', 'Server error — try again', 'Échec de requête']) {
      const error = new AxiosError(message)
      error.response = { status: 400, data: { message } } as AxiosResponse
      expect(parseWorkScheduleError(error, 'Không thể lưu bản nháp.').message).toBe('Không thể lưu bản nháp.')
      expect(parseWorkScheduleError(new Error(message), 'Không thể lưu bản nháp.').message).toBe('Không thể lưu bản nháp.')
    }

    const known = new AxiosError('Bad request')
    known.response = {
      status: 400,
      data: {
        code: 'VALIDATION_ERROR',
        message: 'Thông tin lịch làm việc không hợp lệ.',
        details: { effectiveFrom: 'Ngày hiệu lực không tồn tại.' },
      },
    } as AxiosResponse
    expect(parseWorkScheduleError(known)).toMatchObject({
      message: 'Thông tin lịch làm việc không hợp lệ.',
      details: { effectiveFrom: 'Ngày hiệu lực không tồn tại.' },
    })
  })

  it('F02: prevents repeated next requests while the next page is still loading', async () => {
    const firstPage: WorkScheduleListResponse = {
      data: [fixtureDraft],
      meta: { page: 1, limit: 10, totalItems: 11, totalPages: 2, hasNextPage: true, hasPreviousPage: false },
    }
    let resolvePage!: (value: WorkScheduleListResponse) => void
    const pendingPage = new Promise<WorkScheduleListResponse>((resolve) => { resolvePage = resolve })
    vi.mocked(getWorkScheduleVersions).mockResolvedValueOnce(firstPage).mockReturnValueOnce(pendingPage)
    const cleanup = setup(<WorkScheduleSettingsPage />)
    await screen.findByText('Trang 1 / 2')
    const next = screen.getByRole('button', { name: 'Trang sau' })
    fireEvent.click(next)
    await waitFor(() => expect(next.hasAttribute('disabled')).toBe(true))
    fireEvent.click(next)
    fireEvent.click(next)
    expect(getWorkScheduleVersions).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Trang 3 / 2')).toBeNull()
    await act(async () => resolvePage({
      data: [{ ...fixtureDraft, version: 2 }],
      meta: { ...firstPage.meta, page: 2, hasNextPage: false, hasPreviousPage: true },
    }))
    expect(screen.getByText('Trang 2 / 2')).toBeTruthy()
    expect(next.hasAttribute('disabled')).toBe(true)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Trang trước' }).hasAttribute('disabled')).toBe(false)
    })
    cleanup()
  })

  it('matches S1 date-only, HH:mm, weekday and single-break validation without shifting the date', () => {
    const values = {
      effectiveFrom: '2026-11-01', weekdays: [1, 2, 3, 4, 5],
      startTime: '08:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00',
    }
    for (const effectiveFrom of ['0001-01-01', '2028-02-29', '9999-12-31']) {
      expect(workScheduleFormSchema.parse({ ...values, effectiveFrom }).effectiveFrom).toBe(effectiveFrom)
    }
    for (const effectiveFrom of ['0000-01-01', '2026-02-30', '2026-13-01', '2026-11-01T00:00:00.000Z']) {
      expect(workScheduleFormSchema.safeParse({ ...values, effectiveFrom }).success).toBe(false)
    }
    for (const fields of [
      { startTime: '08' }, { startTime: '8:00' }, { endTime: '24:00' },
      { weekdays: [] }, { weekdays: [1, 1] }, { weekdays: [0] },
      { breakStartTime: '08:00' }, { breakEndTime: '12:00' },
      { breakEndTime: '17:00' }, { startTime: '22:00', endTime: '06:00' },
    ]) {
      expect(workScheduleFormSchema.safeParse({ ...values, ...fields }).success).toBe(false)
    }
  })

  it('F05: restores focus to triggering button when dialog closes and stays in edit when transitioning from detail', async () => {
    vi.mocked(getWorkScheduleVersions).mockResolvedValue({
      data: [fixtureDraft],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })

    const cleanup = setup(<WorkScheduleSettingsPage />)

    // 1. Open create dialog via header button
    const createBtn = await screen.findByRole('button', { name: /Tạo bản nháp mới/i })
    createBtn.focus()
    expect(document.activeElement).toBe(createBtn)

    fireEvent.click(createBtn)
    const createDialog = await screen.findByRole('dialog')
    expect(createDialog).toBeTruthy()

    // Close create dialog via "Hủy" button
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Hủy' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.activeElement).toBe(createBtn)

    // 2. Open detail dialog
    const detailBtns = screen.getAllByRole('button', { name: /Chi tiết/i })
    const targetDetailBtn = detailBtns[0]
    targetDetailBtn.focus()
    fireEvent.click(targetDetailBtn)

    const detailDialog = await screen.findByRole('dialog')
    expect(within(detailDialog).getByText('Bản nháp lịch làm việc v1')).toBeTruthy()

    // Close detail dialog via "Đóng" button
    const closeBtns = within(detailDialog).getAllByRole('button', { name: 'Đóng' })
    fireEvent.click(closeBtns[0])

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.activeElement).toBe(targetDetailBtn)

    // 3. Open detail dialog again and click "Chỉnh sửa bản nháp" -> transitions to Edit modal
    fireEvent.click(targetDetailBtn)
    const detailDialog2 = await screen.findByRole('dialog')
    fireEvent.click(within(detailDialog2).getByRole('button', { name: /Chỉnh sửa bản nháp/i }))

    // Now edit dialog is open, focus should NOT be forced back to targetDetailBtn
    await screen.findByText(/Chỉnh sửa bản nháp v1/i)
    expect(screen.getByRole('dialog')).toBeTruthy()

    cleanup()
  })
})

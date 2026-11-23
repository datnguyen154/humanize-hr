import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { WorkScheduleSettingsPage } from '@/pages/admin/attendance/WorkScheduleSettingsPage'
import { activateWorkScheduleVersion, getWorkScheduleVersions } from '@/features/work-schedule/api/work-schedule.api'
import type { WorkScheduleDto, WorkScheduleListParams } from '@/features/work-schedule'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

vi.mock('@/features/work-schedule/api/work-schedule.api', () => ({
  getWorkScheduleVersions: vi.fn(),
  getWorkScheduleVersionById: vi.fn(),
  createWorkScheduleVersion: vi.fn(),
  updateWorkScheduleVersion: vi.fn(),
  activateWorkScheduleVersion: vi.fn(),
}))
vi.mock('@/lib/toast', () => ({ showSuccessToast: vi.fn(), showErrorToast: vi.fn(), showInfoToast: vi.fn() }))

const base: WorkScheduleDto = {
  id: '11111111-1111-4111-8111-111111111111', version: 2, revision: 4, status: 'DRAFT', effectiveFrom: '2099-01-01',
  timezone: 'Asia/Ho_Chi_Minh', weekdays: [1, 2, 3, 4, 5], startTime: '08:30', endTime: '17:30',
  breaks: [{ startTime: '12:00', endTime: '13:00' }], createdBy: 'a', updatedBy: 'a',
  createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z',
}
const active: WorkScheduleDto = { ...base, id: '22222222-2222-4222-8222-222222222222', version: 1, status: 'ACTIVE', effectiveFrom: '2026-01-01', startTime: '08:00', endTime: '17:00' }
const meta = (n: number) => ({ page: 1, limit: 10, totalItems: n, totalPages: n ? 1 : 0, hasNextPage: false, hasPreviousPage: false })
let actives: WorkScheduleDto[] = []

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter><WorkScheduleSettingsPage /></MemoryRouter></QueryClientProvider>)
}

beforeEach(() => {
  vi.resetAllMocks()
  actives = []
  vi.mocked(getWorkScheduleVersions).mockImplementation(async (params?: WorkScheduleListParams) =>
    params?.status === 'ACTIVE' ? { data: actives, meta: meta(actives.length) } : { data: [base], meta: meta(1) })
})
afterEach(cleanup)

it('explains the legacy 08:00 rule when nothing is active, and lists ACTIVE versions with their state', async () => {
  setup()
  await screen.findByText(/Chưa có lịch nào được kích hoạt/)
  cleanup()
  actives = [active]
  setup()
  await screen.findByText(/Phiên bản v1 · từ 01\/01\/2026/)
  expect(screen.getByText('Đang áp dụng')).toBeTruthy()
})

it('activation confirms with the effective date, sends expectedRevision and refreshes both lists', async () => {
  vi.mocked(activateWorkScheduleVersion).mockImplementation(async () => {
    actives = [{ ...base, status: 'ACTIVE', revision: 5 }]
    return actives[0]
  })
  setup()
  const buttons = await screen.findAllByRole('button', { name: 'Kích hoạt' })
  fireEvent.click(buttons[0])
  const dialog = await screen.findByRole('alertdialog')
  expect(within(dialog).getByText(/từ ngày 01\/01\/2099/)).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Kích hoạt lịch' }))
  await waitFor(() => expect(activateWorkScheduleVersion).toHaveBeenCalledWith(base.id, 4))
  await waitFor(() => expect(showSuccessToast).toHaveBeenCalled())
  await screen.findByText(/Phiên bản v2 · từ 01\/01\/2099/)
  expect(screen.getByText('Sắp áp dụng')).toBeTruthy()
})

it('shows the backend Vietnamese reason when activation is rejected', async () => {
  const message = 'Ngày hiệu lực phải sau ngày 01/01/2099 của lịch đang áp dụng gần nhất.'
  vi.mocked(activateWorkScheduleVersion).mockRejectedValue(new AxiosError('x', undefined, undefined, undefined,
    { status: 409, data: { code: 'WORK_SCHEDULE_EFFECTIVE_FROM_OVERLAP', message } } as AxiosResponse))
  setup()
  fireEvent.click((await screen.findAllByRole('button', { name: 'Kích hoạt' }))[0])
  fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Kích hoạt lịch' }))
  await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith(message))
})

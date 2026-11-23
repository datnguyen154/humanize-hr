import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import type { ReactNode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { axiosInstance } from '@/shared/api'
import * as api from '@/features/work-schedule/api/calendar-exception.api'
import { getWorkScheduleVersionById, updateWorkScheduleVersion } from '@/features/work-schedule/api/work-schedule.api'
import { loadCalendarEditor, currentCalendarMonth } from '@/features/work-schedule/lib/calendar-exception.editor'
import { parseCalendarExceptionError } from '@/features/work-schedule/lib/calendar-exception.helpers'
import { holidayFormSchema, swapFormSchema, workOverrideFormSchema } from '@/features/work-schedule/lib/calendar-exception.schema'
import { invalidateCalendarMutation } from '@/features/work-schedule/lib/work-calendar.cache'
import { calendarExceptionQueryKeys as ek, calendarPreviewQueryKeys as pk, workScheduleQueryKeys as sk } from '@/features/work-schedule/lib/work-calendar.query-keys'
import { useUpdateWorkScheduleMutation } from '@/features/work-schedule/hooks/useWorkScheduleQuery'

vi.mock('@/shared/api', () => ({ axiosInstance: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
vi.mock('@/features/work-schedule/api/work-schedule.api', () => ({ getWorkScheduleVersionById: vi.fn(), updateWorkScheduleVersion: vi.fn(), getWorkScheduleVersions: vi.fn(), createWorkScheduleVersion: vi.fn() }))
const id = '11111111-1111-4111-8111-111111111111'
const eid = '22222222-2222-4222-8222-222222222222'
const payload = { kind: 'HOLIDAY' as const, date: '2026-11-02', name: 'Lễ thử nghiệm', sourceReference: 'Căn cứ thử nghiệm', reason: 'Lý do thử nghiệm' }
const exception = { id: eid, scheduleVersionId: id, payload, firstAffectedDate: payload.date, createdBy: id, updatedBy: id, createdAt: '', updatedAt: '' }
const schedule = { id, version: 1, revision: 3, status: 'DRAFT' as const, effectiveFrom: '2026-11-01', timezone: 'Asia/Ho_Chi_Minh' as const,
  weekdays: [1,2,3,4,5], startTime: '08:00', endTime: '17:00', breaks: [{ startTime: '12:00', endTime: '13:00' }] as [{ startTime: string; endTime: string }], createdBy: id, updatedBy: id, createdAt: '', updatedAt: '' }
beforeEach(() => vi.resetAllMocks())

it('maps all six Axios API envelopes, full replace and DELETE JSON body', async () => {
  const list = { data: [exception], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }, scheduleRevision: 3 }
  vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: list })
  expect(await api.getCalendarExceptions(id, { page: 1, kind: 'HOLIDAY', fromDate: '2026-11-01', toDate: '2026-11-30' })).toEqual(list)
  expect(axiosInstance.get).toHaveBeenCalledWith(`/work-calendar/versions/${id}/exceptions`, expect.objectContaining({ params: expect.objectContaining({ fromDate: '2026-11-01' }) }))
  const detail = { exception, scheduleRevision: 3 }
  vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: { data: detail } })
  expect(await api.getCalendarExceptionById(id, eid)).toEqual(detail)
  vi.mocked(axiosInstance.post).mockResolvedValue({ data: { data: detail } })
  expect(await api.createCalendarException(id, { expectedRevision: 2, exception: payload })).toEqual(detail)
  vi.mocked(axiosInstance.patch).mockResolvedValue({ data: { data: detail } })
  expect(await api.updateCalendarException(id, eid, { expectedRevision: 2, exception: payload })).toEqual(detail)
  expect(axiosInstance.patch).toHaveBeenCalledWith(`/work-calendar/versions/${id}/exceptions/${eid}`, { expectedRevision: 2, exception: payload }, expect.anything())
  const removed = { removedExceptionId: eid, scheduleRevision: 4 }
  vi.mocked(axiosInstance.delete).mockResolvedValue({ data: { data: removed } })
  expect(await api.deleteCalendarException(id, eid, { expectedRevision: 3, reason: 'Thử xóa' })).toEqual(removed)
  expect(axiosInstance.delete).toHaveBeenCalledWith(`/work-calendar/versions/${id}/exceptions/${eid}`, expect.objectContaining({ data: { expectedRevision: 3, reason: 'Thử xóa' } }))
  vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: { data: { versionId: id, year: 1, month: 1 } } })
  expect(await api.getCalendarPreview({ versionId: id, year: 1, month: 1 })).toEqual({ versionId: id, year: 1, month: 1 })
  expect(axiosInstance.get).toHaveBeenLastCalledWith('/work-calendar/preview', expect.objectContaining({ params: { versionId: id, year: '0001', month: 1 } }))
})

it('reload requires parent/detail of exactly the same revision; errors and missing details propagate', async () => {
  vi.mocked(getWorkScheduleVersionById).mockResolvedValue(schedule)
  vi.mocked(axiosInstance.get).mockResolvedValue({ data: { data: { exception, scheduleRevision: 4 } } })
  await expect(loadCalendarEditor(id, eid)).rejects.toThrow('Dữ liệu đã thay đổi trong lúc tải lại')
  vi.mocked(axiosInstance.get).mockRejectedValue(new Error('GET failed'))
  await expect(loadCalendarEditor(id, eid)).rejects.toThrow('GET failed')
  vi.mocked(axiosInstance.get).mockResolvedValue({ data: { data: { exception, scheduleRevision: 3 } } })
  expect(await loadCalendarEditor(id, eid)).toEqual({ schedule, exception, scheduleRevision: 3 })
})

for (const code of ['WORK_CALENDAR_EXCEPTION_CONFLICT','WORK_CALENDAR_EXCEPTION_REFERENCED','WORK_SCHEDULE_NOT_DRAFT']) {
  it(`does not classify ${code} as a revision conflict`, () => {
    const error = new AxiosError('Conflict')
    error.response = { status: 409, data: { code, message: 'Raw English backend error' } } as AxiosResponse
    const result = parseCalendarExceptionError(error)
    expect(result.isRevisionConflict).toBe(false)
    expect(result.message).not.toContain('English')
  })
}
it('only exact revision code enables reload and unknown/non-ASCII errors never leak raw text', () => {
  const error = new AxiosError('Conflict')
  error.response = { status: 409, data: { code: 'WORK_SCHEDULE_REVISION_CONFLICT', message: 'Revision conflict' } } as AxiosResponse
  expect(parseCalendarExceptionError(error).isRevisionConflict).toBe(true)
  error.response.data = { code: 'NEW_UNKNOWN', message: 'Invalid café configuration' }
  expect(parseCalendarExceptionError(error).message).toBe('Không thể xử lý ngoại lệ lịch làm việc.')
})
for (const date of ['0001-01-01', '0099-12-31', '2000-02-29', '9999-12-31']) {
  it(`accepts backend civil-date contract ${date}`, () => expect(holidayFormSchema.safeParse({ ...payload, date }).success).toBe(true))
}
for (const date of ['0000-01-01', '2100-02-29', '2026-02-30', '2026-11-01T00:00:00Z']) {
  it(`rejects invalid civil date ${date}`, () => expect(holidayFormSchema.safeParse({ ...payload, date }).success).toBe(false))
}
it('keeps atomic SWAP and single-break validation, without activation limits', () => {
  expect(swapFormSchema.safeParse({ kind: 'SWAP', offDate: '2026-12-31', workDate: '2027-01-02', reason: 'Đổi ngày' }).success).toBe(true)
  expect(swapFormSchema.safeParse({ kind: 'SWAP', offDate: payload.date, workDate: payload.date, reason: 'Đổi ngày' }).success).toBe(false)
  expect(workOverrideFormSchema.safeParse({ kind: 'WORK_OVERRIDE', date: payload.date, startTime: '07:00', endTime: '20:00', breakStartTime: '12:00', breakEndTime: '13:00', reason: 'Thử lịch nháp' }).success).toBe(true)
})
it('defaults month/year to company timezone rather than browser local day', () => {
  expect(currentCalendarMonth(new Date('2026-12-31T18:00:00Z'))).toEqual({ year: 2027, month: 1 })
})
it('invalidates every exception detail and preview in the affected version, not Attendance or another version', async () => {
  const client = new QueryClient()
  const keys = [ek.detail(id, eid), ek.detail(id, 'other'), ek.list(id, { page: 2 }), pk.preview(id, 2027, 1), sk.detail(id), sk.list({ page: 1 })]
  keys.forEach((key) => client.setQueryData(key, { value: 'old' }))
  client.setQueryData(ek.detail('different-version', eid), { value: 'unrelated' })
  client.setQueryData(['attendance-history'], [])
  await invalidateCalendarMutation(client, id)
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true))
  expect(client.getQueryState(ek.detail('different-version', eid))?.isInvalidated).toBe(false)
  expect(client.getQueryState(['attendance-history'])?.isInvalidated).toBe(false)
  client.clear()
})
it('S1 base PATCH also invalidates S2A exception and preview caches', async () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  client.setQueryData(ek.list(id), { data: [] })
  client.setQueryData(pk.preview(id, 2026, 11), { scheduleRevision: 2 })
  vi.mocked(updateWorkScheduleVersion).mockResolvedValue(schedule)
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  const view = renderHook(() => useUpdateWorkScheduleMutation(), { wrapper })
  await act(async () => { await view.result.current.mutateAsync({ id, payload: { expectedRevision: 2, weekdays: [1] } }) })
  await waitFor(() => expect(client.getQueryState(pk.preview(id, 2026, 11))?.isInvalidated).toBe(true))
  expect(client.getQueryState(ek.list(id))?.isInvalidated).toBe(true)
  view.unmount(); client.clear()
})

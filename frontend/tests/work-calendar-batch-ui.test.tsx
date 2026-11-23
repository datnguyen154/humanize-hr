import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { HolidayBatchDialog } from '@/pages/admin/attendance/components/HolidayBatchDialog'
import { buildHolidayBatchRequest } from '@/features/work-schedule/lib/holiday-batch'
import { commitHolidayBatch, getHolidayPresets, previewHolidayBatch } from '@/features/work-schedule/api/calendar-exception.api'
import type { HolidayBatchPlan, HolidayPresetCatalog } from '@/features/work-schedule'
import type { CalendarEditorSnapshot } from '@/features/work-schedule/lib/calendar-exception.editor'
import { holidayPresetQueryKeys } from '@/features/work-schedule/lib/work-calendar.query-keys'

vi.mock('@/features/work-schedule/api/calendar-exception.api', () => ({ getHolidayPresets: vi.fn(), previewHolidayBatch: vi.fn(), commitHolidayBatch: vi.fn() }))
vi.mock('@/lib/toast', () => ({ showSuccessToast: vi.fn() }))
vi.mock('@/shared/components/DatePicker', () => ({ DatePicker: ({ id, value, onChange, disabled }: { id: string; value?: string; onChange: (value: string) => void; disabled?: boolean }) => <input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} /> }))

const preset = { id: 'VN-2026-10-22-r1:2026:NEW_YEAR:default', year: 2026, holidayCode: 'NEW_YEAR', name: 'Tết Dương lịch', optionLabel: 'Tết Dương lịch', dates: ['2026-01-01'], sourceReference: 'Nguồn đã xác minh', sourceUrls: ['https://chinhphu.vn/?docid=198540&pageid=27160'], suggestedReason: 'HR xác nhận kỳ nghỉ', verifiedOn: '2026-10-22' }
const catalog: HolidayPresetCatalog = { catalogVersion: 'VN-2026-10-22-r1', year: 2026, timezone: 'Asia/Ho_Chi_Minh', requiresConfirmation: true, presets: [preset], unavailable: [{ holidayCode: 'HUNG_KINGS', reason: 'Chưa có dữ liệu đã xác minh' }], notice: 'Không tự suy đoán ngày lễ' }
const plan: HolidayBatchPlan = { scheduleRevision: 3, catalogVersion: catalog.catalogVersion, planFingerprint: 'sha256:'+'a'.repeat(64), toCreate: [], skipped: [], calendarDays: [], validation: { hasBlockingIssues: true, issues: [{ code: 'COMPENSATORY_OFF_REQUIRED', severity: 'BLOCKER', scope: 'DRAFT', date: '2026-01-02', exceptionIds: ['outside'], message: 'Cần xử lý ngoại lệ khác' }] } }
const error = (code: string, status = 409) => new AxiosError('error',undefined,undefined,undefined,{ status, data: { code, message: 'English backend text' } } as AxiosResponse)
function setup(extra: Partial<React.ComponentProps<typeof HolidayBatchDialog>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const close = vi.fn()
  const view=render(<QueryClientProvider client={client}><HolidayBatchDialog open onOpenChange={close} versionId="11111111-1111-4111-8111-111111111111" scheduleRevision={3} effectiveFrom="2026-01-01" {...extra} /></QueryClientProvider>)
  return { client, close, ...view }
}
const choose = async () => fireEvent.click(await screen.findByRole('button', { name: /1 ngày: 01\/01\/2026/ }))
const preview = () => screen.getByRole('button', { name: 'Xem trước kỳ nghỉ' })
const commit = () => screen.getByRole('button', { name: 'Xác nhận và lưu kỳ nghỉ' }) as HTMLButtonElement
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getHolidayPresets).mockResolvedValue(catalog)
  vi.mocked(previewHolidayBatch).mockResolvedValue(plan)
  vi.mocked(commitHolidayBatch).mockResolvedValue({ created: [], skipped: [], scheduleRevision: 4 })
})
afterEach(cleanup)

it('requires complete company rows, does not fabricate reasons/basis or silently omit incomplete rows', () => {
  expect(() => buildHolidayBatchRequest(catalog,{ NEW_YEAR: preset.id },[{id:'a',date:'2026-01-03',name:'Nghỉ riêng',sourceReference:'',reason:'',isPaid:true}],3,false,2026)).toThrow(/căn cứ/)
  expect(() => buildHolidayBatchRequest(catalog,{ NEW_YEAR: preset.id },[{id:'a',date:'',name:'',sourceReference:'',reason:'',isPaid:null}],3,false,2026)).toThrow()
  expect(() => buildHolidayBatchRequest(catalog,{ NEW_YEAR: preset.id },[],3,false,2027)).toThrow(/Danh mục/)
})

it('preview does not commit, confirmation uses exactly the reviewed request; DRAFT blockers do not forbid draft save', async () => {
  const { close, client }=setup()
  const invalidate=vi.spyOn(client,'invalidateQueries')
  await choose()
  fireEvent.click(preview())
  await waitFor(()=>expect(commit().disabled).toBe(false))
  expect(commitHolidayBatch).not.toHaveBeenCalled()
  fireEvent.click(commit()); fireEvent.click(commit())
  await waitFor(()=>expect(close).toHaveBeenCalledWith(false))
  expect(commitHolidayBatch).toHaveBeenCalledTimes(1)
  expect(vi.mocked(commitHolidayBatch).mock.calls[0][1]).toEqual({ ...vi.mocked(previewHolidayBatch).mock.calls[0][1], planFingerprint: plan.planFingerprint })
  expect(invalidate).toHaveBeenCalledTimes(5)
})

it('changing input invalidates plan, blocks actions during preview and ignores a catalog refresh under an old review', async () => {
  let resolve!: (value: HolidayBatchPlan)=>void
  vi.mocked(previewHolidayBatch).mockReturnValueOnce(new Promise(r=>{resolve=r}))
  const { client }=setup()
  await choose()
  const previewButton = preview()
  fireEvent.click(previewButton); fireEvent.click(previewButton)
  await waitFor(()=>expect(previewHolidayBatch).toHaveBeenCalledTimes(1))
  await act(async()=>resolve(plan))
  await waitFor(()=>expect(commit().disabled).toBe(false))
  act(()=>client.setQueryData(holidayPresetQueryKeys.byYear(2026), { ...catalog, presets: [{ ...preset, suggestedReason:'Nguồn mới' }] }))
  await waitFor(()=>expect(commit().disabled).toBe(true))
  // Checkbox changes must always invalidate the reviewed request.
  fireEvent.click(screen.getByRole('checkbox'))
  expect(commit().disabled).toBe(true)
  fireEvent.click(commit())
  expect(commitHolidayBatch).not.toHaveBeenCalled()
})

it('stale409 remains locked after editing; failed reload keeps inputs; successful confirmed reload discards selections', async () => {
  vi.mocked(previewHolidayBatch).mockRejectedValue(error('WORK_SCHEDULE_REVISION_CONFLICT'))
  const reload=vi.fn().mockRejectedValueOnce(error('INTERNAL_SERVER_ERROR',500)).mockResolvedValue({ scheduleRevision:4,schedule:{id:'11111111-1111-4111-8111-111111111111',effectiveFrom:'2027-01-01'} } as CalendarEditorSnapshot)
  setup({onReloadFresh:reload})
  await choose();fireEvent.click(preview())
  await screen.findByText('Bản nháp đã thay đổi. Vui lòng tải lại trước khi lưu.')
  fireEvent.click(screen.getByRole('checkbox'))
  expect((preview() as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(screen.getByRole('button',{name:'Tải lại dữ liệu mới nhất'}))
  fireEvent.click(await screen.findByRole('button',{name:'Tải lại ngay'}))
  await waitFor(()=>expect(reload).toHaveBeenCalledTimes(1))
  await screen.findByText(/Không thể xử lý ngoại lệ/)
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
  fireEvent.click(screen.getByRole('button',{name:'Tải lại dữ liệu mới nhất'}))
  fireEvent.click(await screen.findByRole('button',{name:'Tải lại ngay'}))
  await waitFor(()=>expect((screen.getByLabelText('Năm lịch:') as HTMLInputElement).value).toBe('2027'))
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false)
  expect(commit().disabled).toBe(true)
})

it('discard confirmation cancel retains selected preset, no mutation occurs on close', async () => {
  const { close }=setup()
  await choose()
  fireEvent.click(screen.getAllByRole('button',{name:'Đóng'})[0])
  fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button',{name:'Hủy'}))
  await waitFor(()=>expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(screen.getByRole('button',{name:/1 ngày: 01\/01\/2026/}).getAttribute('aria-pressed')).toBe('true')
  expect(close).not.toHaveBeenCalled()
  expect(commitHolidayBatch).not.toHaveBeenCalled()
})

it('catalog errors have retry; unavailable codes are localized and do not create inferred presets', async () => {
  vi.mocked(getHolidayPresets).mockRejectedValueOnce(new Error('network')).mockResolvedValue(catalog)
  setup()
  fireEvent.click(await screen.findByRole('button',{name:'Thử lại danh mục'}))
  await screen.findByText('Giỗ Tổ Hùng Vương:',{exact:true})
  expect(screen.queryByText('HUNG_KINGS:')).toBeNull()
  expect(commit().disabled).toBe(true)
})

it('PLAN_CHANGED requires another preview, while day conflicts stay business errors without stale reload', async () => {
  vi.mocked(commitHolidayBatch).mockRejectedValueOnce(error('WORK_CALENDAR_BATCH_PLAN_CHANGED'))
  setup()
  await choose();fireEvent.click(preview())
  await waitFor(()=>expect(commit().disabled).toBe(false));fireEvent.click(commit())
  await waitFor(()=>expect(commit().disabled).toBe(true))
  expect(screen.queryByRole('button',{name:'Tải lại dữ liệu mới nhất'})).toBeNull()
  expect(screen.queryByText('English backend text')).toBeNull()
})

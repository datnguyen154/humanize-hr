import type { BatchPreviewRequest, HolidayPresetCatalog } from '../types/calendar-exception.types'
import { holidayFormSchema } from './calendar-exception.schema'
import { currentCalendarMonth } from './calendar-exception.editor'

export type CompanyHolidayInput = {
  id: string
  date: string
  name: string
  sourceReference: string
  reason: string
  isPaid: boolean | null
}

export class HolidayBatchInputError extends Error {}

export function calendarYear(effectiveFrom?: string) {
  const year = Number(effectiveFrom?.slice(0, 4))
  return Number.isInteger(year) && year >= 1 && year <= 9999 ? year : currentCalendarMonth().year
}

const holidayNames: Record<string, string> = {
  NEW_YEAR: 'Tết Dương lịch', TET: 'Tết Nguyên đán', HUNG_KINGS: 'Giỗ Tổ Hùng Vương',
  LIBERATION_DAY: 'Ngày Chiến thắng 30/04', LABOUR_DAY: 'Ngày Quốc tế Lao động 01/05', NATIONAL_DAY: 'Quốc khánh',
}
export const holidayName = (code: string) => holidayNames[code] ?? 'Ngày lễ chưa có dữ liệu xác minh'

export function buildHolidayBatchRequest(
  catalog: HolidayPresetCatalog | undefined,
  selected: Record<string, string>,
  company: CompanyHolidayInput[],
  expectedRevision: number,
  includeCompensatoryOff: boolean,
  year: number,
): BatchPreviewRequest {
  if (!Number.isInteger(year) || year < 1 || year > 9999) throw new HolidayBatchInputError('Năm lịch phải từ 0001 đến 9999.')
  const holidays: BatchPreviewRequest['holidays'] = []
  for (const [code, id] of Object.entries(selected)) {
    const preset = catalog?.year === year ? catalog.presets.find((p) => p.id === id && p.holidayCode === code) : undefined
    if (!preset) throw new HolidayBatchInputError('Danh mục đã thay đổi hoặc chưa tải xong. Vui lòng chọn lại phương án ngày lễ.')
    holidays.push(...preset.dates.map((date) => ({ kind: 'HOLIDAY' as const, date, name: preset.name,
      sourceReference: preset.sourceReference, reason: preset.suggestedReason,
      holidayPolicy: { category: 'STATUTORY' as const, presetId: preset.id } })))
  }
  company.forEach((row, index) => {
    const parsed = holidayFormSchema.safeParse({ ...row, kind: 'HOLIDAY', holidayCategory: 'COMPANY', isPaid: row.isPaid ?? undefined })
    if (!parsed.success) throw new HolidayBatchInputError(`Ngày nghỉ doanh nghiệp ${index + 1}: ${parsed.error.issues[0].message}`)
    const { date, name, sourceReference, reason, isPaid } = parsed.data
    holidays.push({ kind: 'HOLIDAY', date, name, sourceReference, reason, holidayPolicy: { category: 'COMPANY', isPaid: isPaid! } })
  })
  if (!holidays.length || holidays.length > 31) throw new HolidayBatchInputError('Vui lòng chọn từ 1 đến 31 ngày nghỉ trước khi xem trước.')
  if (new Set(holidays.map((h) => h.date)).size !== holidays.length) throw new HolidayBatchInputError('Có ngày nghỉ bị trùng. Vui lòng kiểm tra lại danh sách.')
  const ordered = holidays.map((h) => h.date).sort()
  if ((Date.parse(`${ordered.at(-1)}T00:00:00Z`) - Date.parse(`${ordered[0]}T00:00:00Z`)) / 86400000 > 365) {
    throw new HolidayBatchInputError('Khoảng ngày không vượt quá 366 ngày.')
  }
  return { expectedRevision, holidays, includeCompensatoryOff }
}

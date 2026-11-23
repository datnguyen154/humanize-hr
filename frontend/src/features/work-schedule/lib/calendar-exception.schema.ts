import { z } from 'zod'

const dateRegex = /^[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])$/
const timeRegex = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/

const isValidCivilDate = (val: string): boolean => {
  if (!dateRegex.test(val)) return false
  if (val.startsWith('0000')) return false
  const [year, month, day] = val.split('-').map(Number)
  const date = new Date(`${val}T00:00:00.000Z`)
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const dateSchema = (fieldName = 'Ngày') =>
  z
    .string()
    .min(1, `Vui lòng chọn ${fieldName.toLowerCase()}.`)
    .refine(isValidCivilDate, `${fieldName} không hợp lệ (định dạng YYYY-MM-DD).`)

const timeSchema = (fieldName = 'Giờ') =>
  z
    .string()
    .min(1, `Vui lòng nhập ${fieldName.toLowerCase()}.`)
    .regex(timeRegex, `${fieldName} không hợp lệ (định dạng HH:mm).`)

export const holidayFormSchema = z
  .object({
    kind: z.literal('HOLIDAY'),
    holidayCategory: z.enum(['STATUTORY', 'COMPANY', 'UNCLASSIFIED']).optional(),
    presetId: z.string().optional(),
    isPaid: z.boolean().optional(),
    date: dateSchema('Ngày lễ'),
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên ngày lễ.')
      .max(200, 'Tên ngày lễ không được vượt quá 200 ký tự.'),
    sourceReference: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập căn cứ văn bản/quyết định.')
      .max(1000, 'Căn cứ không được vượt quá 1000 ký tự.'),
    reason: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập lý do/ghi chú.')
      .max(1000, 'Lý do không được vượt quá 1000 ký tự.'),
  })
  .superRefine((data, ctx) => {
    if (data.holidayCategory === 'STATUTORY') {
      if (!data.presetId || !data.presetId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng chọn mẫu ngày lễ pháp định.',
          path: ['presetId'],
        })
      }
    } else if (data.holidayCategory === 'COMPANY') {
      if (typeof data.isPaid !== 'boolean') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng chọn rõ ngày nghỉ này có hưởng lương hay không.',
          path: ['isPaid'],
        })
      }
    }
  })

export const compensatoryOffFormSchema = z.object({
  kind: z.literal('COMPENSATORY_OFF'),
  date: dateSchema('Ngày nghỉ bù'),
  sourceHolidayDate: dateSchema('Ngày lễ nguồn được nghỉ bù'),
  reason: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập lý do/ghi chú nghỉ bù.')
    .max(1000, 'Lý do không được vượt quá 1000 ký tự.'),
})

export const swapFormSchema = z
  .object({
    kind: z.literal('SWAP'),
    offDate: dateSchema('Ngày nghỉ hoán đổi'),
    workDate: dateSchema('Ngày làm bù hoán đổi'),
    reason: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập lý do hoán đổi.')
      .max(1000, 'Lý do không được vượt quá 1000 ký tự.'),
  })
  .refine((data) => data.offDate !== data.workDate, {
    message: 'Ngày nghỉ hoán đổi và ngày làm bù không được trùng nhau.',
    path: ['workDate'],
  })

export const workOverrideFormSchema = z
  .object({
    kind: z.literal('WORK_OVERRIDE'),
    date: dateSchema('Ngày làm việc điều chỉnh'),
    startTime: timeSchema('Giờ vào ca'),
    endTime: timeSchema('Giờ ra ca'),
    breakStartTime: timeSchema('Giờ bắt đầu nghỉ'),
    breakEndTime: timeSchema('Giờ kết thúc nghỉ'),
    reason: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập lý do điều chỉnh giờ.')
      .max(1000, 'Lý do không được vượt quá 1000 ký tự.'),
  })
  .superRefine((data, ctx) => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number)
      return h * 60 + m
    }

    const start = toMinutes(data.startTime)
    const end = toMinutes(data.endTime)
    const breakStart = toMinutes(data.breakStartTime)
    const breakEnd = toMinutes(data.breakEndTime)

    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Giờ vào ca phải trước giờ ra ca.',
        path: ['endTime'],
      })
    }

    if (breakStart >= breakEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Giờ bắt đầu nghỉ phải trước giờ kết thúc nghỉ.',
        path: ['breakEndTime'],
      })
    }

    if (breakStart <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Khoảng nghỉ phải bắt đầu sau giờ vào ca.',
        path: ['breakStartTime'],
      })
    }

    if (breakEnd >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Khoảng nghỉ phải kết thúc trước giờ ra ca.',
        path: ['breakEndTime'],
      })
    }
  })

export const deleteExceptionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập lý do xóa ngoại lệ.')
    .max(1000, 'Lý do xóa không được vượt quá 1000 ký tự.'),
})

export type HolidayFormValues = z.infer<typeof holidayFormSchema>
export type CompensatoryOffFormValues = z.infer<typeof compensatoryOffFormSchema>
export type SwapFormValues = z.infer<typeof swapFormSchema>
export type WorkOverrideFormValues = z.infer<typeof workOverrideFormSchema>
export type DeleteExceptionValues = z.infer<typeof deleteExceptionSchema>

export type CalendarExceptionUnifiedFormValues = {
  kind: 'HOLIDAY' | 'COMPENSATORY_OFF' | 'SWAP' | 'WORK_OVERRIDE'
  // Common / Date
  date?: string
  name?: string
  sourceReference?: string
  // Holiday Policy
  holidayCategory?: 'STATUTORY' | 'COMPANY' | 'UNCLASSIFIED'
  presetId?: string
  isPaid?: boolean
  // COMPENSATORY_OFF
  sourceHolidayDate?: string
  // SWAP
  offDate?: string
  workDate?: string
  // WORK_OVERRIDE
  startTime?: string
  endTime?: string
  breakStartTime?: string
  breakEndTime?: string
  // Reason
  reason: string
}

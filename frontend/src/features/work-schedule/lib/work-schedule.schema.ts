import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const workScheduleFormSchema = z
  .object({
    effectiveFrom: z
      .string()
      .min(1, 'Vui lòng chọn ngày hiệu lực.')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hiệu lực phải có định dạng YYYY-MM-DD.')
      .refine((val) => !val.startsWith('0000'), 'Năm không hợp lệ.')
      .refine((val) => {
        const parsed = new Date(`${val}T00:00:00.000Z`)
        return (
          !Number.isNaN(parsed.getTime()) &&
          parsed.toISOString().slice(0, 10) === val
        )
      }, 'Ngày hiệu lực không tồn tại.'),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'Vui lòng chọn ít nhất một ngày làm việc trong tuần.')
      .max(7, 'Tối đa 7 ngày trong tuần.')
      .refine(
        (days) => new Set(days).size === days.length,
        'Ngày làm việc không được trùng nhau.',
      ),
    startTime: z
      .string()
      .min(1, 'Vui lòng nhập giờ vào ca.')
      .regex(timeRegex, 'Giờ vào phải có định dạng HH:mm (00:00 - 23:59).'),
    endTime: z
      .string()
      .min(1, 'Vui lòng nhập giờ ra ca.')
      .regex(timeRegex, 'Giờ ra phải có định dạng HH:mm (00:00 - 23:59).'),
    breakStartTime: z
      .string()
      .min(1, 'Vui lòng nhập giờ bắt đầu nghỉ.')
      .regex(timeRegex, 'Giờ bắt đầu nghỉ phải có định dạng HH:mm.'),
    breakEndTime: z
      .string()
      .min(1, 'Vui lòng nhập giờ kết thúc nghỉ.')
      .regex(timeRegex, 'Giờ kết thúc nghỉ phải có định dạng HH:mm.'),
  })
  .superRefine((data, ctx) => {
    if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
      return
    }
    if (
      !timeRegex.test(data.breakStartTime) ||
      !timeRegex.test(data.breakEndTime)
    ) {
      return
    }

    const start = timeToMinutes(data.startTime)
    const end = timeToMinutes(data.endTime)
    const breakStart = timeToMinutes(data.breakStartTime)
    const breakEnd = timeToMinutes(data.breakEndTime)

    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Giờ ra ca phải sau giờ vào ca; ca không được qua đêm.',
      })
    }

    if (breakStart <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['breakStartTime'],
        message: 'Giờ bắt đầu nghỉ phải sau giờ vào ca.',
      })
    }

    if (breakEnd <= breakStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['breakEndTime'],
        message: 'Giờ kết thúc nghỉ phải sau giờ bắt đầu nghỉ.',
      })
    }

    if (breakEnd >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['breakEndTime'],
        message: 'Giờ kết thúc nghỉ phải trước giờ ra ca.',
      })
    }
  })

export type WorkScheduleFormValues = z.infer<typeof workScheduleFormSchema>

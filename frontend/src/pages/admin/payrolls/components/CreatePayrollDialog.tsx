import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useEmployeeTimesheetQuery } from '@/features/attendance/hooks/useTimesheetQuery'
import { currentCompanyPeriod } from '@/features/attendance/lib/timesheet'
import { useEmployeesQuery } from '@/features/employee'
import { proratedBaseSalary, useCreatePayrollFromTimesheetMutation, useCreatePayrollMutation } from '@/features/payroll'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { ApiErrorResponse } from '@/shared/types'

const money = (label: string) => z.coerce.number({ message: `${label} phải là số` }).min(0, `${label} không được âm`)

const createPayrollSchema = z.object({
  mode: z.enum(['TIMESHEET', 'MANUAL']),
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  month: z.coerce
    .number({ message: 'Tháng phải là số' })
    .min(1, 'Tháng phải từ 1 đến 12')
    .max(12, 'Tháng phải từ 1 đến 12'),
  year: z.coerce
    .number({ message: 'Năm phải là số' })
    .min(2000, 'Năm phải từ 2000 trở đi'),
  baseSalary: money('Lương cơ bản'),
  monthlySalary: money('Lương tháng'),
  bonus: money('Thưởng'),
  deduction: money('Khấu trừ'),
  note: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.mode === 'TIMESHEET' && value.monthlySalary <= 0) {
    ctx.addIssue({ code: 'custom', path: ['monthlySalary'], message: 'Lương tháng phải lớn hơn 0' })
  }
})

type CreatePayrollFormInput = z.input<typeof createPayrollSchema>
type CreatePayrollFormValues = z.output<typeof createPayrollSchema>

type CreatePayrollDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formatCurrency = (amount: number) => {
  if (Number.isNaN(amount)) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const getErrorMessage = (error: unknown, fromTimesheet: boolean) => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as ApiErrorResponse | undefined)?.message
    // The timesheet endpoint answers with Vietnamese reasons (open period, incomplete calendar, duplicate).
    if (fromTimesheet && message && error.response?.status !== 500) return message
    if (error.response?.status === 409) {
      return 'Bảng lương cho nhân viên này trong tháng/năm đã chọn đã tồn tại.'
    }
    if (error.response?.status === 404) {
      return 'Không tìm thấy thông tin nhân viên.'
    }
    return message ?? 'Không thể tạo bảng lương. Vui lòng kiểm tra lại thông tin.'
  }
  return 'Không thể tạo bảng lương. Vui lòng thử lại sau.'
}

const selectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring'

export function CreatePayrollDialog({ open, onOpenChange }: CreatePayrollDialogProps) {
  const createPayrollMutation = useCreatePayrollMutation()
  const fromTimesheetMutation = useCreatePayrollFromTimesheetMutation()
  const isPending = createPayrollMutation.isPending || fromTimesheetMutation.isPending
  const [formError, setFormError] = useState<string | null>(null)

  const employeesQuery = useEmployeesQuery({
    page: 1,
    limit: 100,
    status: 'ACTIVE',
  })
  const employees = employeesQuery.data?.data ?? []

  // Default to the previous month: timesheet payroll is only possible once a month has ended.
  const current = currentCompanyPeriod()
  const previous = current.month === 1 ? { year: current.year - 1, month: 12 } : { year: current.year, month: current.month - 1 }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreatePayrollFormInput, unknown, CreatePayrollFormValues>({
    resolver: zodResolver(createPayrollSchema),
    defaultValues: {
      mode: 'TIMESHEET',
      employeeId: '',
      month: previous.month,
      year: previous.year,
      baseSalary: 0,
      monthlySalary: 0,
      bonus: 0,
      deduction: 0,
      note: '',
    },
  })

  const [mode, employeeId, month, year, baseSalary, monthlySalary, bonus, deduction] = useWatch({
    control,
    name: ['mode', 'employeeId', 'month', 'year', 'baseSalary', 'monthlySalary', 'bonus', 'deduction'],
  })
  const period = { year: Number(year) || 0, month: Number(month) || 0 }
  const isTimesheet = mode === 'TIMESHEET'
  const timesheetQuery = useEmployeeTimesheetQuery(isTimesheet && open ? employeeId : '', period)
  const timesheet = timesheetQuery.data
  const isClosed = period.year * 12 + period.month < current.year * 12 + current.month
  const timesheetReady = Boolean(timesheet && timesheet.standardDays !== null && isClosed)

  const effectiveBase = isTimesheet
    ? timesheetReady ? proratedBaseSalary(Number(monthlySalary) || 0, timesheet!.summary.payableDays, timesheet!.standardDays!) : 0
    : Number(baseSalary) || 0
  const calculatedNetSalary = Math.max(0, effectiveBase + (Number(bonus) || 0) - (Number(deduction) || 0))

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setFormError(null)
      reset()
    }
    onOpenChange(newOpen)
  }

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const onSubmit = async (values: CreatePayrollFormValues) => {
    setFormError(null)
    const common = {
      employeeId: values.employeeId,
      month: values.month,
      year: values.year,
      bonus: values.bonus,
      deduction: values.deduction,
      note: values.note?.trim() || null,
    }
    try {
      if (values.mode === 'TIMESHEET') {
        await fromTimesheetMutation.mutateAsync({ ...common, monthlySalary: values.monthlySalary })
      } else {
        await createPayrollMutation.mutateAsync({ ...common, baseSalary: values.baseSalary })
      }

      showSuccessToast('Bảng lương mới đã được tạo thành công.')
      reset()
      onOpenChange(false)
    } catch (error) {
      const errorMsg = getErrorMessage(error, values.mode === 'TIMESHEET')
      setFormError(errorMsg)
      showErrorToast()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo bảng lương mới</DialogTitle>
          <DialogDescription>
            Tính lương theo ngày công từ bảng công tháng, hoặc nhập tay lương cơ bản. Các trường có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          {formError ? (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Cách tính lương cơ bản</legend>
            <div className="grid grid-cols-2 gap-2">
              {([['TIMESHEET', 'Theo bảng công'], ['MANUAL', 'Nhập tay']] as const).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    mode === value ? 'border-primary bg-primary/5 font-medium text-foreground' : 'border-input text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  <input type="radio" value={value} className="size-4 accent-primary" {...register('mode')} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="employeeId" className="text-sm font-medium">
              Nhân viên <span className="text-destructive">*</span>
            </Label>
            <select id="employeeId" className={selectClassName} {...register('employeeId')}>
              <option value="">-- Chọn nhân viên --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode})
                </option>
              ))}
            </select>
            {errors.employeeId ? (
              <p className="text-xs text-destructive">{errors.employeeId.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="month" className="text-sm font-medium">
                Tháng <span className="text-destructive">*</span>
              </Label>
              <select id="month" className={selectClassName} {...register('month')}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
              {errors.month ? (
                <p className="text-xs text-destructive">{errors.month.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="year" className="text-sm font-medium">
                Năm <span className="text-destructive">*</span>
              </Label>
              <Input id="year" type="number" className="h-10" {...register('year')} />
              {errors.year ? (
                <p className="text-xs text-destructive">{errors.year.message}</p>
              ) : null}
            </div>
          </div>

          {isTimesheet ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="monthlySalary" className="text-sm font-medium">
                  Lương tháng theo hợp đồng (VNĐ) <span className="text-destructive">*</span>
                </Label>
                <Input id="monthlySalary" type="number" min={0} step="any" placeholder="0" className="h-10"
                  onFocus={handleInputFocus} {...register('monthlySalary')} />
                {errors.monthlySalary ? (
                  <p className="text-xs text-destructive">{errors.monthlySalary.message}</p>
                ) : null}
              </div>
              <TimesheetPanel
                employeeId={employeeId}
                period={period}
                isClosed={isClosed}
                isLoading={timesheetQuery.isFetching && !timesheet}
                isError={timesheetQuery.isError}
                payableDays={timesheet?.summary.payableDays ?? null}
                standardDays={timesheet ? timesheet.standardDays : undefined}
                baseSalary={effectiveBase}
              />
            </>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="baseSalary" className="text-sm font-medium">
                Lương cơ bản (VNĐ) <span className="text-destructive">*</span>
              </Label>
              <Input id="baseSalary" type="number" min={0} step="any" placeholder="0" className="h-10"
                onFocus={handleInputFocus} {...register('baseSalary')} />
              {errors.baseSalary ? (
                <p className="text-xs text-destructive">{errors.baseSalary.message}</p>
              ) : null}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bonus" className="text-sm font-medium">
                Thưởng (VNĐ)
              </Label>
              <Input id="bonus" type="number" min={0} step="any" placeholder="0" className="h-10"
                onFocus={handleInputFocus} {...register('bonus')} />
              {errors.bonus ? (
                <p className="text-xs text-destructive">{errors.bonus.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deduction" className="text-sm font-medium">
                Khấu trừ (VNĐ)
              </Label>
              <Input id="deduction" type="number" min={0} step="any" placeholder="0" className="h-10"
                onFocus={handleInputFocus} {...register('deduction')} />
              {errors.deduction ? (
                <p className="text-xs text-destructive">{errors.deduction.message}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Tính toán thực nhận (Live Preview)
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(calculatedNetSalary)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Công thức: Lương cơ bản + Thưởng - Khấu trừ
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note" className="text-sm font-medium">
              Ghi chú
            </Label>
            <textarea
              id="note"
              rows={2}
              className="resize-none rounded-md border border-input bg-background p-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Nhập ghi chú bổ sung nếu có..."
              {...register('note')}
            />
            {errors.note ? (
              <p className="text-xs text-destructive">{errors.note.message}</p>
            ) : null}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending || (isTimesheet && Boolean(employeeId) && !timesheetReady)}>
              {isPending ? 'Đang xử lý...' : 'Tạo bảng lương'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type TimesheetPanelProps = {
  employeeId: string
  period: { year: number; month: number }
  isClosed: boolean
  isLoading: boolean
  isError: boolean
  payableDays: number | null
  /** undefined while not loaded; null when the month has no complete ACTIVE calendar. */
  standardDays: number | null | undefined
  baseSalary: number
}

/** Shows where the base salary comes from, or why it cannot be computed yet. */
function TimesheetPanel({ employeeId, period, isClosed, isLoading, isError, payableDays, standardDays, baseSalary }: TimesheetPanelProps) {
  const timesheetHref = `/admin/attendance/timesheet/${employeeId}?year=${period.year}&month=${period.month}`
  let body: React.ReactNode
  let tone = 'border-border bg-muted/30'
  if (!employeeId) {
    body = <p className="text-muted-foreground">Chọn nhân viên để lấy ngày công từ bảng công tháng.</p>
  } else if (!isClosed) {
    tone = 'border-amber-300 bg-amber-50 text-amber-900'
    body = <p>Tháng {period.month}/{period.year} chưa kết thúc. Chỉ tạo bảng lương theo bảng công sau ngày cuối cùng của tháng.</p>
  } else if (isLoading) {
    body = <Skeleton className="h-10 w-full" />
  } else if (isError) {
    tone = 'border-destructive/30 bg-destructive/5 text-destructive'
    body = <p>Không thể tải bảng công của nhân viên cho kỳ này.</p>
  } else if (standardDays === null) {
    tone = 'border-amber-300 bg-amber-50 text-amber-900'
    body = <p>Tháng này chưa có lịch làm việc được kích hoạt đầy đủ nên chưa xác định được ngày công chuẩn.</p>
  } else if (standardDays !== undefined && payableDays !== null) {
    body = (
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Ngày công hưởng lương / ngày công chuẩn</p>
          <p className="text-base font-semibold tabular-nums text-foreground">{payableDays} / {standardDays}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">Lương cơ bản tạm tính</p>
          <p className="text-base font-semibold tabular-nums text-foreground">{formatCurrency(baseSalary)}</p>
        </div>
      </div>
    )
  }
  return (
    <div className={cn('grid gap-2 rounded-lg border p-3 text-sm', tone)} aria-live="polite">
      {body}
      {employeeId ? (
        <Link to={timesheetHref} className="w-fit text-xs font-medium text-primary underline-offset-4 hover:underline">
          Xem bảng công chi tiết
        </Link>
      ) : null}
    </div>
  )
}

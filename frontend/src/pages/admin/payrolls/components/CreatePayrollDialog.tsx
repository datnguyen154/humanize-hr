import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import { useEmployeesQuery } from '@/features/employee'
import { useCreatePayrollMutation } from '@/features/payroll'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ApiErrorResponse } from '@/shared/types'

const createPayrollSchema = z.object({
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  month: z.coerce
    .number({ invalid_type_error: 'Tháng phải là số' })
    .min(1, 'Tháng phải từ 1 đến 12')
    .max(12, 'Tháng phải từ 1 đến 12'),
  year: z.coerce
    .number({ invalid_type_error: 'Năm phải là số' })
    .min(2000, 'Năm phải từ 2000 trở đi'),
  baseSalary: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z
      .number({
        required_error: 'Vui lòng nhập lương cơ bản',
        invalid_type_error: 'Lương cơ bản phải là số',
      })
      .min(0, 'Lương cơ bản không được âm'),
  ),
  bonus: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
    z
      .number({ invalid_type_error: 'Thưởng phải là số' })
      .min(0, 'Thưởng không được âm'),
  ),
  deduction: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
    z
      .number({ invalid_type_error: 'Khấu trừ phải là số' })
      .min(0, 'Khấu trừ không được âm'),
  ),
  note: z.string().optional(),
})

type CreatePayrollFormValues = z.infer<typeof createPayrollSchema>

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

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 409) {
      return 'Bảng lương cho nhân viên này trong tháng/năm đã chọn đã tồn tại.'
    }
    if (error.response?.status === 404) {
      return 'Không tìm thấy thông tin nhân viên.'
    }
    const message = (error.response?.data as ApiErrorResponse | undefined)?.message
    return message ?? 'Không thể tạo bảng lương. Vui lòng kiểm tra lại thông tin.'
  }
  return 'Không thể tạo bảng lương. Vui lòng thử lại sau.'
}

export function CreatePayrollDialog({ open, onOpenChange }: CreatePayrollDialogProps) {
  const createPayrollMutation = useCreatePayrollMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const employeesQuery = useEmployeesQuery({
    page: 1,
    limit: 100,
    status: 'ACTIVE',
  })
  const employees = employeesQuery.data?.data ?? []

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreatePayrollFormValues>({
    resolver: zodResolver(createPayrollSchema),
    defaultValues: {
      employeeId: '',
      month: currentMonth,
      year: currentYear,
      baseSalary: '' as unknown as number,
      bonus: 0,
      deduction: 0,
      note: '',
    },
  })

  const [baseSalary, bonus, deduction] = useWatch({
    control,
    name: ['baseSalary', 'bonus', 'deduction'],
  })

  const calculatedNetSalary = Math.max(
    0,
    (Number(baseSalary) || 0) + (Number(bonus) || 0) - (Number(deduction) || 0),
  )

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
    try {
      await createPayrollMutation.mutateAsync({
        employeeId: values.employeeId,
        month: values.month,
        year: values.year,
        baseSalary: values.baseSalary,
        bonus: values.bonus,
        deduction: values.deduction,
        note: values.note?.trim() || null,
      })

      showSuccessToast('Bảng lương mới đã được tạo thành công.')
      reset()
      onOpenChange(false)
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      setFormError(errorMsg)
      showErrorToast()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo bảng lương mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin lương hàng tháng cho nhân viên. Các trường có dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          {formError ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="employeeId" className="text-sm font-medium">
              Nhân viên <span className="text-destructive">*</span>
            </Label>
            <select
              id="employeeId"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              {...register('employeeId')}
            >
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
              <select
                id="month"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                {...register('month')}
              >
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
              <Input
                id="year"
                type="number"
                className="h-10"
                {...register('year')}
              />
              {errors.year ? (
                <p className="text-xs text-destructive">{errors.year.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="baseSalary" className="text-sm font-medium">
              Lương cơ bản (VNĐ) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="baseSalary"
              type="number"
              min={0}
              step="any"
              placeholder="0"
              className="h-10"
              onFocus={handleInputFocus}
              {...register('baseSalary')}
            />
            {errors.baseSalary ? (
              <p className="text-xs text-destructive">{errors.baseSalary.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bonus" className="text-sm font-medium">
                Thưởng (VNĐ)
              </Label>
              <Input
                id="bonus"
                type="number"
                min={0}
                step="any"
                placeholder="0"
                className="h-10"
                onFocus={handleInputFocus}
                {...register('bonus')}
              />
              {errors.bonus ? (
                <p className="text-xs text-destructive">{errors.bonus.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deduction" className="text-sm font-medium">
                Khấu trừ (VNĐ)
              </Label>
              <Input
                id="deduction"
                type="number"
                min={0}
                step="any"
                placeholder="0"
                className="h-10"
                onFocus={handleInputFocus}
                {...register('deduction')}
              />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={createPayrollMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createPayrollMutation.isPending}
            >
              {createPayrollMutation.isPending ? 'Đang xử lý...' : 'Tạo bảng lương'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

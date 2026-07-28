import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import {
  useUpdatePayrollMutation,
  type Payroll,
  type PayrollMutationResult,
} from '@/features/payroll'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ApiErrorResponse } from '@/shared/types'

const editPayrollSchema = z.object({
  baseSalary: z.coerce
    .number({ message: 'Lương cơ bản phải là số' })
    .min(0, 'Lương cơ bản không được âm'),
  bonus: z.coerce
    .number({ message: 'Thưởng phải là số' })
    .min(0, 'Thưởng không được âm'),
  deduction: z.coerce
    .number({ message: 'Khấu trừ phải là số' })
    .min(0, 'Khấu trừ không được âm'),
  note: z.string().optional(),
})

type EditPayrollFormInput = z.input<typeof editPayrollSchema>
type EditPayrollFormValues = z.output<typeof editPayrollSchema>

type EditPayrollDialogProps = {
  payroll: Payroll
  open: boolean
  onOpenChange: (open: boolean) => void
  onPayrollUpdated: (payroll: PayrollMutationResult) => void
}

const toNumber = (value: number | string) => {
  const numericValue = typeof value === 'number' ? value : Number(value)

  return Number.isNaN(numericValue) ? 0 : numericValue
}

const formatCurrency = (amount: number | string) => {
  const numericValue = typeof amount === 'number' ? amount : Number(amount)
  if (Number.isNaN(numericValue)) return '0 ₫'

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numericValue)
}

const getUpdatePayrollErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 400) {
      const message = (error.response?.data as ApiErrorResponse | undefined)
        ?.message

      if (message === 'Published payroll cannot be updated') {
        return 'Bảng lương đã phát hành không thể chỉnh sửa.'
      }

      return message ?? 'Không thể cập nhật bảng lương. Vui lòng kiểm tra lại thông tin.'
    }

    if (error.response?.status === 404) {
      return 'Không tìm thấy bảng lương.'
    }
  }

  return 'Không thể cập nhật bảng lương. Vui lòng thử lại sau.'
}

export function EditPayrollDialog({
  payroll,
  open,
  onOpenChange,
  onPayrollUpdated,
}: EditPayrollDialogProps) {
  const updatePayrollMutation = useUpdatePayrollMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditPayrollFormInput, unknown, EditPayrollFormValues>({
    resolver: zodResolver(editPayrollSchema),
    defaultValues: {
      baseSalary: toNumber(payroll.baseSalary),
      bonus: toNumber(payroll.bonus),
      deduction: toNumber(payroll.deduction),
      note: payroll.note ?? '',
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    reset({
      baseSalary: toNumber(payroll.baseSalary),
      bonus: toNumber(payroll.bonus),
      deduction: toNumber(payroll.deduction),
      note: payroll.note ?? '',
    })
  }, [open, payroll, reset])

  const [baseSalary, bonus, deduction] = useWatch({
    control,
    name: ['baseSalary', 'bonus', 'deduction'],
  })

  const previewNetSalary =
    (Number(baseSalary) || 0) + (Number(bonus) || 0) - (Number(deduction) || 0)

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (updatePayrollMutation.isPending) {
      return
    }

    if (!nextOpen) {
      setFormError(null)
      reset({
        baseSalary: toNumber(payroll.baseSalary),
        bonus: toNumber(payroll.bonus),
        deduction: toNumber(payroll.deduction),
        note: payroll.note ?? '',
      })
    }

    onOpenChange(nextOpen)
  }

  const onSubmit = async (values: EditPayrollFormValues) => {
    setFormError(null)

    try {
      const updatedPayroll = await updatePayrollMutation.mutateAsync({
        id: payroll.id,
        payload: {
          baseSalary: values.baseSalary,
          bonus: values.bonus,
          deduction: values.deduction,
          note: values.note?.trim() || null,
        },
      })

      onPayrollUpdated(updatedPayroll)
      showSuccessToast('Bảng lương đã được cập nhật thành công.')
      onOpenChange(false)
    } catch (error) {
      const errorMessage = getUpdatePayrollErrorMessage(error)
      setFormError(errorMessage)
      showErrorToast(errorMessage, 'Cập nhật bảng lương thất bại')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa bảng lương</DialogTitle>
          <DialogDescription>
            Cập nhật các khoản lương cho bảng lương nháp. Hệ thống sẽ tự tính
            lại thực nhận sau khi lưu.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 py-2" onSubmit={handleSubmit(onSubmit)}>
          {formError ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Nhân viên
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {payroll.employee.fullName} ({payroll.employee.employeeCode})
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Kỳ lương: Tháng {payroll.month}/{payroll.year}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-baseSalary">
              Lương cơ bản (VNĐ) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-baseSalary"
              type="number"
              min={0}
              step="any"
              {...register('baseSalary')}
            />
            {errors.baseSalary ? (
              <p className="text-xs text-destructive">
                {errors.baseSalary.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-bonus">Thưởng (VNĐ)</Label>
              <Input
                id="edit-bonus"
                type="number"
                min={0}
                step="any"
                {...register('bonus')}
              />
              {errors.bonus ? (
                <p className="text-xs text-destructive">
                  {errors.bonus.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-deduction">Khấu trừ (VNĐ)</Label>
              <Input
                id="edit-deduction"
                type="number"
                min={0}
                step="any"
                {...register('deduction')}
              />
              {errors.deduction ? (
                <p className="text-xs text-destructive">
                  {errors.deduction.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Thực nhận dự kiến
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(previewNetSalary)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Công thức: Lương cơ bản + Thưởng - Khấu trừ
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-note">Ghi chú</Label>
            <textarea
              id="edit-note"
              rows={3}
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
              disabled={updatePayrollMutation.isPending}
              onClick={() => handleDialogOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={updatePayrollMutation.isPending}>
              {updatePayrollMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {updatePayrollMutation.isPending
                ? 'Đang lưu...'
                : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

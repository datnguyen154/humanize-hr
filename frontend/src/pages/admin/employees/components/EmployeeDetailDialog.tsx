import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

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
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
import {
  employeeStatusLabel,
  formatEmployeeDate,
  useEmployeeDetailQuery,
  useUpdateEmployeeMutation,
  type EmployeeStatus,
} from '@/features/employee'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

import {
  employeeEditSchema,
  emptyEmployeeEditFormValues,
  toEmployeeEditFormValues,
  toUpdateEmployeeRequest,
  type EmployeeEditFormValues,
} from '../employee-edit-form'

type EmployeeDetailDialogProps = {
  employeeId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const employeeStatusTone: Record<EmployeeStatus, StatusBadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
}

type DetailFieldProps = {
  label: string
  value: React.ReactNode
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/20 p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  )
}

export function EmployeeDetailDialog({
  employeeId,
  open,
  onOpenChange,
}: EmployeeDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const employeeQuery = useEmployeeDetailQuery(employeeId ?? '')
  const updateEmployeeMutation = useUpdateEmployeeMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeEditFormValues>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: emptyEmployeeEditFormValues,
  })

  const employee = employeeQuery.data

  useEffect(() => {
    if (open && employee) {
      reset(toEmployeeEditFormValues(employee))
    }
  }, [employee, open, reset])

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (updateEmployeeMutation.isPending) {
      return
    }

    if (!nextOpen) {
      setIsEditing(false)
      reset(emptyEmployeeEditFormValues)
    }

    onOpenChange(nextOpen)
  }

  const handleCancelEdit = () => {
    if (employee) {
      reset(toEmployeeEditFormValues(employee))
    }

    setIsEditing(false)
  }

  const onSubmit = async (values: EmployeeEditFormValues) => {
    if (!employeeId) {
      return
    }

    try {
      await updateEmployeeMutation.mutateAsync({
        id: employeeId,
        payload: toUpdateEmployeeRequest(values),
      })
      showSuccessToast('Thông tin nhân viên đã được cập nhật.')
      setIsEditing(false)
    } catch {
      showErrorToast(
        'Vui lòng kiểm tra lại thông tin và thử lại.',
        'Cập nhật nhân viên thất bại',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Sửa thông tin nhân viên' : 'Chi tiết nhân viên'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cập nhật thông tin hồ sơ nhân viên.'
              : 'Xem thông tin hồ sơ và trạng thái làm việc của nhân viên.'}
          </DialogDescription>
        </DialogHeader>

        {employeeQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-full max-w-48" />
              </div>
            ))}
          </div>
        ) : null}

        {employeeQuery.isError ? (
          <div className="grid justify-items-center gap-3 py-8 text-center">
            <p className="text-sm text-destructive">
              Không thể tải thông tin nhân viên
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void employeeQuery.refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : null}

        {employee && !isEditing ? (
          <>
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Mã nhân viên" value={employee.employeeCode} />
              <DetailField label="Họ tên" value={employee.fullName} />
              <DetailField
                label="Email"
                value={<span className="break-all">{employee.email}</span>}
              />
              <DetailField
                label="Số điện thoại"
                value={employee.phone || 'Chưa cập nhật'}
              />
              <DetailField
                label="Phòng ban"
                value={employee.department?.name || 'Chưa có thông tin'}
              />
              <DetailField label="Chức vụ" value={employee.position} />
              <DetailField
                label="Trạng thái"
                value={
                  <StatusBadge
                    label={employeeStatusLabel[employee.status]}
                    tone={employeeStatusTone[employee.status]}
                  />
                }
              />
              <DetailField
                label="Ngày vào làm"
                value={formatEmployeeDate(employee.joinedAt)}
              />
              <DetailField
                label="Ngày tạo"
                value={formatEmployeeDate(employee.createdAt)}
              />
              <DetailField
                label="Ngày cập nhật"
                value={formatEmployeeDate(employee.updatedAt)}
              />
            </dl>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
              >
                Đóng
              </Button>
              <Button type="button" onClick={() => setIsEditing(true)}>
                <Pencil className="size-4" aria-hidden="true" />
                Sửa thông tin
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {employee && isEditing ? (
          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('employeeCode')} />

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Mã nhân viên" value={employee.employeeCode} />
              <DetailField
                label="Phòng ban"
                value={employee.department?.name || 'Chưa có thông tin'}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="dialog-fullName">Họ tên</Label>
                <Input id="dialog-fullName" {...register('fullName')} />
                {errors.fullName ? (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dialog-email">Email</Label>
                <Input
                  id="dialog-email"
                  type="email"
                  {...register('email')}
                />
                {errors.email ? (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dialog-phone">Số điện thoại</Label>
                <Input id="dialog-phone" {...register('phone')} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dialog-position">Chức vụ</Label>
                <Input id="dialog-position" {...register('position')} />
                {errors.position ? (
                  <p className="text-sm text-destructive">
                    {errors.position.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dialog-joinedAt">Ngày vào làm</Label>
                <Input
                  id="dialog-joinedAt"
                  type="date"
                  {...register('joinedAt')}
                />
                {errors.joinedAt ? (
                  <p className="text-sm text-destructive">
                    {errors.joinedAt.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dialog-status">Trạng thái</Label>
                <select
                  id="dialog-status"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  {...register('status')}
                >
                  <option value="ACTIVE">Đang làm việc</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
                {errors.status ? (
                  <p className="text-sm text-destructive">
                    {errors.status.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField
                label="Ngày tạo"
                value={formatEmployeeDate(employee.createdAt)}
              />
              <DetailField
                label="Ngày cập nhật"
                value={formatEmployeeDate(employee.updatedAt)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={updateEmployeeMutation.isPending}
                onClick={handleCancelEdit}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                {updateEmployeeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {updateEmployeeMutation.isPending
                  ? 'Đang lưu...'
                  : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

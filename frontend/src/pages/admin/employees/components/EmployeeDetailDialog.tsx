import { zodResolver } from '@hookform/resolvers/zod'
import { Ban, Loader2, Pencil, UserCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/shared/components/DatePicker'
import { useDepartmentOptionsQuery } from '@/features/department/hooks/useDepartmentOptionsQuery'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
import {
  employeeStatusLabel,
  formatEmployeeDate,
  useEmployeeDetailQuery,
  useUpdateEmployeeMutation,
  useUpdateEmployeeStatusMutation,
  type EmployeeStatus,
} from '@/features/employee'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

import {
  employeeInformationEditSchema,
  emptyEmployeeInformationEditFormValues,
  toEmployeeInformationEditFormValues,
  toUpdateEmployeeInformationRequest,
  type EmployeeInformationEditFormValues,
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
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const employeeQuery = useEmployeeDetailQuery(employeeId ?? '')
  const updateEmployeeMutation = useUpdateEmployeeMutation()
  const updateEmployeeStatusMutation = useUpdateEmployeeStatusMutation()
  const departmentOptionsQuery = useDepartmentOptionsQuery(
    open && Boolean(employeeId),
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeInformationEditFormValues>({
    resolver: zodResolver(employeeInformationEditSchema),
    defaultValues: emptyEmployeeInformationEditFormValues,
  })

  const employee = employeeQuery.data

  useEffect(() => {
    if (open && employee) {
      reset(toEmployeeInformationEditFormValues(employee))
    }
  }, [employee, open, reset])

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (
      updateEmployeeMutation.isPending ||
      updateEmployeeStatusMutation.isPending
    ) {
      return
    }

    if (!nextOpen) {
      setIsEditing(false)
      setIsStatusDialogOpen(false)
      reset(emptyEmployeeInformationEditFormValues)
    }

    onOpenChange(nextOpen)
  }

  const handleCancelEdit = () => {
    if (employee) {
      reset(toEmployeeInformationEditFormValues(employee))
    }

    setIsEditing(false)
  }

  const onSubmit = async (values: EmployeeInformationEditFormValues) => {
    if (!employeeId || !employee) {
      return
    }

    try {
      await updateEmployeeMutation.mutateAsync({
        id: employeeId,
        payload: toUpdateEmployeeInformationRequest(
          values,
          employee.departmentId,
        ),
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

  const handleStatusUpdate = async () => {
    if (!employeeId || !employee) {
      return
    }

    const nextStatus: EmployeeStatus =
      employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    try {
      await updateEmployeeStatusMutation.mutateAsync({
        id: employeeId,
        status: nextStatus,
      })
      showSuccessToast('Cập nhật trạng thái nhân viên thành công')
      setIsStatusDialogOpen(false)
    } catch {
      showErrorToast('Không thể cập nhật trạng thái nhân viên')
    }
  }

  return (
    <>
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
                value={employee.department?.name || 'Chưa phân phòng ban'}
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

            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleDialogOpenChange(false)}
              >
                Đóng
              </Button>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  type="button"
                  variant={
                    employee.status === 'ACTIVE' ? 'destructive' : 'outline'
                  }
                  className="w-full sm:w-auto"
                  onClick={() => setIsStatusDialogOpen(true)}
                >
                  {employee.status === 'ACTIVE' ? (
                    <Ban className="size-4" aria-hidden="true" />
                  ) : (
                    <UserCheck className="size-4" aria-hidden="true" />
                  )}
                  {employee.status === 'ACTIVE'
                    ? 'Tạm ngưng nhân viên'
                    : 'Kích hoạt nhân viên'}
                </Button>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Sửa thông tin
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {employee && isEditing ? (
          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('employeeCode')} />

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Mã nhân viên" value={employee.employeeCode} />
              <div className="grid gap-2">
                <Label htmlFor="dialog-departmentId">Phòng ban</Label>
                <select
                  id="dialog-departmentId"
                  className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  disabled={departmentOptionsQuery.isLoading}
                  {...register('departmentId')}
                >
                  <option value="">Chưa phân phòng ban</option>
                  {departmentOptionsQuery.data?.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {departmentOptionsQuery.isError ? (
                  <p className="text-sm text-destructive">
                    Không thể tải danh sách phòng ban.
                  </p>
                ) : null}
              </div>
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
                <Controller
                  control={control}
                  name="joinedAt"
                  render={({ field }) => (
                    <DatePicker
                      id="dialog-joinedAt"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={Boolean(errors.joinedAt)}
                    />
                  )}
                />
                {errors.joinedAt ? (
                  <p className="text-sm text-destructive">
                    {errors.joinedAt.message}
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

            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={updateEmployeeMutation.isPending}
                onClick={handleCancelEdit}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={updateEmployeeMutation.isPending}
              >
                {updateEmployeeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {updateEmployeeMutation.isPending
                  ? 'Đang lưu...'
                  : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        ) : null}
        </DialogContent>
      </Dialog>

      {employee ? (
        <ConfirmDialog
          open={isStatusDialogOpen}
          title={
            employee.status === 'ACTIVE'
              ? 'Xác nhận tạm ngưng nhân viên'
              : 'Xác nhận kích hoạt nhân viên'
          }
          description={
            employee.status === 'ACTIVE'
              ? 'Bạn có chắc muốn tạm ngưng nhân viên này không? Nhân viên có thể bị hạn chế truy cập hệ thống.'
              : 'Bạn có chắc muốn kích hoạt lại nhân viên này không?'
          }
          actionLabel={
            employee.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'
          }
          pendingLabel="Đang xử lý..."
          variant={employee.status === 'ACTIVE' ? 'danger' : 'success'}
          isPending={updateEmployeeStatusMutation.isPending}
          onOpenChange={setIsStatusDialogOpen}
          onConfirm={() => void handleStatusUpdate()}
        />
      ) : null}
    </>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { CalendarEditorSnapshot } from '@/features/work-schedule/lib/calendar-exception.editor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  deleteExceptionSchema,
  formatCivilDateVN,
  getExceptionSummaryText,
  parseCalendarExceptionError,
  useDeleteCalendarExceptionMutation,
  type CalendarExceptionDto,
  type DeleteExceptionValues,
} from '@/features/work-schedule'
import { showErrorToast, showSuccessToast } from '@/lib/toast'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  versionId: string
  exception: CalendarExceptionDto | null
  scheduleRevision: number
  onReloadFresh: () => Promise<CalendarEditorSnapshot>
  onRestoreFocus?: () => void
}

export function CalendarExceptionDeleteDialog({
  open,
  onOpenChange,
  versionId,
  exception,
  scheduleRevision,
  onReloadFresh,
  onRestoreFocus,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [revision, setRevision] = useState(scheduleRevision)
  const [conflictError, setConflictError] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'close' | 'reload' | null>(null)
  const submittingRef = useRef(false)
  const deleteMutation = useDeleteCalendarExceptionMutation(versionId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DeleteExceptionValues>({
    resolver: zodResolver(deleteExceptionSchema),
    defaultValues: { reason: '' },
  })

  if (!exception) return null

  const isBusy = isSubmitting || deleteMutation.isPending || isReloading

  const onSubmit = async (values: DeleteExceptionValues) => {
    if (submittingRef.current || deleteMutation.isPending || isReloading || conflictError) return
    submittingRef.current = true
    setServerError(null)
    try {
      await deleteMutation.mutateAsync({
        id: exception.id,
        payload: {
          expectedRevision: revision,
          reason: values.reason.trim(),
        },
      })
      showSuccessToast('Đã xóa ngoại lệ lịch làm việc thành công.')
      onOpenChange(false)
    } catch (error) {
      const parsed = parseCalendarExceptionError(
        error,
        'Không thể xóa ngoại lệ lịch làm việc.',
      )
      setServerError(parsed.message)
      setConflictError(parsed.isRevisionConflict)
      showErrorToast(parsed.message)
    } finally {
      submittingRef.current = false
    }
  }

  const handleClose = () => {
    if (!isBusy) {
      if (isDirty) setConfirmAction('close')
      else onOpenChange(false)
    }
  }

  const reloadLatest = async () => {
    if (isBusy) return
    setIsReloading(true)
    try {
      const fresh = await onReloadFresh()
      setRevision(fresh.scheduleRevision)
      reset({ reason: '' })
      setConflictError(false)
      setServerError(null)
    } catch (error) {
      setServerError(parseCalendarExceptionError(error, 'Không thể tải lại ngoại lệ. Vui lòng thử lại.').message)
    } finally { setIsReloading(false) }
  }

  return (
    // Only the topmost dialog owns the focus trap while confirming a discard.
    <Dialog open={open} modal={confirmAction === null} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        onInteractOutside={(event) => { if (confirmAction) event.preventDefault() }}
        onEscapeKeyDown={(event) => { if (confirmAction) event.preventDefault() }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onRestoreFocus?.()
        }}
      >
        <DialogHeader className="border-b border-border p-6 pr-12">
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5 shrink-0" aria-hidden="true" />
            <DialogTitle>Xóa ngoại lệ lịch làm việc</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Hành động này sẽ xóa ngoại lệ khỏi bản nháp lịch làm việc. Vui lòng nhập lý do xóa để lưu lại vết kiểm toán.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => { void handleSubmit(onSubmit)(event) }} className="p-6">
          <fieldset disabled={isBusy} className="grid gap-4">
            {/* Exception summary box */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <span className="font-semibold text-foreground">Ngoại lệ:</span>{' '}
              <span className="text-foreground">{getExceptionSummaryText(exception)}</span>
              <div className="mt-1 text-muted-foreground">
                Tác động từ: {formatCivilDateVN(exception.firstAffectedDate)}
              </div>
            </div>

            {/* Server Error Alert */}
            {serverError ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-semibold">Lỗi khi xóa ngoại lệ</p>
                  <p className="mt-0.5 opacity-90">{serverError}</p>
                  {conflictError ? <Button type="button" variant="outline" disabled={isBusy} onClick={() => isDirty ? setConfirmAction('reload') : void reloadLatest()}>Tải lại dữ liệu mới nhất</Button> : null}
                </div>
              </div>
            ) : null}

            {/* Reason input */}
            <div className="grid gap-2">
              <Label htmlFor="delete-reason" className="text-sm font-medium">
                Lý do xóa ngoại lệ <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="delete-reason"
                rows={3}
                placeholder="Nhập lý do xóa để phục vụ đối soát và kiểm toán..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={Boolean(errors.reason)}
                {...register('reason')}
              />
              {errors.reason ? (
                <p className="text-xs text-destructive">{errors.reason.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Lý do từ 1 đến 1000 ký tự.
                </p>
              )}
            </div>
          </fieldset>

          <DialogFooter className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isBusy || conflictError}
              className="gap-1.5"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {isBusy ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </DialogFooter>
        </form>
    <ConfirmDialog open={confirmAction !== null} title="Bỏ thay đổi chưa lưu?"
      description="Thông tin đang nhập sẽ bị bỏ. Vui lòng kiểm tra lại ngoại lệ trước khi xác nhận xóa."
      actionLabel="Bỏ thay đổi và tiếp tục"
      onOpenChange={(next) => { if (!next) setConfirmAction(null) }}
      onConfirm={() => {
        const action = confirmAction
        setConfirmAction(null)
        if (action === 'close') onOpenChange(false)
        if (action === 'reload') void reloadLatest()
      }} />
      </DialogContent>
    </Dialog>
  )
}

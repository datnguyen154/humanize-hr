import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { useReviewAttendanceAdjustmentMutation } from '@/features/attendance/hooks/useAttendanceAdjustmentMutations'
import { useAttendanceAdjustmentDetailQuery } from '@/features/attendance/hooks/useAttendanceAdjustmentsQuery'
import { adjustmentStatusLabels, adjustmentStatusTones, formatAttendanceAdjustmentDate, formatAttendanceAdjustmentTime, formatAttendanceAdjustmentTimestamp, getAttendanceAdjustmentError } from '@/features/attendance/lib/attendance-adjustment'
import type { AttendanceAdjustmentDecision } from '@/features/attendance/types/attendance-adjustment.types'
import { showSuccessToast } from '@/lib/toast'

type Props = {
  id: string
  audience: 'ADMIN' | 'EMPLOYEE'
  onClose?: () => void
  onPendingChange?: (pending: boolean) => void
}

export function AttendanceAdjustmentDetails({ id, audience, onClose, onPendingChange }: Props) {
  const query = useAttendanceAdjustmentDetailQuery(id)
  const mutation = useReviewAttendanceAdjustmentMutation()
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<AttendanceAdjustmentDecision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const request = query.data
  const canReview = audience === 'ADMIN' && request?.status === 'PENDING'

  useEffect(() => {
    onPendingChange?.(mutation.isPending)
  }, [mutation.isPending, onPendingChange])

  const submitReview = async () => {
    if (!decision) return
    setError(null)
    try {
      await mutation.mutateAsync({ id, payload: { status: decision, reviewNote: note.trim() || null } })
      setDecision(null)
      showSuccessToast(decision === 'APPROVED' ? 'Đã duyệt yêu cầu điều chỉnh.' : 'Đã từ chối yêu cầu điều chỉnh.')
    } catch (cause) {
      setError(getAttendanceAdjustmentError(cause, 'Không thể xử lý yêu cầu điều chỉnh.'))
      setDecision(null)
    }
  }

  return <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 gap-5 overflow-y-auto p-6">
        {query.isLoading ? <p>Đang tải yêu cầu...</p> : null}
        {query.isError ? <div className="grid justify-items-start gap-2"><p role="alert" className="text-destructive">Không thể tải yêu cầu điều chỉnh.</p><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Thử lại</Button></div> : null}
        {request ? <>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div><p className="text-muted-foreground">Nhân viên</p><p className="font-medium">{request.employee.fullName} ({request.employee.employeeCode})</p></div>
            <div><p className="text-muted-foreground">Ngày chấm công</p><p className="font-medium">{formatAttendanceAdjustmentDate(request.attendanceDate)}</p></div>
            <div><p className="text-muted-foreground">Giờ vào hiện tại khi gửi</p><p>{formatAttendanceAdjustmentTime(request.originalCheckInTime)}</p></div>
            <div><p className="text-muted-foreground">Giờ ra hiện tại khi gửi</p><p>{formatAttendanceAdjustmentTime(request.originalCheckOutTime)}</p></div>
            <div><p className="text-muted-foreground">Giờ vào đề xuất</p><p className="font-medium">{formatAttendanceAdjustmentTime(request.requestedCheckInTime)}</p></div>
            <div><p className="text-muted-foreground">Giờ ra đề xuất</p><p className="font-medium">{formatAttendanceAdjustmentTime(request.requestedCheckOutTime)}</p></div>
            <div><p className="text-muted-foreground">Trạng thái</p><StatusBadge label={adjustmentStatusLabels[request.status]} tone={adjustmentStatusTones[request.status]} /></div>
            <div><p className="text-muted-foreground">Ngày gửi</p><p>{formatAttendanceAdjustmentTimestamp(request.createdAt)}</p></div>
          </div>
          <div><p className="text-sm text-muted-foreground">Lý do</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{request.reason}</p></div>
          {request.status !== 'PENDING' ? <div className="break-words border-t pt-4 text-sm"><p>Người duyệt: {request.reviewer?.fullName ?? 'Chưa có'}</p><p>Ngày duyệt: {request.reviewedAt ? formatAttendanceAdjustmentTimestamp(request.reviewedAt) : 'Chưa có'}</p><p>Ghi chú: {request.reviewNote || 'Không có'}</p></div> : null}
          {canReview ? <div className="grid gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">Chỉ duyệt khi thời gian đề xuất đã được đối chiếu. Dữ liệu chấm công chỉ đổi sau khi duyệt; bảng lương đã phát hành không tự tính lại.</p>
            <Label htmlFor="reviewNote">Ghi chú duyệt (bắt buộc khi từ chối)</Label>
            <textarea id="reviewNote" rows={3} maxLength={1000} disabled={mutation.isPending} value={note} onChange={(event) => setNote(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          </div> : null}
        </> : null}
      </div>
      {onClose || canReview ? <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:px-6">
        {onClose ? <Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Đóng</Button> : <span />}
        {canReview ? <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={mutation.isPending || !note.trim()} onClick={() => setDecision('REJECTED')}>Từ chối</Button><Button disabled={mutation.isPending} onClick={() => setDecision('APPROVED')}>{mutation.isPending ? 'Đang xử lý...' : 'Duyệt yêu cầu'}</Button></div> : null}
      </div> : null}
    <ConfirmDialog open={Boolean(decision)} onOpenChange={(open) => { if (!open) setDecision(null) }} title={decision === 'APPROVED' ? 'Xác nhận duyệt điều chỉnh' : 'Xác nhận từ chối yêu cầu'} description={decision === 'APPROVED' ? 'Dữ liệu chấm công sẽ được cập nhật theo giờ đề xuất. Bạn có chắc chắn?' : 'Yêu cầu sẽ bị từ chối và dữ liệu chấm công không thay đổi. Bạn có chắc chắn?'} actionLabel={decision === 'APPROVED' ? 'Duyệt' : 'Từ chối'} variant={decision === 'APPROVED' ? 'success' : 'danger'} isPending={mutation.isPending} pendingLabel="Đang xử lý..." onConfirm={() => { void submitReview() }} />
  </div>
}

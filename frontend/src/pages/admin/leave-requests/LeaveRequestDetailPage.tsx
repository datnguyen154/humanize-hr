import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CircleDot,
  Clock,
  FileText,
  History,
  IdCard,
  MessageSquareText,
  User,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { AxiosError } from 'axios'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DetailPageSkeleton } from '@/components/ui/skeleton'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
import { useAuthStore } from '@/features/auth'
import { useLeaveRequestDetailQuery } from '@/features/leave-request/hooks/useLeaveRequestsQuery'
import { useLeaveApproversQuery } from '@/features/leave-request/hooks/useLeaveApproversQuery'
import { useUpdateLeaveRequestApproverMutation } from '@/features/leave-request/hooks/useUpdateLeaveRequestApproverMutation'
import { useUpdateLeaveRequestStatusMutation } from '@/features/leave-request/hooks/useUpdateLeaveRequestStatusMutation'
import type {
  LeaveRequestReviewStatus,
  LeaveRequestStatus,
  LeaveType,
} from '@/features/leave-request/types/leaveRequest.types'
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from '@/lib/toast'
import type { ApiErrorResponse } from '@/shared/types'

const leaveTypeLabel: Record<LeaveType, string> = {
  ANNUAL: 'Nghỉ phép năm',
  SICK: 'Nghỉ ốm',
  UNPAID: 'Nghỉ không lương',
  OTHER: 'Khác',
}

const statusLabel: Record<LeaveRequestStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
}

const statusTone: Record<LeaveRequestStatus, StatusBadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN').format(new Date(date))

const getReassignErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as ApiErrorResponse | undefined)
      ?.message

    if (message === 'Only pending leave requests can be reassigned') {
      return 'Chỉ đơn đang chờ duyệt mới có thể đổi người duyệt.'
    }

    if (message === 'Invalid approverId') {
      return 'Người duyệt không hợp lệ.'
    }

    if (message === 'Approver not found') {
      return 'Không tìm thấy người duyệt đã chọn.'
    }

    if (message === 'Approver is not eligible') {
      return 'Người duyệt đã chọn hiện không khả dụng.'
    }
  }

  return 'Không thể cập nhật người duyệt. Vui lòng thử lại.'
}

type DetailFieldProps = {
  icon: LucideIcon
  label: string
  children: ReactNode
}

function DetailField({ icon: Icon, label, children }: DetailFieldProps) {
  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words text-sm font-medium text-foreground">
          {children}
        </dd>
      </div>
    </div>
  )
}

type LeaveRequestDetailPageProps = {
  backPath?: string
}

export function LeaveRequestDetailPage({
  backPath = '/admin/leave-requests',
}: LeaveRequestDetailPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const leaveRequestQuery = useLeaveRequestDetailQuery(id ?? '')
  const updateStatusMutation = useUpdateLeaveRequestStatusMutation()
  const updateApproverMutation = useUpdateLeaveRequestApproverMutation()
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false)
  const [selectedApproverId, setSelectedApproverId] = useState('')
  const [reassignError, setReassignError] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [pendingReviewStatus, setPendingReviewStatus] =
    useState<LeaveRequestReviewStatus | null>(null)
  const leaveRequest = leaveRequestQuery.data
  const isEmployeeView = backPath.startsWith('/employee/')
  const isPending = leaveRequest?.status === 'PENDING'
  const isAssignedApprover =
    user?.role === 'ADMIN' && user.id === leaveRequest?.approverId
  const canReview = !isEmployeeView && isPending && isAssignedApprover
  const canReassign = !isEmployeeView && isPending
  const approversQuery = useLeaveApproversQuery(isReassignDialogOpen)

  const openReassignDialog = () => {
    setSelectedApproverId(leaveRequest?.approverId ?? '')
    setReassignError(null)
    setIsReassignDialogOpen(true)
  }

  const handleReassign = async () => {
    if (!id || !selectedApproverId || selectedApproverId === leaveRequest?.approverId) {
      return
    }

    setReassignError(null)

    try {
      await updateApproverMutation.mutateAsync({
        id,
        payload: { approverId: selectedApproverId },
      })
      showSuccessToast(
        leaveRequest?.approverId
          ? 'Đã cập nhật người duyệt.'
          : 'Đã phân công người duyệt.',
      )
      setIsReassignDialogOpen(false)
    } catch (error) {
      const errorMessage = getReassignErrorMessage(error)
      setReassignError(errorMessage)
      showErrorToast(errorMessage)
    }
  }

  const handleReview = async (status: LeaveRequestReviewStatus) => {
    if (!id) {
      return
    }

    setApprovalError(null)

    try {
      await updateStatusMutation.mutateAsync({
        id,
        payload: {
          status,
          reviewNote: reviewNote.trim(),
        },
      })
      if (status === 'APPROVED') {
        showSuccessToast('Đơn nghỉ phép đã được duyệt.')
      } else {
        showWarningToast('Đơn nghỉ phép đã bị từ chối.')
      }
      setReviewNote('')
      setPendingReviewStatus(null)
    } catch (error) {
      const isForbidden =
        error instanceof AxiosError && error.response?.status === 403
      const errorMessage = isForbidden
        ? 'Bạn không được phân công xử lý đơn nghỉ phép này.'
        : 'Cập nhật trạng thái đơn nghỉ phép thất bại'

      setApprovalError(errorMessage)
      showErrorToast(errorMessage)
    }
  }

  return (
    <section className="grid gap-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="group inline-flex w-fit cursor-pointer items-center gap-2 rounded-md bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
        onClick={() => navigate(backPath)}
      >
        <ArrowLeft
          className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        Quay lại danh sách
      </Button>

      {leaveRequestQuery.isLoading ? (
        <DetailPageSkeleton
          cards={3}
          fieldsPerCard={4}
          columnsClassName="xl:grid-cols-3"
        />
      ) : null}

      {leaveRequestQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Không thể tải thông tin đơn nghỉ phép
          </CardContent>
        </Card>
      ) : null}

      {leaveRequest ? (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/5">
                    <FileText className="size-9" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        {isEmployeeView
                          ? leaveTypeLabel[leaveRequest.leaveType]
                          : leaveRequest.employee.fullName}
                      </h2>
                      <StatusBadge
                        label={statusLabel[leaveRequest.status]}
                        tone={statusTone[leaveRequest.status]}
                        className="ring-1 ring-current/10"
                      />
                    </div>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {isEmployeeView
                        ? `Đơn của ${leaveRequest.employee.fullName}`
                        : leaveTypeLabel[leaveRequest.leaveType]}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span>
                        Mã nhân viên:{' '}
                        <span className="font-medium text-foreground">
                          {leaveRequest.employee.employeeCode}
                        </span>
                      </span>
                      <span>
                        Thời gian nghỉ:{' '}
                        <span className="font-medium text-foreground">
                          {formatDate(leaveRequest.startDate)} -{' '}
                          {formatDate(leaveRequest.endDate)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {canReassign ? (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap xl:justify-end">
                    {canReview ? (
                      <>
                        <Button
                          type="button"
                          className="w-full sm:w-auto"
                          disabled={updateStatusMutation.isPending}
                          onClick={() => setPendingReviewStatus('APPROVED')}
                        >
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          Duyệt đơn
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full sm:w-auto"
                          disabled={updateStatusMutation.isPending}
                          onClick={() => setPendingReviewStatus('REJECTED')}
                        >
                          <XCircle className="size-4" aria-hidden="true" />
                          Từ chối
                        </Button>
                      </>
                    ) : (
                      <p className="max-w-sm rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
                        {leaveRequest.approverId
                          ? 'Đơn này được phân công cho người duyệt khác.'
                          : 'Đơn chưa được phân công người duyệt.'}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={openReassignDialog}
                    >
                      {leaveRequest.approverId
                        ? 'Đổi người duyệt'
                        : 'Phân công người duyệt'}
                    </Button>
                  </div>
                ) : leaveRequest.status !== 'PENDING' ? (
                  <p className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                    Đơn này đã được xử lý.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div
            className={`grid gap-5 ${
              isEmployeeView ? 'lg:grid-cols-2' : 'xl:grid-cols-3'
            }`}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Thông tin đơn nghỉ phép
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <DetailField icon={FileText} label="Loại nghỉ phép">
                    {leaveTypeLabel[leaveRequest.leaveType]}
                  </DetailField>
                  <DetailField icon={CalendarDays} label="Ngày bắt đầu">
                    {formatDate(leaveRequest.startDate)}
                  </DetailField>
                  <DetailField icon={CalendarDays} label="Ngày kết thúc">
                    {formatDate(leaveRequest.endDate)}
                  </DetailField>
                  <DetailField icon={MessageSquareText} label="Lý do">
                    {leaveRequest.reason}
                  </DetailField>
                </dl>
              </CardContent>
            </Card>

            {!isEmployeeView ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin nhân viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y divide-border">
                    <DetailField icon={User} label="Họ tên">
                      {leaveRequest.employee.fullName}
                    </DetailField>
                    <DetailField icon={IdCard} label="Mã nhân viên">
                      {leaveRequest.employee.employeeCode}
                    </DetailField>
                  </dl>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin xử lý</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <DetailField icon={CircleDot} label="Trạng thái">
                    <StatusBadge
                      label={statusLabel[leaveRequest.status]}
                      tone={statusTone[leaveRequest.status]}
                      className="ring-1 ring-current/10"
                      />
                  </DetailField>
                  <DetailField icon={User} label="Người duyệt được phân công">
                    {leaveRequest.approver ? (
                      <span className="grid gap-0.5">
                        <span>{leaveRequest.approver.fullName}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {leaveRequest.approver.email}
                        </span>
                      </span>
                    ) : (
                      'Chưa phân công'
                    )}
                  </DetailField>
                  <DetailField icon={User} label="Người duyệt">
                    {leaveRequest.reviewer?.fullName ?? 'Chưa có'}
                  </DetailField>
                  <DetailField icon={Clock} label="Ngày duyệt">
                    {leaveRequest.reviewedAt
                      ? formatDate(leaveRequest.reviewedAt)
                      : 'Chưa duyệt'}
                  </DetailField>
                  <DetailField icon={CalendarPlus} label="Ngày tạo">
                    {formatDate(leaveRequest.createdAt)}
                  </DetailField>
                  <DetailField icon={History} label="Ngày cập nhật">
                    {formatDate(leaveRequest.updatedAt)}
                  </DetailField>
                  <DetailField icon={MessageSquareText} label="Ghi chú">
                    {leaveRequest.reviewNote ?? 'Không có ghi chú'}
                  </DetailField>
                </dl>
              </CardContent>
            </Card>
          </div>

          {canReview ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ghi chú xử lý</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {approvalError ? (
                  <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {approvalError}
                  </p>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="reviewNote" className="text-sm font-medium">
                    Ghi chú duyệt/từ chối
                  </Label>
                  <textarea
                    id="reviewNote"
                    value={reviewNote}
                    placeholder="Nhập ghi chú xử lý nếu cần..."
                    className="min-h-28 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    onChange={(event) => setReviewNote(event.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Dialog
            open={isReassignDialogOpen}
            onOpenChange={(open) => {
              if (!updateApproverMutation.isPending) {
                setIsReassignDialogOpen(open)
                if (!open) {
                  setReassignError(null)
                }
              }
            }}
          >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {leaveRequest.approverId
                    ? 'Đổi người duyệt'
                    : 'Phân công người duyệt'}
                </DialogTitle>
                <DialogDescription>
                  Chọn Admin đang hoạt động chịu trách nhiệm xử lý đơn này.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-1.5 rounded-lg bg-muted/60 p-3 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">
                    Người duyệt hiện tại
                  </span>
                  {leaveRequest.approver ? (
                    <>
                      <span className="font-medium text-foreground">
                        {leaveRequest.approver.fullName}
                      </span>
                      <span className="break-all text-muted-foreground">
                        {leaveRequest.approver.email}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium text-foreground">
                      Chưa phân công
                    </span>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="newLeaveRequestApprover">
                    Người duyệt mới <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="newLeaveRequestApprover"
                    value={selectedApproverId}
                    disabled={
                      approversQuery.isLoading ||
                      approversQuery.isError ||
                      updateApproverMutation.isPending
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(event) => setSelectedApproverId(event.target.value)}
                  >
                    <option value="">
                      {approversQuery.isLoading
                        ? 'Đang tải danh sách người duyệt...'
                        : 'Chọn người duyệt'}
                    </option>
                    {approversQuery.data?.map((approver) => (
                      <option key={approver.id} value={approver.id}>
                        {approver.fullName} — {approver.email}
                      </option>
                    ))}
                  </select>

                  {approversQuery.isError ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
                      <span role="alert">Không thể tải danh sách người duyệt.</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void approversQuery.refetch()}
                      >
                        Thử lại
                      </Button>
                    </div>
                  ) : null}
                  {!approversQuery.isLoading &&
                  !approversQuery.isError &&
                  approversQuery.data?.length === 0 ? (
                    <p className="text-sm text-muted-foreground" role="alert">
                      Hiện chưa có người duyệt khả dụng.
                    </p>
                  ) : null}
                  {selectedApproverId === leaveRequest.approverId ? (
                    <p className="text-sm text-muted-foreground" role="status">
                      Đây đã là người duyệt hiện tại.
                    </p>
                  ) : null}
                  {reassignError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {reassignError}
                    </p>
                  ) : null}
                </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={updateApproverMutation.isPending}
                  onClick={() => setIsReassignDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  disabled={
                    !selectedApproverId ||
                    selectedApproverId === leaveRequest.approverId ||
                    approversQuery.isLoading ||
                    approversQuery.isError ||
                    approversQuery.data?.length === 0 ||
                    updateApproverMutation.isPending
                  }
                  onClick={() => void handleReassign()}
                >
                  {updateApproverMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            open={Boolean(pendingReviewStatus)}
            title={
              pendingReviewStatus === 'APPROVED'
                ? 'Xác nhận duyệt đơn'
                : 'Xác nhận từ chối đơn'
            }
            description={
              pendingReviewStatus === 'APPROVED'
                ? 'Đơn nghỉ phép sẽ được chuyển sang trạng thái đã duyệt.'
                : 'Hành động này không thể hoàn tác.'
            }
            actionLabel={
              pendingReviewStatus === 'APPROVED' ? 'Duyệt đơn' : 'Từ chối'
            }
            variant={pendingReviewStatus === 'APPROVED' ? 'success' : 'danger'}
            isPending={updateStatusMutation.isPending}
            onOpenChange={(open) => {
              if (!open) {
                setPendingReviewStatus(null)
              }
            }}
            onConfirm={() => {
              if (pendingReviewStatus) {
                void handleReview(pendingReviewStatus)
              }
            }}
          />
        </>
      ) : null}
    </section>
  )
}

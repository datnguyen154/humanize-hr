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
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Label } from '@/components/ui/label'
import { DetailPageSkeleton } from '@/components/ui/skeleton'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
import { useAuthStore } from '@/features/auth'
import { useLeaveRequestDetailQuery } from '@/features/leave-request/hooks/useLeaveRequestsQuery'
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
  const [reviewNote, setReviewNote] = useState('')
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [pendingReviewStatus, setPendingReviewStatus] =
    useState<LeaveRequestReviewStatus | null>(null)
  const leaveRequest = leaveRequestQuery.data
  const isEmployeeView = backPath.startsWith('/employee/')
  const canReview = user?.role === 'ADMIN' && leaveRequest?.status === 'PENDING'

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
    } catch {
      setApprovalError('Cập nhật trạng thái đơn nghỉ phép thất bại')
      showErrorToast()
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

                {canReview ? (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap xl:justify-end">
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

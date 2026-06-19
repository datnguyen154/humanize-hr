import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth'
import { useLeaveRequestDetailQuery } from '@/features/leave-request/hooks/useLeaveRequestsQuery'
import { useUpdateLeaveRequestStatusMutation } from '@/features/leave-request/hooks/useUpdateLeaveRequestStatusMutation'
import type {
  LeaveRequestReviewStatus,
  LeaveRequestStatus,
  LeaveType,
} from '@/features/leave-request/types/leaveRequest.types'

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

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN').format(new Date(date))

type DetailItem = {
  label: string
  value: string
}

type DetailSectionProps = {
  title: string
  items: DetailItem[]
}

function DetailSection({ title, items }: DetailSectionProps) {
  return (
    <section className="grid gap-3 border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <dl className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 font-medium text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
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
  const leaveRequest = leaveRequestQuery.data
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
      setReviewNote('')
    } catch {
      setApprovalError('Cập nhật trạng thái đơn nghỉ phép thất bại')
    }
  }

  const sections: DetailSectionProps[] = leaveRequest
    ? [
        {
          title: 'Thông tin nhân viên',
          items: [
            {
              label: 'Mã nhân viên',
              value: leaveRequest.employee.employeeCode,
            },
            { label: 'Họ tên', value: leaveRequest.employee.fullName },
          ],
        },
        {
          title: 'Thông tin nghỉ phép',
          items: [
            {
              label: 'Loại nghỉ phép',
              value: leaveTypeLabel[leaveRequest.leaveType],
            },
            {
              label: 'Ngày bắt đầu',
              value: formatDate(leaveRequest.startDate),
            },
            {
              label: 'Ngày kết thúc',
              value: formatDate(leaveRequest.endDate),
            },
            { label: 'Lý do', value: leaveRequest.reason },
            {
              label: 'Trạng thái',
              value: statusLabel[leaveRequest.status],
            },
          ],
        },
        {
          title: 'Thông tin duyệt',
          items: [
            {
              label: 'Người duyệt',
              value: leaveRequest.reviewer?.fullName ?? 'Chưa có',
            },
            {
              label: 'Ngày duyệt',
              value: leaveRequest.reviewedAt
                ? formatDate(leaveRequest.reviewedAt)
                : 'Chưa duyệt',
            },
            {
              label: 'Ghi chú duyệt',
              value: leaveRequest.reviewNote ?? 'Không có ghi chú',
            },
          ],
        },
        {
          title: 'Thông tin hệ thống',
          items: [
            {
              label: 'Ngày tạo',
              value: formatDate(leaveRequest.createdAt),
            },
            {
              label: 'Ngày cập nhật',
              value: formatDate(leaveRequest.updatedAt),
            },
          ],
        },
      ]
    : []

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Chi tiết đơn nghỉ phép
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem thông tin đơn nghỉ phép và kết quả duyệt.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(backPath)}
        >
          Quay lại danh sách
        </Button>
      </div>

      <Card>
        <CardContent>
          {leaveRequestQuery.isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              Đang tải thông tin đơn nghỉ phép...
            </p>
          ) : null}

          {leaveRequestQuery.isError ? (
            <p className="py-8 text-center text-destructive">
              Không thể tải thông tin đơn nghỉ phép
            </p>
          ) : null}

          {leaveRequest
            ? sections.map((section) => (
                <DetailSection key={section.title} {...section} />
              ))
            : null}
        </CardContent>
      </Card>

      {canReview ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Duyệt đơn nghỉ phép</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {approvalError ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {approvalError}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="reviewNote">Ghi chú duyệt</Label>
              <textarea
                id="reviewNote"
                value={reviewNote}
                className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onChange={(event) => setReviewNote(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                disabled={updateStatusMutation.isPending}
                onClick={() => handleReview('APPROVED')}
              >
                Duyệt đơn
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={updateStatusMutation.isPending}
                onClick={() => handleReview('REJECTED')}
              >
                Từ chối
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}

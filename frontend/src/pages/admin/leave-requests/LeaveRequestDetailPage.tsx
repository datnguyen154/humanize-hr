import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLeaveRequestDetailQuery } from '@/features/leave-request/hooks/useLeaveRequestsQuery'
import type {
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

export function LeaveRequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const leaveRequestQuery = useLeaveRequestDetailQuery(id ?? '')
  const leaveRequest = leaveRequestQuery.data

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
          onClick={() => navigate('/admin/leave-requests')}
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
    </section>
  )
}

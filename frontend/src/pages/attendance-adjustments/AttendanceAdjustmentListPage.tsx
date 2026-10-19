import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardClock, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { useAttendanceAdjustmentsQuery } from '@/features/attendance/hooks/useAttendanceAdjustmentsQuery'
import { adjustmentStatusLabels, adjustmentStatusTones, formatAttendanceAdjustmentDate, formatAttendanceAdjustmentTimestamp } from '@/features/attendance/lib/attendance-adjustment'
import type { AttendanceAdjustmentStatus } from '@/features/attendance/types/attendance-adjustment.types'
import { AttendanceAdjustmentDetailDialog } from './components/AttendanceAdjustmentDetailDialog'
import { CreateAttendanceAdjustmentDialog } from './components/CreateAttendanceAdjustmentDialog'

type Props = { audience: 'ADMIN' | 'EMPLOYEE' }

export function AttendanceAdjustmentListPage({ audience }: Props) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<AttendanceAdjustmentStatus | 'ALL'>(audience === 'ADMIN' ? 'PENDING' : 'ALL')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const createTrigger = useRef<HTMLButtonElement | null>(null)
  const requestTrigger = useRef<HTMLButtonElement | null>(null)
  const backLink = useRef<HTMLAnchorElement | null>(null)
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedSearch(search.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [search])
  const query = useAttendanceAdjustmentsQuery({
    page, limit: 10,
    status: status === 'ALL' ? undefined : status,
    search: audience === 'ADMIN' ? appliedSearch || undefined : undefined,
  })
  const items = query.data?.data ?? []
  const meta = query.data?.meta

  return <section className="grid gap-5">
    <Link ref={backLink} to={audience === 'ADMIN' ? '/admin/attendance' : '/employee/attendance'} className="inline-flex w-fit items-center gap-2 rounded-md py-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><ArrowLeft className="size-4" aria-hidden="true" />{audience === 'ADMIN' ? 'Quay lại danh sách chấm công' : 'Quay lại lịch sử chấm công'}</Link>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Yêu cầu điều chỉnh chấm công</h1>
        <p className="mt-1 text-sm text-muted-foreground">{audience === 'ADMIN' ? 'Xem và xử lý các yêu cầu của nhân viên.' : 'Theo dõi các yêu cầu của bạn.'}</p>
      </div>
      {audience === 'EMPLOYEE' ? <Button ref={createTrigger} type="button" aria-haspopup="dialog" onClick={() => setIsCreateOpen(true)}><Plus className="size-4" /> Gửi yêu cầu</Button> : null}
    </div>
    <Card className="border-border shadow-sm">
      <CardHeader><CardTitle className="text-lg">Danh sách yêu cầu</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-3">
          {audience === 'ADMIN' ? <input aria-label="Tìm nhân viên" placeholder="Tìm theo tên hoặc mã nhân viên" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm sm:max-w-xs" /> : null}
          <select aria-label="Lọc trạng thái" value={status} onChange={(event) => { setStatus(event.target.value as AttendanceAdjustmentStatus | 'ALL'); setPage(1) }} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
        {query.isLoading ? <p className="py-8 text-center text-muted-foreground">Đang tải yêu cầu...</p> : null}
        {query.isError ? <p className="py-8 text-center text-destructive">Không thể tải danh sách yêu cầu.</p> : null}
        {query.isSuccess && items.length === 0 ? <EmptyState icon={ClipboardClock} title="Chưa có yêu cầu nào" description="Các yêu cầu điều chỉnh sẽ hiển thị tại đây." /> : null}
        {items.length > 0 ? <div className="grid gap-2">
          {items.map((item) => {
            const content = <>
            <div className="min-w-0 break-words"><p className="font-medium text-foreground">{audience === 'ADMIN' ? `${item.employee.fullName} (${item.employee.employeeCode})` : `Ngày ${formatAttendanceAdjustmentDate(item.attendanceDate)}`}</p>
              <p className="text-sm text-muted-foreground">{audience === 'ADMIN' ? `Ngày chấm công: ${formatAttendanceAdjustmentDate(item.attendanceDate)} · ` : ''}Gửi: {formatAttendanceAdjustmentTimestamp(item.createdAt)}</p>
            </div>
            <StatusBadge label={adjustmentStatusLabels[item.status]} tone={adjustmentStatusTones[item.status]} />
            </>
            const className = 'flex w-full min-w-0 flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'
            return <button key={item.id} type="button" className={className} aria-haspopup="dialog" onClick={(event) => { requestTrigger.current = event.currentTarget; setSelectedRequestId(item.id) }}>{content}</button>
          })}
        </div> : null}
        {meta && meta.totalItems > 0 ? <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 pr-16 sm:pr-40">
          <p className="text-sm text-muted-foreground">Tổng số {meta.totalItems} yêu cầu</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Trang trước" disabled={!meta.hasPreviousPage} onClick={() => setPage((current) => current - 1)}><ChevronLeft className="size-4" /></Button>
            <span className="text-sm">Trang {page} / {meta.totalPages}</span>
            <Button variant="outline" size="icon" aria-label="Trang sau" disabled={!meta.hasNextPage} onClick={() => setPage((current) => current + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div> : null}
      </CardContent>
    </Card>
    {selectedRequestId ? <AttendanceAdjustmentDetailDialog key={selectedRequestId} requestId={selectedRequestId} audience={audience} onClose={() => setSelectedRequestId(null)} onRestoreFocus={() => { (requestTrigger.current?.isConnected ? requestTrigger.current : backLink.current)?.focus() }} /> : null}
    {audience === 'EMPLOYEE' && isCreateOpen ? <CreateAttendanceAdjustmentDialog onClose={() => setIsCreateOpen(false)} onRestoreFocus={() => createTrigger.current?.focus()} /> : null}
  </section>
}

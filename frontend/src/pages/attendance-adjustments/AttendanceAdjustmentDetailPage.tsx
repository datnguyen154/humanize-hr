import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceAdjustmentDetails } from './components/AttendanceAdjustmentDetails'

export function AttendanceAdjustmentDetailPage({ audience }: { audience: 'ADMIN' | 'EMPLOYEE' }) {
  const { id = '' } = useParams()
  const basePath = audience === 'ADMIN' ? '/admin/attendance/adjustments' : '/employee/attendance/adjustments'
  return <section className="mx-auto grid w-full max-w-3xl gap-5">
    <Link to={basePath} className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Quay lại danh sách</Link>
    <Card className="border-border shadow-sm">
      <CardHeader><CardTitle>Chi tiết yêu cầu điều chỉnh chấm công</CardTitle></CardHeader>
      <AttendanceAdjustmentDetails key={id} id={id} audience={audience} />
    </Card>
  </section>
}

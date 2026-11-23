import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceAdjustmentForm } from './components/AttendanceAdjustmentForm'

export function CreateAttendanceAdjustmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const date = searchParams.get('date') ?? ''
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined
  return <section className="mx-auto grid w-full max-w-3xl gap-5">
    <Link to="/employee/attendance/adjustments" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Quay lại danh sách</Link>
    <Card className="border-border shadow-sm">
      <CardHeader><CardTitle>Gửi yêu cầu điều chỉnh chấm công</CardTitle></CardHeader>
      <AttendanceAdjustmentForm initialDate={initialDate} onSuccess={() => navigate('/employee/attendance/adjustments')} />
    </Card>
  </section>
}

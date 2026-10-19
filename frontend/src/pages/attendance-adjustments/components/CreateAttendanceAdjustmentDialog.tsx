import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AttendanceAdjustmentForm } from './AttendanceAdjustmentForm'

type Props = { onClose: () => void; onRestoreFocus: () => void }

export function CreateAttendanceAdjustmentDialog({ onClose, onRestoreFocus }: Props) {
  const [isPending, setIsPending] = useState(false)
  const close = () => { if (!isPending) onClose() }
  return <Dialog open onOpenChange={(open) => { if (!open) close() }}>
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0" onCloseAutoFocus={(event) => { event.preventDefault(); onRestoreFocus() }}>
      <DialogHeader className="shrink-0 border-b border-border p-6 pr-12">
        <DialogTitle>Gửi yêu cầu điều chỉnh chấm công</DialogTitle>
        <DialogDescription>Nhập thời gian đề xuất và lý do để quản trị viên xem xét.</DialogDescription>
      </DialogHeader>
      <AttendanceAdjustmentForm onSuccess={onClose} onClose={close} onPendingChange={setIsPending} />
    </DialogContent>
  </Dialog>
}

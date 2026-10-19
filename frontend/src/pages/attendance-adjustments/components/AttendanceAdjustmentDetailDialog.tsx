import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AttendanceAdjustmentDetails } from './AttendanceAdjustmentDetails'

type Props = { requestId: string; audience: 'ADMIN' | 'EMPLOYEE'; onClose: () => void; onRestoreFocus: () => void }

export function AttendanceAdjustmentDetailDialog({ requestId, audience, onClose, onRestoreFocus }: Props) {
  const [isPending, setIsPending] = useState(false)
  const close = () => { if (!isPending) onClose() }
  return <Dialog open onOpenChange={(open) => { if (!open) close() }}>
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0" onCloseAutoFocus={(event) => { event.preventDefault(); onRestoreFocus() }}>
      <DialogHeader className="shrink-0 border-b border-border p-6 pr-12">
        <DialogTitle>Chi tiết yêu cầu điều chỉnh chấm công</DialogTitle>
        <DialogDescription>{audience === 'ADMIN' ? 'Đối chiếu thông tin và xử lý yêu cầu của nhân viên.' : 'Xem thông tin và kết quả xử lý yêu cầu của bạn.'}</DialogDescription>
      </DialogHeader>
      <AttendanceAdjustmentDetails id={requestId} audience={audience} onClose={close} onPendingChange={setIsPending} />
    </DialogContent>
  </Dialog>
}

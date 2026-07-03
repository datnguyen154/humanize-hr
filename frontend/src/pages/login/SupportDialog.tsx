import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { CircleHelp, Mail, Phone } from 'lucide-react'

import { Button } from '@/components/ui/button'

type SupportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CircleHelp className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 pt-0.5">
              <AlertDialogPrimitive.Title className="text-lg font-semibold text-foreground">
                Cần hỗ trợ tài khoản?
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Vui lòng liên hệ bộ phận IT hoặc quản trị viên để được hỗ trợ
                đăng nhập, đặt lại mật khẩu hoặc cấp quyền truy cập.
              </AlertDialogPrimitive.Description>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <div className="flex min-w-0 items-start gap-3">
              <Mail
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-muted-foreground">Email hỗ trợ</p>
                <p className="break-all font-medium text-foreground">
                  it-support@humanizehr.com
                </p>
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <Phone
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-muted-foreground">Hotline nội bộ</p>
                <p className="font-medium text-foreground">1900 0000</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <AlertDialogPrimitive.Cancel asChild>
              <Button type="button">Đã hiểu</Button>
            </AlertDialogPrimitive.Cancel>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

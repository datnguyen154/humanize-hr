import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import {
  CircleCheck,
  CircleX,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ConfirmDialogVariant = 'warning' | 'success' | 'danger'

const variantConfig: Record<
  ConfirmDialogVariant,
  { icon: LucideIcon; iconClassName: string }
> = {
  warning: {
    icon: TriangleAlert,
    iconClassName: 'bg-amber-50 text-amber-700',
  },
  success: {
    icon: CircleCheck,
    iconClassName: 'bg-emerald-50 text-emerald-700',
  },
  danger: {
    icon: CircleX,
    iconClassName: 'bg-red-50 text-red-700',
  },
}

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  actionLabel: string
  variant?: ConfirmDialogVariant
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  actionLabel,
  variant = 'warning',
  isPending = false,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const { icon: Icon, iconClassName } = variantConfig[variant]

  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending || nextOpen) {
          onOpenChange(nextOpen)
        }
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full',
                iconClassName,
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 pt-0.5">
              <AlertDialogPrimitive.Title className="text-lg font-semibold text-foreground">
                {title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {description}
              </AlertDialogPrimitive.Description>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Hủy
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              type="button"
              variant={variant === 'danger' ? 'destructive' : 'default'}
              className={
                variant === 'warning'
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : undefined
              }
              disabled={isPending}
              onClick={onConfirm}
            >
              {actionLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

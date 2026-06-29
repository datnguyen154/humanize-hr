import { cn } from '@/lib/utils'

type MobileSidebarOverlayProps = {
  open: boolean
  onClose: () => void
}

export function MobileSidebarOverlay({
  open,
  onClose,
}: MobileSidebarOverlayProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden',
        open
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0',
      )}
      aria-hidden="true"
      onClick={onClose}
    />
  )
}

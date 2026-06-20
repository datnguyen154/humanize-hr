import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'neutral'

const toneClassName: Record<StatusBadgeTone, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-muted text-muted-foreground',
}

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  label: string
  tone?: StatusBadgeTone
}

export function StatusBadge({
  label,
  tone = 'neutral',
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium',
        toneClassName[tone],
        className,
      )}
      {...props}
    >
      {label}
    </span>
  )
}

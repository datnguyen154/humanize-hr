import type { ReactNode } from 'react'

type SidebarBrandProps = {
  subtitle: string
  logoText?: string
  action?: ReactNode
}

export function SidebarBrand({
  subtitle,
  logoText = 'HR',
  action,
}: SidebarBrandProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        {logoText}
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-xl font-bold tracking-tight text-primary">
          Humanize HR
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {action}
    </div>
  )
}

import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

type HeaderProfileActionProps = {
  label?: string
  fullName?: string | null
  fallback: string
  to?: string
  avatarUrl?: string | null
}

const getInitials = (fullName: string | null | undefined, fallback: string) => {
  if (!fullName?.trim()) {
    return fallback
  }

  return (
    fullName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || fallback
  )
}

export function HeaderProfileAction({
  label = 'Hồ sơ',
  fullName,
  fallback,
  to,
  avatarUrl,
}: HeaderProfileActionProps) {
  const initials = getInitials(fullName, fallback)
  const baseClassName =
    'inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors'
  const content = (
    <>
      <span className="hidden sm:inline">{label}</span>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </span>
      )}
    </>
  )

  if (to) {
    return (
      <NavLink
        to={to}
        aria-label="Mở hồ sơ cá nhân"
        className={({ isActive }) =>
          cn(
            baseClassName,
            'hover:bg-muted/60',
            isActive &&
              'border-primary/20 bg-primary/10 text-primary hover:bg-primary/10',
          )
        }
      >
        {content}
      </NavLink>
    )
  }

  return (
    <div className={baseClassName} title={fullName ?? 'Quản trị viên'}>
      {content}
    </div>
  )
}

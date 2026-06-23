import { Building2, LogOut, Settings, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth'

import { adminNavigationItems } from './admin-navigation.config'

type AdminSidebarProps = {
  variant?: 'desktop' | 'mobile'
  open?: boolean
  onClose?: () => void
}

type SidebarContentProps = {
  showCloseButton?: boolean
  onClose?: () => void
}

function SidebarContent({ showCloseButton = false, onClose }: SidebarContentProps) {
  const { pathname } = useLocation()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    onClose?.()
    logout()
  }

  return (
    <>
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Humanize HR
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Phần mềm nhân sự
          </p>
        </div>

        {showCloseButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-primary"
            aria-label="Đóng menu"
            title="Đóng menu"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        ) : null}
      </div>

      <nav className="grid gap-1" aria-label="Điều hướng quản trị">
        {adminNavigationItems.map((item) => {
          const isActive =
            pathname === item.path || pathname.startsWith(`${item.path}/`)
          const Icon = item.icon

          return (
            <Button
              key={item.path}
              asChild
              type="button"
              variant="ghost"
              className={`relative w-full justify-start gap-3 px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-primary ${
                isActive ? 'bg-accent font-medium text-primary' : ''
              }`}
            >
              <Link
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={onClose}
              >
                {isActive && (
                  <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-primary" />
                )}
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            </Button>
          )
        })}
      </nav>

      <div className="mt-auto grid gap-1 border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          disabled
          className="w-full justify-start gap-3 px-3 text-muted-foreground"
          title="Tính năng đang được phát triển"
        >
          <Settings className="size-4" />
          <span>Cài đặt</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </>
  )
}

export function AdminSidebar({
  variant = 'desktop',
  open = false,
  onClose,
}: AdminSidebarProps) {
  if (variant === 'mobile') {
    return (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card px-4 py-5 shadow-xl transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent showCloseButton onClose={onClose} />
      </aside>
    )
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-5 md:flex">
      <SidebarContent />
    </aside>
  )
}

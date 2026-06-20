import { Bell, CircleHelp } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth'

const adminPageMetadata = [
  {
    path: '/admin/dashboard',
    title: 'Tổng quan',
    description: 'Theo dõi nhanh tình hình nhân sự trong hệ thống.',
  },
  {
    path: '/admin/employees',
    title: 'Nhân viên',
    description:
      'Quản lý hồ sơ, trạng thái và thông tin làm việc của nhân viên.',
  },
  {
    path: '/admin/departments',
    title: 'Phòng ban',
    description: 'Quản lý cơ cấu tổ chức và thông tin phòng ban.',
  },
  {
    path: '/admin/attendance',
    title: 'Chấm công',
    description: 'Theo dõi ngày làm việc, giờ vào và giờ ra của nhân viên.',
  },
  {
    path: '/admin/leave-requests',
    title: 'Nghỉ phép',
    description: 'Quản lý và xét duyệt đơn nghỉ phép của nhân viên.',
  },
]

export function AdminHeader() {
  const user = useAuthStore((state) => state.user)
  const { pathname } = useLocation()
  const pageMetadata = adminPageMetadata.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  ) ?? {
    title: 'Quản trị hệ thống',
    description: 'Quản lý thông tin nhân sự trong hệ thống.',
  }
  const avatarFallback = user?.fullName
    ? user.fullName
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'ND'
  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Quản trị viên'
      : user?.role === 'EMPLOYEE'
        ? 'Nhân viên'
        : 'Chưa xác định'

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <div className="min-w-0 py-3">
        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
          {pageMetadata.title}
        </h1>
        <p className="mt-1 hidden truncate text-sm text-muted-foreground sm:block">
          {pageMetadata.description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary"
          aria-label="Trợ giúp"
          title="Trợ giúp"
        >
          <CircleHelp className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-primary"
          aria-label="Thông báo"
          title="Thông báo"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </Button>

        <div className="ml-1 flex items-center gap-3 border-l border-border pl-3 sm:ml-2 sm:pl-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {avatarFallback}
          </div>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="max-w-40 truncate text-sm font-medium text-foreground">
              {user?.fullName ?? 'Người dùng'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

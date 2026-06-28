import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { HeaderProfileAction } from '@/components/ui/header-profile-action'
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

type AdminHeaderProps = {
  onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const user = useAuthStore((state) => state.user)
  const { pathname } = useLocation()
  const pageMetadata = adminPageMetadata.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  ) ?? {
    title: 'Quản trị hệ thống',
    description: 'Quản lý thông tin nhân sự trong hệ thống.',
  }
  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-primary md:hidden"
          aria-label="Mở menu"
          title="Mở menu"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
            {pageMetadata.title}
          </h1>
          <p className="mt-1 hidden truncate text-sm text-muted-foreground sm:block">
            {pageMetadata.description}
          </p>
        </div>
      </div>

      <HeaderProfileAction fullName={user?.fullName} fallback="AD" />
    </header>
  )
}

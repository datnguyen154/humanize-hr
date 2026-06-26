import {
  ChevronRight,
  ClipboardList,
  FilePlus2,
  User,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'

type QuickAction = {
  label: string
  description: string
  path: string
  icon: LucideIcon
}

const quickActions: QuickAction[] = [
  {
    label: 'Tạo đơn nghỉ phép',
    description: 'Gửi yêu cầu nghỉ phép',
    path: '/employee/leave-requests/create',
    icon: FilePlus2,
  },
  {
    label: 'Xem đơn nghỉ phép',
    description: 'Theo dõi trạng thái đơn',
    path: '/employee/leave-requests',
    icon: ClipboardList,
  },
  {
    label: 'Hồ sơ cá nhân',
    description: 'Cập nhật thông tin cá nhân',
    path: '/employee/profile',
    icon: User,
  },
]

export function EmployeeQuickActions() {
  return (
    <Card className="h-full rounded-xl border border-border bg-card shadow-sm">
      <CardContent className="grid h-full gap-4 p-6">
        <h3 className="text-base font-semibold text-foreground">
          Thao tác nhanh
        </h3>
        <div className="grid gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Link
                key={action.path}
                to={action.path}
                className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border px-4 py-4 transition-all duration-200 hover:border-primary/40 hover:bg-muted/40"
              >
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">
                    {action.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {action.description}
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

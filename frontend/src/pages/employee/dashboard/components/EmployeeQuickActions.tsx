import { Link } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'

type QuickAction = {
  label: string
  path: string
}

const quickActions: QuickAction[] = [
  {
    label: 'Chấm công',
    path: '/employee/attendance',
  },
  {
    label: 'Tạo đơn nghỉ phép',
    path: '/employee/leave-requests/create',
  },
  {
    label: 'Xem đơn nghỉ phép',
    path: '/employee/leave-requests',
  },
  {
    label: 'Hồ sơ cá nhân',
    path: '/employee/profile',
  },
]

export function EmployeeQuickActions() {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4">
        <h3 className="text-base font-semibold text-foreground">
          Thao tác nhanh
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

import { Button } from '@/components/ui/button'

const adminMenuItems = [
  'Tổng quan',
  'Nhân viên',
  'Phòng ban',
  'Chấm công',
  'Nghỉ phép',
  'Bảng lương',
]

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card px-4 py-5 md:block">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">Humanize HR</p>
        <p className="mt-1 text-xs text-muted-foreground">Quản trị hệ thống</p>
      </div>

      <nav className="grid gap-1" aria-label="Menu quản trị">
        {adminMenuItems.map((item, index) => (
          <Button
            key={item}
            type="button"
            variant={index === 0 ? 'secondary' : 'ghost'}
            className="justify-start"
          >
            {item}
          </Button>
        ))}
      </nav>
    </aside>
  )
}

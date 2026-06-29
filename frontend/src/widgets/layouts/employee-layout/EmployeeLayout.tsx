import { Outlet } from 'react-router-dom'

import { MobileSidebarOverlay } from '../shared/MobileSidebarOverlay'
import { useMobileSidebar } from '../shared/useMobileSidebar'
import { EmployeeHeader } from './EmployeeHeader'
import { EmployeeSidebar } from './EmployeeSidebar'

export function EmployeeLayout() {
  const { isOpen, openSidebar, closeSidebar } = useMobileSidebar()

  return (
    <div className="flex min-h-screen bg-background">
      <EmployeeSidebar />
      <MobileSidebarOverlay open={isOpen} onClose={closeSidebar} />
      <EmployeeSidebar
        variant="mobile"
        open={isOpen}
        onClose={closeSidebar}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">
        <EmployeeHeader onMenuClick={openSidebar} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

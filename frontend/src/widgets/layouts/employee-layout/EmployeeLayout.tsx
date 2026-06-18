import { Outlet } from 'react-router-dom'

import { EmployeeHeader } from './EmployeeHeader'
import { EmployeeSidebar } from './EmployeeSidebar'

export function EmployeeLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <EmployeeSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <EmployeeHeader />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

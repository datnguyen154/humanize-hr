import { Outlet } from 'react-router-dom'

import { EmployeeHeader } from './EmployeeHeader'
import { EmployeeSidebar } from './EmployeeSidebar'

export function EmployeeLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <EmployeeSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">
        <EmployeeHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileSidebarPathname, setMobileSidebarPathname] = useState<
    string | null
  >(null)
  const { pathname } = useLocation()
  const isMobileSidebarOpen =
    mobileSidebarOpen && mobileSidebarPathname === pathname

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false)
  }

  const openMobileSidebar = () => {
    setMobileSidebarPathname(pathname)
    setMobileSidebarOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden ${
          isMobileSidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={closeMobileSidebar}
      />
      <AdminSidebar
        variant="mobile"
        open={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">
        <AdminHeader onMenuClick={openMobileSidebar} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useLocation } from 'react-router-dom'

export function useMobileSidebar() {
  const [open, setOpen] = useState(false)
  const [openedPathname, setOpenedPathname] = useState<string | null>(null)
  const { pathname } = useLocation()
  const isOpen = open && openedPathname === pathname

  const openSidebar = () => {
    setOpenedPathname(pathname)
    setOpen(true)
  }

  const closeSidebar = () => {
    setOpen(false)
  }

  return { isOpen, openSidebar, closeSidebar }
}

import { RouterProvider } from 'react-router-dom'

import { Toaster } from '@/components/ui/toaster'

import { AuthProvider } from './providers/AuthProvider'
import { QueryProvider } from './providers/QueryProvider'
import { router } from './router'

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  )
}

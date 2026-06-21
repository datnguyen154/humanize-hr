import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'border-border bg-card text-card-foreground shadow-lg',
          title: 'text-sm font-semibold text-foreground',
          description: 'text-sm text-muted-foreground',
          closeButton: 'border-border bg-card text-muted-foreground',
        },
      }}
    />
  )
}

import { useAuthStore } from '@/features/auth'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Xin chào, {user?.fullName ?? 'người dùng'}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Vai trò: {user?.role ?? 'Chưa xác định'}
        </p>
      </section>
    </main>
  )
}

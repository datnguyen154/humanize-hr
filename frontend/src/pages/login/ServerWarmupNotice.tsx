import { CheckCircle2, CloudOff, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { WarmupState } from '@/shared/lib/server-warmup'

type Props = { state: WarmupState; elapsedSeconds: number; onRetry: () => void }

/** Explains free-tier cold starts while the backend wakes up; silent when the server answers quickly. */
export function ServerWarmupNotice({ state, elapsedSeconds, onRetry }: Props) {
  if (state === 'checking') return null
  if (state === 'ready') {
    // Only worth confirming when the user actually waited.
    return elapsedSeconds >= 3 ? (
      <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        Máy chủ đã sẵn sàng, bạn có thể đăng nhập.
      </p>
    ) : null
  }
  if (state === 'unavailable') {
    return (
      <div role="alert" className="grid gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <p className="flex items-start gap-2">
          <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Chưa kết nối được máy chủ demo. Máy chủ có thể đang bảo trì hoặc mạng không ổn định.
        </p>
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>Kiểm tra lại</Button>
      </div>
    )
  }
  return (
    <div role="status" aria-live="polite" className="grid gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      <p className="flex items-start gap-2">
        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        <span>
          Máy chủ demo đang khởi động (gói miễn phí, thường mất 30–60 giây).
          Bạn vẫn có thể nhập thông tin, đăng nhập sẽ hoạt động khi máy chủ sẵn sàng.
        </span>
      </p>
      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-amber-200" aria-hidden="true">
          {/* Expected wait ~60 s; the bar stops short of full until the server really answers. */}
          <div className="h-full rounded-full bg-amber-500 transition-[width] duration-1000 ease-out"
            style={{ width: `${Math.min(92, (elapsedSeconds / 60) * 100)}%` }} />
        </div>
        <span className="text-xs tabular-nums">Đã chờ {elapsedSeconds} giây</span>
      </div>
    </div>
  )
}

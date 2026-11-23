import { useCallback, useEffect, useRef, useState } from 'react'

import { env } from './env'

export type WarmupState = 'checking' | 'waking' | 'ready' | 'unavailable'

/** /health lives at the API origin, outside the /api prefix. */
export const healthUrl = () => `${env.apiBaseUrl.replace(/\/api\/?$/, '')}/health`

type Options = {
  /** Show the "waking up" notice only when the first answer is slower than this. */
  slowAfterMs?: number
  /** Give up and offer a retry after this long (Render Free cold start is ~30–60 s). */
  giveUpAfterMs?: number
  retryEveryMs?: number
}

/**
 * Pings the backend health check as soon as the login page opens so a sleeping free-tier server
 * starts waking before the user submits. Never blocks the form.
 */
export function useServerWarmup({ slowAfterMs = 2500, giveUpAfterMs = 90_000, retryEveryMs = 3000 }: Options = {}) {
  const [state, setState] = useState<WarmupState>('checking')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const startedAt = useRef(0)

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    startedAt.current = Date.now()
    const slowTimer = setTimeout(() => { if (!cancelled) setState((s) => (s === 'checking' ? 'waking' : s)) }, slowAfterMs)
    const tick = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 1000)
    const stop = () => { clearTimeout(slowTimer); clearInterval(tick); clearTimeout(retryTimer) }

    const ping = async () => {
      try {
        const response = await fetch(healthUrl(), { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error(`health ${response.status}`)
        if (!cancelled) { stop(); setState('ready') }
      } catch {
        if (cancelled) return
        if (Date.now() - startedAt.current >= giveUpAfterMs) { stop(); setState('unavailable'); return }
        setState('waking')
        retryTimer = setTimeout(() => void ping(), retryEveryMs)
      }
    }
    void ping()
    // A hung connection (no error, no answer) is cut at the give-up deadline.
    const giveUpTimer = setTimeout(() => { if (!cancelled) { controller.abort(); stop(); setState((s) => (s === 'ready' ? s : 'unavailable')) } }, giveUpAfterMs)

    return () => { cancelled = true; controller.abort(); stop(); clearTimeout(giveUpTimer) }
  }, [attempt, slowAfterMs, giveUpAfterMs, retryEveryMs])

  // Reset here (not in the effect) so each retry starts from a clean "checking" state.
  const retry = useCallback(() => {
    setState('checking')
    setElapsedSeconds(0)
    setAttempt((n) => n + 1)
  }, [])
  return { state, elapsedSeconds, retry }
}

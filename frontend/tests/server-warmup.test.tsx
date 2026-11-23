import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { ServerWarmupNotice } from '@/pages/login/ServerWarmupNotice'
import { healthUrl, useServerWarmup } from '@/shared/lib/server-warmup'

function Harness() {
  const warmup = useServerWarmup({ slowAfterMs: 2500, giveUpAfterMs: 10_000, retryEveryMs: 1000 })
  return <ServerWarmupNotice state={warmup.state} elapsedSeconds={warmup.elapsedSeconds} onRetry={warmup.retry} />
}

const ok = () => Promise.resolve(new Response('{}', { status: 200 }))
const never = () => new Promise<Response>(() => {})

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('pings /health at the API origin, outside the /api prefix', () => {
  expect(healthUrl()).toMatch(/\/health$/)
  expect(healthUrl()).not.toMatch(/\/api\/health$/)
})

it('stays silent when the server answers quickly', async () => {
  vi.stubGlobal('fetch', vi.fn(ok))
  render(<Harness />)
  await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.queryByRole('alert')).toBeNull()
})

it('shows the cold-start notice with elapsed time, then confirms when the server wakes up', async () => {
  const fetchMock = vi.fn().mockImplementationOnce(never)
  vi.stubGlobal('fetch', fetchMock)
  render(<Harness />)
  await act(async () => { await vi.advanceTimersByTimeAsync(4000) })
  expect(screen.getByRole('status').textContent).toMatch(/đang khởi động.*Đã chờ 4 giây/s)
  cleanup()
  // Second render: the server keeps refusing for ~5 s while booting, then answers.
  const booting = vi.fn(ok)
  for (let i = 0; i < 5; i++) booting.mockRejectedValueOnce(new TypeError('Failed to fetch'))
  vi.stubGlobal('fetch', booting)
  render(<Harness />)
  await act(async () => { await vi.advanceTimersByTimeAsync(7000) })
  expect(screen.getByRole('status').textContent).toMatch(/đã sẵn sàng/)
})

it('gives up after the deadline and lets the user check again', async () => {
  const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
  vi.stubGlobal('fetch', fetchMock)
  render(<Harness />)
  await act(async () => { await vi.advanceTimersByTimeAsync(11_000) })
  expect(screen.getByRole('alert').textContent).toMatch(/Chưa kết nối được máy chủ/)
  const calls = fetchMock.mock.calls.length
  fetchMock.mockImplementation(ok)
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(100) })
  expect(fetchMock.mock.calls.length).toBeGreaterThan(calls)
  expect(screen.queryByRole('alert')).toBeNull()
})

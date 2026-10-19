import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { getEmployees } from '@/features/employee/api/employee.api'
import { useEmployeesQuery } from '@/features/employee/hooks/useEmployeesQuery'
import type { EmployeesResponse } from '@/features/employee/types/employee.types'

vi.mock('@/features/employee/api/employee.api', () => ({ getEmployees: vi.fn(), getEmployeeById: vi.fn() }))

const response = (page: number): EmployeesResponse => ({
  data: [], meta: { page, limit: 10, totalItems: 20, totalPages: 2, hasNextPage: page === 1, hasPreviousPage: page === 2 },
})

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return { client, ...renderHook(({ page }) => useEmployeesQuery({ page, limit: 10 }), { wrapper, initialProps: { page: 1 } }) }
}

describe('Employee query transitions', () => {
  it('keeps prior data while the next page is loading', async () => {
    let resolvePage!: (value: EmployeesResponse) => void
    vi.mocked(getEmployees).mockResolvedValueOnce(response(1)).mockImplementationOnce(() => new Promise((resolve) => { resolvePage = resolve }))
    const { result, rerender, unmount, client } = setup()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ page: 2 })
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(true))
    expect(result.current.data?.meta.page).toBe(1)
    expect(result.current.isLoading).toBe(false)
    await act(async () => { resolvePage(response(2)) })
    await waitFor(() => expect(result.current.data?.meta.page).toBe(2))
    expect(result.current.isPlaceholderData).toBe(false)
    unmount(); client.clear()
  })

  it('exposes failure and recovers after an explicit retry', async () => {
    vi.mocked(getEmployees).mockRejectedValueOnce(new Error('Request failed')).mockResolvedValueOnce(response(1))
    const { result, unmount, client } = setup()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
    await act(async () => { await result.current.refetch() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.meta.page).toBe(1)
    unmount(); client.clear()
  })
})

import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useEmployeeListFilters } from '@/features/employee/hooks/useEmployeeListFilters'
import { EMPLOYEE_SEARCH_DELAY } from '@/features/employee/lib/employee-list.params'

function FilterControls() {
  const { filters, searchInput, setSearchInput, updateFilters } = useEmployeeListFilters()
  return <>
    <input aria-label="Tìm nhân viên" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
    <button onClick={() => updateFilters({ status: 'INACTIVE' })}>Tạm ngưng</button>
    <output data-testid="filters">{JSON.stringify(filters)}</output>
  </>
}

function setup(entries = ['/admin/employees']) {
  const router = createMemoryRouter([{ path: '/admin/employees', element: <FilterControls /> }], {
    initialEntries: entries, initialIndex: entries.length - 1,
  })
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}

describe('Employee List URL interaction', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('restores URL filters on initial load', () => {
    setup(['/admin/employees?page=3&search=An&status=ACTIVE&sortBy=fullName&sortOrder=desc'])
    expect(screen.getByRole('textbox').getAttribute('value')).toBe('An')
    expect(JSON.parse(screen.getByTestId('filters').textContent!)).toMatchObject({
      page: 3, search: 'An', status: 'ACTIVE', sortBy: 'fullName', sortOrder: 'desc',
    })
  })

  it('commits only the last input after the quiet period and resets page', async () => {
    const { router } = setup(['/admin/employees?page=3'])
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A' } })
    await act(async () => { vi.advanceTimersByTime(200) })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'An' } })
    await act(async () => { vi.advanceTimersByTime(EMPLOYEE_SEARCH_DELAY - 1) })
    expect(router.state.location.search).toBe('?page=3')
    await act(async () => { vi.advanceTimersByTime(1) })
    expect(router.state.location.search).toBe('?search=An')
  })

  it('applies a pending draft and status in one navigation', async () => {
    const { router } = setup(['/admin/employees?page=4'])
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'An' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạm ngưng' }))
    await act(async () => { vi.advanceTimersByTime(EMPLOYEE_SEARCH_DELAY) })
    const params = new URLSearchParams(router.state.location.search)
    expect(params.get('search')).toBe('An')
    expect(params.get('status')).toBe('INACTIVE')
    expect(params.has('page')).toBe(false)
  })

  it('Back cancels pending search and Forward restores the prior URL', async () => {
    const { router } = setup(['/admin/employees?search=First', '/admin/employees?search=Second&page=2'])
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Uncommitted' } })
    await act(async () => { await router.navigate(-1) })
    await act(async () => { vi.advanceTimersByTime(EMPLOYEE_SEARCH_DELAY) })
    expect(router.state.location.search).toBe('?search=First')
    expect(screen.getByRole('textbox').getAttribute('value')).toBe('First')
    await act(async () => { await router.navigate(1) })
    expect(screen.getByRole('textbox').getAttribute('value')).toBe('Second')
    expect(router.state.location.search).toBe('?search=Second&page=2')
  })

  it('does not navigate after unmount while search is pending', async () => {
    const { router, unmount } = setup()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'An' } })
    unmount()
    await act(async () => { vi.advanceTimersByTime(EMPLOYEE_SEARCH_DELAY) })
    expect(router.state.location.search).toBe('')
    router.dispose()
  })
})

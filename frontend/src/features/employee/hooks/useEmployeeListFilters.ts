import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

import { EMPLOYEE_SEARCH_DELAY, readEmployeeListParams, writeEmployeeListParams, type EmployeeListFilters } from '../lib/employee-list.params'

export function useEmployeeListFilters() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const filters = readEmployeeListParams(params)
  const [draft, setDraft] = useState<{ location: typeof location; value: string } | null>(null)
  // A navigation (including Back/Forward) discards any uncommitted search draft.
  const searchInput = draft?.location === location ? draft.value : filters.search
  const isSearchPending = searchInput.trim() !== filters.search

  useEffect(() => {
    if (!isSearchPending) return
    const timer = window.setTimeout(() => {
      setParams(writeEmployeeListParams(params, {
        ...readEmployeeListParams(params), search: searchInput, page: 1,
      }), { replace: true })
    }, EMPLOYEE_SEARCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [isSearchPending, searchInput, params, setParams, location])

  function updateFilters(patch: Partial<EmployeeListFilters>) {
    setParams(writeEmployeeListParams(params, {
      ...filters, search: searchInput, page: 1, ...patch,
    }))
  }

  return {
    filters, searchInput, isSearchPending, updateFilters,
    setSearchInput: (value: string) => setDraft({ location, value }),
  }
}

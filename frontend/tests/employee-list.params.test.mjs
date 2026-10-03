import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readEmployeeListParams, writeEmployeeListParams } from '../src/features/employee/lib/employee-list.params.ts'

test('default filters preserve existing list behavior', () => {
  assert.deepEqual(readEmployeeListParams(new URLSearchParams()), {
    page: 1, search: '', status: 'ALL', departmentId: undefined,
    sortBy: 'employeeCode', sortOrder: 'asc',
  })
})

test('URL restores all filters, including Vietnamese search', () => {
  const filters = {
    page: 3, search: 'Nguyễn An', status: 'ACTIVE', departmentId: 'department-id',
    sortBy: 'fullName', sortOrder: 'desc',
  }
  const url = writeEmployeeListParams(new URLSearchParams(), filters)
  assert.deepEqual(readEmployeeListParams(url), filters)
})

test('invalid pages and unsupported enum values fall back safely', () => {
  for (const page of ['-1', '0', '1.5', 'oops', 'Infinity', '9007199254740992']) {
    const result = readEmployeeListParams(new URLSearchParams({ page, status: 'bad', sortBy: 'bad', sortOrder: 'bad' }))
    assert.equal(result.page, 1)
    assert.equal(result.status, 'ALL')
    assert.equal(result.sortBy, 'employeeCode')
    assert.equal(result.sortOrder, 'asc')
  }
})

test('writer removes defaults, keeps unrelated params and does not mutate input', () => {
  const params = new URLSearchParams('page=5&status=ACTIVE&tab=list')
  const defaults = readEmployeeListParams(new URLSearchParams())
  const next = writeEmployeeListParams(params, defaults)
  assert.equal(next.toString(), 'tab=list')
  assert.equal(params.get('page'), '5')
})

test('search trims whitespace and filter update resets page atomically', () => {
  const params = new URLSearchParams('page=3&sortBy=joinedAt')
  const next = writeEmployeeListParams(params, {
    ...readEmployeeListParams(params), search: '  An  ', status: 'INACTIVE', page: 1,
  })
  const filters = readEmployeeListParams(next)
  assert.equal(filters.search, 'An')
  assert.equal(filters.page, 1)
  assert.equal(filters.status, 'INACTIVE')
  assert.equal(filters.sortBy, 'joinedAt')
})

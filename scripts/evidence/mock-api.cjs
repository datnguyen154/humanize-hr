// Evidence harness: drives the real frontend (Vite dev server on :5173) in Chrome while every
// backend call is answered by an in-memory store. Calendar logic comes from the backend's own
// compiled pure functions (backend/dist), so screens show what the real engine would compute.
// Run `npm run build` in backend first. Not a substitute for QA against PostgreSQL.
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const { chromium } = require(path.join(root, 'frontend/node_modules/playwright'))
const dist = (p) => require(path.join(root, 'backend/dist/modules', p))

const actor = '22222222-2222-4222-8222-222222222222'
const users = {
  ADMIN: { id: actor, email: 'admin@example.com', fullName: 'Nguyễn Quản Trị', role: 'ADMIN' },
  EMPLOYEE: { id: '44444444-4444-4444-8444-444444444444', email: 'employee@example.com', fullName: 'Trần Minh Anh', role: 'EMPLOYEE' },
}
const meta = (n, page = 1, limit = 10) => ({ page, limit, totalItems: n, totalPages: Math.ceil(n / limit),
  hasNextPage: page * limit < n, hasPreviousPage: page > 1 })
const pageOf = (items, q) => {
  const page = Number(q.get('page') ?? 1)
  const limit = Number(q.get('limit') ?? 10)
  return { data: items.slice((page - 1) * limit, page * limit), meta: meta(items.length, page, limit) }
}

/** Mutable world shared by all handlers; scenarios seed and inspect it. */
function createStore() {
  return { schedules: [], exceptions: [], attendance: [], employees: [], leaves: [], payrolls: [], today: '2026-11-23', extra: [] }
}

function respond(store, role, method, url, body) {
  const p = url.pathname.replace(/^\/api/, '')
  const q = url.searchParams
  for (const handler of store.extra) {
    const result = handler({ method, p, q, body, store, role })
    if (result !== undefined) return result
  }
  if (p === '/auth/login') return { data: { accessToken: 'mock.jwt.token', refreshToken: 'mock-refresh', user: users[role] } }
  if (p === '/auth/me') return { data: users[role] }
  if (p === '/notifications/unread-count') return { data: { count: 0 } }

  const versionMatch = p.match(/^\/work-calendar\/versions\/([^/]+)(\/.*)?$/)
  if (p === '/work-calendar/versions' && method === 'GET') {
    const status = q.get('status') ?? 'DRAFT'
    const items = store.schedules.filter((s) => s.status === status)
      .sort((a, b) => status === 'ACTIVE' ? b.effectiveFrom.localeCompare(a.effectiveFrom) : b.version - a.version)
    return pageOf(items, q)
  }
  if (versionMatch) {
    const schedule = store.schedules.find((s) => s.id === versionMatch[1])
    const rest = versionMatch[2] ?? ''
    if (rest === '/activate' && method === 'POST') {
      const { assertActivatable } = dist('work-calendar/work-schedule-activation.service.js')
      const latest = store.schedules.filter((s) => s.status === 'ACTIVE').map((s) => s.effectiveFrom).sort().pop() ?? null
      assertActivatable(schedule, store.exceptions.filter((e) => e.scheduleVersionId === schedule.id), latest, store.tomorrow ?? '2026-11-24')
      Object.assign(schedule, { status: 'ACTIVE', revision: schedule.revision + 1 })
      return { data: schedule }
    }
    if (rest === '/exceptions' && method === 'GET') {
      const items = store.exceptions.filter((e) => e.scheduleVersionId === schedule.id)
      return { ...pageOf(items, q), scheduleRevision: schedule.revision }
    }
    if (rest === '' && method === 'GET') return { data: schedule }
  }
  if (p === '/work-calendar/preview') {
    const { buildCalendarPreview } = dist('work-calendar/calendar-preview.engine.js')
    const schedule = store.schedules.find((s) => s.id === q.get('versionId'))
    return { data: buildCalendarPreview(schedule, store.exceptions.filter((e) => e.scheduleVersionId === schedule.id), Number(q.get('year')), Number(q.get('month'))) }
  }
  if (p === '/attendance' || p === '/attendance/history') {
    let items = [...store.attendance]
    if (p === '/attendance/history') items = items.filter((a) => a.employee.fullName === users.EMPLOYEE.fullName)
    if (q.get('status')) items = items.filter((a) => a.status === q.get('status'))
    if (q.get('fromDate')) items = items.filter((a) => a.attendanceDate.slice(0, 10) >= q.get('fromDate'))
    if (q.get('toDate')) items = items.filter((a) => a.attendanceDate.slice(0, 10) <= q.get('toDate'))
    items.sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate) || a.employee.fullName.localeCompare(b.employee.fullName))
    return pageOf(items, q)
  }
  if (p.startsWith('/attendance/timesheet')) {
    const year = Number(q.get('year')), month = Number(q.get('month'))
    const sheet = timesheetFor(store, year, month)
    const period = { year, month }
    if (p === '/attendance/timesheet') {
      return { data: { period, standardDays: sheet.standardDays, isCalendarComplete: sheet.standardDays !== null,
        employees: store.employees.map((e) => ({ employee: e, summary: sheet.build(e).summary })) } }
    }
    const employee = p === '/attendance/timesheet/me'
      ? store.employees.find((e) => e.fullName === users.EMPLOYEE.fullName)
      : store.employees.find((e) => e.id === p.split('/').pop())
    return { data: { period, standardDays: sheet.standardDays, isCalendarComplete: sheet.standardDays !== null, employee, ...sheet.build(employee) } }
  }
  if (p === '/employees' && method === 'GET') return { data: store.employees, meta: meta(store.employees.length, 1, 100) }
  if (p === '/payrolls' && method === 'GET') {
    const items = store.payrolls.map((pr) => ({ ...pr, employee: store.employees.find((e) => e.id === pr.employeeId) }))
    const page = Number(q.get('page') ?? 1), limit = Number(q.get('limit') ?? 10)
    return { data: items.slice((page - 1) * limit, page * limit), pagination: meta(items.length, page, limit) }
  }
  if (p === '/employees/me/payrolls') {
    const me = store.employees.find((e) => e.fullName === users.EMPLOYEE.fullName)
    const items = store.payrolls.filter((pr) => pr.employeeId === me.id && pr.status === 'PUBLISHED')
    return { data: items, pagination: meta(items.length) }
  }
  if (p === '/payrolls/from-timesheet' && method === 'POST') return { data: createFromTimesheet(store, body) }
  const publish = p.match(/^\/payrolls\/([^/]+)\/publish$/)
  if (publish) {
    const payroll = store.payrolls.find((pr) => pr.id === publish[1])
    payroll.status = 'PUBLISHED'
    return { data: payroll }
  }
  console.log('  [mock] fallback', method, p)
  return { data: [], meta: meta(0) }
}

/** Same computation as backend timesheet.service, over the in-memory store. */
function timesheetFor(store, year, month) {
  const { buildEmployeeTimesheet, monthDates, standardDays } = dist('attendance/timesheet.engine.js')
  const { createCalendarResolver } = dist('work-calendar/effective-calendar.js')
  const calendars = store.schedules.filter((s) => s.status === 'ACTIVE')
    .map((schedule) => ({ schedule, events: store.exceptions.filter((e) => e.scheduleVersionId === schedule.id) }))
  const resolveDay = createCalendarResolver(calendars)
  const dates = monthDates(year, month)
  return {
    standardDays: standardDays(dates, resolveDay),
    build: (employee) => buildEmployeeTimesheet({ dates, today: store.today, joinedAt: employee.joinedAt, resolveDay,
      attendance: new Map(store.attendance.filter((a) => a.employeeId === employee.id)
        .map((a) => [a.attendanceDate.slice(0, 10), { status: a.status, outOfSchedule: a.outOfSchedule, checkInTime: a.checkInTime, checkOutTime: a.checkOutTime }])),
      leaves: store.leaves.filter((l) => l.employeeId === employee.id) }),
  }
}

/** Mirrors payrollService.createPayrollFromTimesheet over the store, using the backend proration helpers. */
function createFromTimesheet(store, body) {
  const { Prisma } = require(path.join(root, 'backend/node_modules/@prisma/client'))
  const { proratedBaseSalary, isPeriodClosed } = dist('payroll/payroll-proration.js')
  const fail = (statusCode, message) => { throw Object.assign(new Error(message), { statusCode }) }
  const year = Number(body.year), month = Number(body.month)
  if (!isPeriodClosed(year, month, store.today)) fail(409, 'Kỳ công chưa kết thúc. Chỉ tạo bảng lương sau ngày cuối cùng của tháng.')
  if (store.payrolls.some((pr) => pr.employeeId === body.employeeId && pr.year === year && pr.month === month)) fail(409, 'Nhân viên đã có bảng lương cho kỳ này.')
  const sheet = timesheetFor(store, year, month)
  if (sheet.standardDays === null) fail(409, 'Tháng này chưa có lịch làm việc được kích hoạt đầy đủ nên chưa xác định được ngày công chuẩn.')
  const employee = store.employees.find((e) => e.id === body.employeeId)
  const payableDays = sheet.build(employee).summary.payableDays
  const monthly = new Prisma.Decimal(String(body.monthlySalary))
  const base = proratedBaseSalary(monthly, payableDays, sheet.standardDays)
  const bonus = new Prisma.Decimal(String(body.bonus ?? 0)), deduction = new Prisma.Decimal(String(body.deduction ?? 0))
  const payroll = { id: `${String(store.payrolls.length + 1).padStart(8, '0')}-0000-4000-8000-000000000000`, employeeId: employee.id, month, year,
    baseSalary: base.toString(), bonus: bonus.toString(), deduction: deduction.toString(), netSalary: base.plus(bonus).minus(deduction).toString(),
    monthlySalary: monthly.toString(), payableDays, standardDays: sheet.standardDays, note: body.note ?? null, status: 'DRAFT',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  store.payrolls.push(payroll)
  return payroll
}

async function openApp({ role = 'ADMIN', store, width = 1440, height = 900, now }) {
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width, height } })
  // Freeze the browser clock when a scenario needs "after the month ended".
  if (now) await page.clock.setFixedTime(new Date(now))
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.route('http://localhost:3000/api/**', async (route) => {
    const req = route.request()
    try {
      await route.fulfill({ json: respond(store, role, req.method(), new URL(req.url()), req.postDataJSON?.() ?? null) })
    } catch (e) {
      await route.fulfill({ status: e.statusCode ?? 500, json: { code: e.code ?? 'INTERNAL_SERVER_ERROR', message: e.message, ...(e.details ? { details: e.details } : {}) } })
    }
  })
  await page.goto('http://localhost:5173/login')
  await page.getByRole('button', { name: role === 'ADMIN' ? 'Dùng tài khoản Admin' : 'Dùng tài khoản Employee' }).click()
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.waitForURL((u) => !u.pathname.includes('/login'))
  const outDir = process.env.EVIDENCE_DIR
  const shot = async (name, viewport) => {
    if (viewport) await page.setViewportSize(viewport)
    await page.waitForTimeout(300)
    const file = path.join(outDir, `${name}.png`)
    await page.screenshot({ path: file, fullPage: true })
    console.log('  shot', path.relative(root, file))
  }
  return { browser, page, shot, errors }
}

const schedule = (extra) => ({ id: '11111111-1111-4111-8111-111111111111', version: 1, revision: 1, status: 'DRAFT',
  effectiveFrom: '2026-12-01', timezone: 'Asia/Ho_Chi_Minh', weekdays: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '17:00',
  breaks: [{ startTime: '12:00', endTime: '13:00' }], createdBy: actor, updatedBy: actor,
  createdAt: '2026-11-20T02:00:00.000Z', updatedAt: '2026-11-20T02:00:00.000Z', ...extra })

module.exports = { createStore, openApp, schedule, users, dist, root, timesheetFor }

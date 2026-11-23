// P1 evidence: activate a draft calendar, then late/out-of-schedule check-ins in attendance lists.
// Usage: EVIDENCE_DIR=docs/evidence/p1 node scripts/evidence/p1-activation.cjs
const assert = require('node:assert/strict')
const { createStore, openApp, schedule, users, dist } = require('./mock-api.cjs')
const { classifyCheckIn, createCalendarResolver } = dist('work-calendar/effective-calendar.js')

const store = createStore()
store.tomorrow = '2026-11-24'
const active = schedule({ id: '33333333-3333-4333-8333-333333333333', status: 'ACTIVE', revision: 2, effectiveFrom: '2026-11-01' })
const holiday = { id: '55555555-5555-4555-8555-555555555555', scheduleVersionId: active.id, firstAffectedDate: '2026-11-20',
  createdBy: active.createdBy, updatedBy: active.createdBy, createdAt: active.createdAt, updatedAt: active.updatedAt,
  payload: { kind: 'HOLIDAY', date: '2026-11-20', name: 'Ngày Nhà giáo (nghỉ doanh nghiệp)', sourceReference: 'Quyết định nội bộ',
    reason: 'Công ty cho nghỉ', holidayPolicy: { category: 'COMPANY', isPaid: true } } }
store.schedules.push(
  active,
  schedule({ version: 2, revision: 3, effectiveFrom: '2026-12-01', startTime: '08:30', endTime: '17:30' }),
  schedule({ id: '66666666-6666-4666-8666-666666666666', version: 3, effectiveFrom: '2026-11-23' }),
)
store.exceptions.push(holiday)

// Attendance generated through the same classifier the check-in endpoint uses.
const resolve = createCalendarResolver([{ schedule: active, events: [holiday] }])
const people = [users.EMPLOYEE.fullName, 'Lê Hoàng Nam', 'Phạm Thu Hà']
const punches = [['2026-11-19', [7, 52], [8, 14], [7, 59]], ['2026-11-20', [9, 5], null, null], ['2026-11-21', [8, 40], null, [10, 2]],
  ['2026-11-23', [8, 1], [7, 45], [8, 30]]]
let n = 0
for (const [date, ...times] of punches) {
  times.forEach((t, i) => {
    if (!t) return
    const { late, outOfSchedule } = classifyCheckIn(resolve(date), (t[0] * 60 + t[1]) * 60, 8 * 3600)
    const checkIn = new Date(`${date}T${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}:00+07:00`).toISOString()
    store.attendance.push({ id: `a-${n++}`, employeeId: `e-${i}`, employee: { id: `e-${i}`, employeeCode: `NV00${i + 1}`, fullName: people[i] },
      attendanceDate: `${date}T00:00:00.000Z`, checkInTime: checkIn, checkOutTime: outOfSchedule ? null : new Date(`${date}T17:05:00+07:00`).toISOString(),
      status: late ? 'LATE' : 'PRESENT', outOfSchedule, createdAt: checkIn, updatedAt: checkIn })
  })
}
assert.equal(store.attendance.filter((a) => a.outOfSchedule).length, 3, 'holiday + Saturday check-ins are out of schedule')
assert.ok(store.attendance.filter((a) => a.outOfSchedule).every((a) => a.status === 'PRESENT'), 'out-of-schedule is never LATE')

;(async () => {
  const admin = await openApp({ store })
  const { page, shot } = admin
  await page.goto('http://localhost:5173/admin/attendance/settings')
  await page.getByText('Phiên bản v1 · từ 01/11/2026').waitFor()
  await shot('p1-01-settings-before-1440')

  // Retroactive draft (23/11) is rejected with the backend reason.
  const rows = page.locator('table tbody tr')
  await rows.filter({ hasText: '23/11/2026' }).getByRole('button', { name: 'Kích hoạt' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Kích hoạt lịch' }).click()
  await page.getByText(/không được áp dụng hồi tố/).waitFor()
  await shot('p1-02-activate-rejected-retroactive-1440')

  await rows.filter({ hasText: '01/12/2026' }).getByRole('button', { name: 'Kích hoạt' }).click()
  await page.getByRole('alertdialog').waitFor()
  await shot('p1-03-activate-confirm-1440')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Kích hoạt lịch' }).click()
  await page.getByText('Phiên bản v2 · từ 01/12/2026').waitFor()
  assert.equal(store.schedules.find((s) => s.version === 2).status, 'ACTIVE')
  await shot('p1-04-settings-after-activate-1440')
  await shot('p1-05-settings-after-activate-390', { width: 390, height: 844 })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://localhost:5173/admin/attendance')
  await page.getByText('Ngoài lịch').filter({ visible: true }).first().waitFor()
  await shot('p1-06-admin-attendance-out-of-schedule-1440')
  await shot('p1-07-admin-attendance-out-of-schedule-390', { width: 390, height: 844 })
  assert.deepEqual(admin.errors.filter((e) => !e.includes('status of 409')), [], 'only the expected 409 rejection is logged')
  await admin.browser.close()

  const employee = await openApp({ store, role: 'EMPLOYEE', width: 390, height: 844 })
  await employee.page.goto('http://localhost:5173/employee/attendance')
  await employee.page.getByText('Ngoài lịch').filter({ visible: true }).first().waitFor()
  await employee.shot('p1-08-employee-history-390')
  assert.deepEqual(employee.errors, [], 'no console errors on employee screens')
  await employee.browser.close()
  console.log('P1 evidence PASS')
})().catch((e) => { console.error(e); process.exit(1) })

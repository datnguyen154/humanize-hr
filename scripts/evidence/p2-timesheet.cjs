// P2 evidence: company timesheet, employee drill-down, self view and the adjustment shortcut.
// Usage: EVIDENCE_DIR=docs/evidence/p2 node scripts/evidence/p2-timesheet.cjs
const assert = require('node:assert/strict')
const { openApp, timesheetFor } = require('./mock-api.cjs')
const { seedCompany } = require('./seed-company.cjs')

const store = seedCompany()
const sheet = timesheetFor(store, 2026, 11)
const anh = sheet.build(store.employees[0]).summary
// November 2026: 21 weekdays minus the paid company holiday on 20/11.
assert.equal(sheet.standardDays, 20)
assert.equal(anh.absentDays, 1)
assert.equal(anh.paidLeaveDays, 1)
assert.equal(anh.missingCheckOutDays, 1)
assert.equal(sheet.build(store.employees[5]).summary.requiredDays, 10, 'mid-month joiner: 16–30/11 working days incl. upcoming')

;(async () => {
  const admin = await openApp({ store })
  const { page, shot } = admin
  await page.goto('http://localhost:5173/admin/attendance/timesheet?year=2026&month=11')
  await page.getByText('Ngày công chuẩn:').waitFor()
  await shot('p2-01-company-timesheet-1440')
  await shot('p2-02-company-timesheet-390', { width: 390, height: 844 })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: 'Tháng trước' }).click()
  await page.getByText(/chưa xác định được ngày công chuẩn/).waitFor()
  assert.match(page.url(), /year=2026&month=10/)
  await shot('p2-03-company-timesheet-incomplete-calendar-1440')

  await page.goto('http://localhost:5173/admin/attendance/timesheet?year=2026&month=11')
  await page.getByRole('link', { name: 'Xem bảng công của Trần Minh Anh' }).click()
  await page.getByText('Bảng công · Trần Minh Anh').waitFor()
  await shot('p2-04-admin-employee-detail-1440')
  assert.deepEqual(admin.errors, [])
  await admin.browser.close()

  const employee = await openApp({ store, role: 'EMPLOYEE', width: 390, height: 844 })
  await employee.page.goto('http://localhost:5173/employee/attendance')
  await employee.page.getByRole('link', { name: 'Bảng công của tôi' }).click()
  await employee.page.getByText('Ngày cần đối soát (2)').waitFor()
  await employee.shot('p2-05-employee-timesheet-390')
  await employee.shot('p2-06-employee-timesheet-1440', { width: 1440, height: 900 })
  await employee.page.getByRole('link', { name: 'Gửi yêu cầu điều chỉnh' }).first().click()
  await employee.page.waitForURL(/adjustments\/new\?date=2026-11-11/)
  await employee.page.waitForTimeout(500)
  await employee.shot('p2-07-adjustment-prefilled-from-timesheet-1440')
  assert.deepEqual(employee.errors, [])
  await employee.browser.close()
  console.log('P2 evidence PASS')
})().catch((e) => { console.error(e); process.exit(1) })

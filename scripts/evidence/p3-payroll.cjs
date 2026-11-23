// P3 evidence: create payroll from the November timesheet after month end, publish it, employee sees it.
// The browser clock is frozen at 02/12/2026 so November is a closed period.
// Usage: EVIDENCE_DIR=docs/evidence/p3 node scripts/evidence/p3-payroll.cjs
const assert = require('node:assert/strict')
const { openApp } = require('./mock-api.cjs')
const { seedCompany } = require('./seed-company.cjs')

const store = seedCompany({ today: '2026-12-02' })
const now = '2026-12-02T03:00:00.000Z'

;(async () => {
  const admin = await openApp({ store, now })
  const { page, shot } = admin
  await page.goto('http://localhost:5173/admin/payroll')
  await page.getByRole('button', { name: 'Tạo bảng lương' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nhân viên').selectOption({ label: 'Trần Minh Anh (NV001)' })
  await dialog.getByLabel(/Lương tháng theo hợp đồng/).fill('15000000')
  await dialog.getByLabel('Thưởng (VNĐ)').fill('500000')
  await dialog.getByText(/ \/ 20$/).waitFor()
  await shot('p3-01-create-from-timesheet-1440')
  await shot('p3-02-create-from-timesheet-390', { width: 390, height: 844 })

  // October has no ACTIVE calendar → blocked with the reason, submit disabled.
  await page.setViewportSize({ width: 1440, height: 900 })
  await dialog.locator('#month').selectOption('10')
  await dialog.getByText(/chưa xác định được ngày công chuẩn/).waitFor()
  assert.equal(await dialog.getByRole('button', { name: 'Tạo bảng lương' }).isDisabled(), true)
  await shot('p3-03-blocked-incomplete-calendar-1440')

  await dialog.locator('#month').selectOption('11')
  await dialog.getByText(/ \/ 20$/).waitFor()
  await dialog.getByRole('button', { name: 'Tạo bảng lương' }).click()
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(store.payrolls.length, 1)
  const created = store.payrolls[0]
  // Trần Minh Anh, November: 19 payable of 20 → 15,000,000 × 19 / 20 = 14,250,000.
  assert.deepEqual([created.payableDays, created.standardDays, created.baseSalary, created.netSalary], [19, 20, '14250000', '14750000'])
  await page.getByText('Trần Minh Anh').filter({ visible: true }).first().waitFor()
  await shot('p3-04-payroll-list-1440')

  await page.getByRole('button', { name: 'Xem chi tiết bảng lương' }).filter({ visible: true }).first().click()
  await page.getByText('Ngày công hưởng lương').waitFor()
  await shot('p3-05-payroll-detail-draft-1440')
  await page.getByRole('dialog').getByRole('button', { name: 'Phát hành' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Phát hành' }).click()
  await page.waitForTimeout(800)
  assert.equal(store.payrolls[0].status, 'PUBLISHED')
  await shot('p3-06-payroll-published-1440')
  assert.deepEqual(admin.errors, [])
  await admin.browser.close()

  const employee = await openApp({ store, role: 'EMPLOYEE', now, width: 390, height: 844 })
  await employee.page.goto('http://localhost:5173/employee/payrolls')
  await employee.page.getByText(/14\.750\.000/).first().waitFor()
  await employee.shot('p3-07-employee-payrolls-390')
  assert.deepEqual(employee.errors, [])
  await employee.browser.close()
  console.log('P3 evidence PASS')
})().catch((e) => { console.error(e); process.exit(1) })

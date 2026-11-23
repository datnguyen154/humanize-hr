// Cold-start UX evidence: /health is held back like a sleeping Render Free service, then answers.
// Usage: EVIDENCE_DIR=docs/evidence/cold-start node scripts/evidence/cold-start.cjs
const path = require('node:path')
const assert = require('node:assert/strict')
const { chromium } = require(path.join(__dirname, '../../frontend/node_modules/playwright'))

;(async () => {
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  let wake
  const awake = new Promise((resolve) => { wake = resolve })
  await page.route('http://localhost:3000/health', async (route) => { await awake; await route.fulfill({ json: { message: 'HRM backend is running' } }) })
  const shot = async (name) => {
    const file = path.join(process.env.EVIDENCE_DIR, `${name}.png`)
    await page.screenshot({ path: file, fullPage: true })
    console.log('  shot', file)
  }
  await page.goto('http://localhost:5173/login')
  await page.getByText(/đang khởi động/).waitFor()
  await page.waitForTimeout(6200)
  await shot('cold-start-01-waking-390')
  await page.setViewportSize({ width: 1440, height: 900 })
  await shot('cold-start-02-waking-1440')
  // The form stays usable while waiting.
  await page.getByRole('button', { name: 'Dùng tài khoản Admin' }).click()
  assert.notEqual(await page.getByLabel('Địa chỉ email').inputValue(), '')
  wake()
  await page.getByText(/đã sẵn sàng/).waitFor()
  await shot('cold-start-03-ready-1440')
  await browser.close()
  console.log('Cold-start evidence PASS')
})().catch((e) => { console.error(e); process.exit(1) })

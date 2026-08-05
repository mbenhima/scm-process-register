import { chromium } from 'playwright'

const SHOTS = '/tmp/claude-0/-home-user-scm-process-register/be121489-2574-5414-b5df-0d551cade9d3/scratchpad/tutorial-shots'
const PROFILE = '/tmp/pw-profile-tutorial'

const ctx = await chromium.launchPersistentContext(PROFILE, {
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  viewport: { width: 1440, height: 900 },
})
const page = ctx.pages()[0] || (await ctx.newPage())
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

async function shot(name) {
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${SHOTS}/${name}.png` })
}

// ---------- Sign in as Super Admin ----------
await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' })
await shot('00-login')
await page.getByText('Amina Idrissi').click()
await page.waitForTimeout(400)

// ---------- M1: Create Organization ----------
await page.goto('http://localhost:5175/#/app/m1', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await page.getByRole('button', { name: '+ Organization' }).click()
await page.waitForTimeout(200)

let modal = page.locator('.fixed.inset-0').last()
let inputs = modal.locator('input, select, textarea')
await inputs.nth(0).fill('Northbridge Manufacturing Co.') // name
await inputs.nth(1).selectOption({ label: 'No Group (standalone)' }) // group
await inputs.nth(2).selectOption({ label: 'Manufacturing' }) // sector
await inputs.nth(3).fill('1800') // employees
await inputs.nth(4).fill('Plant A — Riverside, Plant B — Eastgate, Central Warehouse') // sites
await inputs.nth(5).fill('en') // languages
await shot('01-create-org-filled')
await modal.getByRole('button', { name: 'Save' }).click()
await page.waitForTimeout(400)
await shot('02-org-created')

// ---------- M1: Create Main Project ----------
// Find the Northbridge card and click "+ Main Project" within it
const orgCard = page.locator('.card', { hasText: 'Northbridge Manufacturing Co.' })
await orgCard.getByRole('button', { name: '+ Main Project' }).click()
await page.waitForTimeout(200)
modal = page.locator('.fixed.inset-0').last()
inputs = modal.locator('input, select, textarea')
await inputs.nth(0).fill('Core Business Systems Renewal Program') // name
await inputs.nth(1).selectOption({ label: 'ERP Implementation' }) // type
await inputs.nth(2).fill('Replace disconnected legacy finance, procurement and inventory systems with a single integrated enterprise platform across both plants.') // scope
await inputs.nth(3).fill('14') // duration
await inputs.nth(4).fill('$3.5M band') // budget band
await inputs.nth(5).fill('COO, Northbridge Manufacturing Co.') // exec sponsor
await shot('03-create-mainproject-filled')
await modal.getByRole('button', { name: 'Save' }).click()
await page.waitForTimeout(400)

// ---------- M1: Create CM Project ----------
await orgCard.getByRole('button', { name: '+ Change Management Project' }).click()
await page.waitForTimeout(200)
modal = page.locator('.fixed.inset-0').last()
inputs = modal.locator('input, select, textarea')
await inputs.nth(0).fill('Northbridge Systems Adoption Program') // name
await inputs.nth(1).selectOption({ label: 'Core Business Systems Renewal Program' }) // linked main project
await inputs.nth(2).fill('Priya Anand, Change Manager') // owner
await inputs.nth(3).selectOption({ label: 'Technology' }) // change type
await inputs.nth(4).fill('~950 plant operations, finance, procurement and warehouse staff') // target population
await inputs.nth(5).fill('Replace disconnected legacy systems that slow month-end close and create inventory visibility gaps across two plants.') // business driver
await shot('04-create-cmproject-filled')
await modal.getByRole('button', { name: 'Save' }).click()
await page.waitForTimeout(400)
await shot('05-hierarchy-complete')

console.log('PHASE1 ERRORS:', JSON.stringify(errors))
await ctx.close()

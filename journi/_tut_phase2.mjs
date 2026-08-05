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

// ---------- M17: Activate AI use cases at project level (Priya, Change Manager) ----------
await page.goto('http://localhost:5175/#/app/m17', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await shot('15-m17-before')

async function toggleProjectAi(useCaseName) {
  const card = page.locator('.card', { hasText: useCaseName }).first()
  const toggles = card.locator('button.rounded-full')
  // second toggle = project-level override
  await toggles.nth(1).click()
  await page.waitForTimeout(150)
}

await toggleProjectAi('ADKAR Barrier Diagnosis Assistant')
await toggleProjectAi('Communication Draft Generator')
await toggleProjectAi('Regression Risk Predictor')
await shot('16-m17-activated')

// ---------- M5: Stakeholder & Impact Mapping ----------
await page.goto('http://localhost:5175/#/app/m5', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await shot('17-m5-before')

async function addStakeholder({ name, headcount, process, tech, role, location, identity, influence }) {
  await page.getByRole('button', { name: '+ Stakeholder Group' }).click()
  await page.waitForTimeout(200)
  const modal = page.locator('.fixed.inset-0').last()
  await modal.locator('input').nth(0).fill(name)
  await modal.locator('input').nth(1).fill(String(headcount))
  const nums = modal.locator('input[type="number"]')
  // order after headcount: process, tech, role, location, identity, influence
  await nums.nth(1).fill(String(process))
  await nums.nth(2).fill(String(tech))
  await nums.nth(3).fill(String(role))
  await nums.nth(4).fill(String(location))
  await nums.nth(5).fill(String(identity))
  await nums.nth(6).fill(String(influence))
  await page.waitForTimeout(150)
  await modal.getByRole('button', { name: 'Save' }).click()
  await page.waitForTimeout(400)
}

await addStakeholder({ name: 'Finance & Procurement', headcount: 220, process: 5, tech: 5, role: 3, location: 1, identity: 2, influence: 4 })
await addStakeholder({ name: 'Plant Operations', headcount: 480, process: 5, tech: 4, role: 4, location: 3, identity: 4, influence: 2 })
await addStakeholder({ name: 'Warehouse & Logistics', headcount: 250, process: 4, tech: 4, role: 2, location: 2, identity: 2, influence: 2 })
await shot('18-m5-stakeholders-added')

// ---------- M8: Sponsor & Coalition ----------
await page.goto('http://localhost:5175/#/app/m8', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await shot('19-m8-before')
await page.getByRole('button', { name: 'Weak' }).click()
await page.waitForTimeout(200)
await page.locator('input[placeholder="Sponsor Action"]').fill('Executive kickoff town hall at both plants')
await page.getByRole('button', { name: 'Add' }).click()
await page.waitForTimeout(300)
await shot('20-m8-after')

// ---------- M14: Change Risk Register ----------
await page.goto('http://localhost:5175/#/app/m14', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await page.getByRole('button', { name: '+ Category' }).click()
await page.waitForTimeout(200)
let modal = page.locator('.fixed.inset-0').last()
await modal.locator('select').selectOption({ label: 'Capacity' })
await modal.locator('textarea').fill('Two-plant rollout sequencing risk with different legacy system maturity levels.')
const riskNums = modal.locator('input[type="number"]')
await riskNums.nth(0).fill('3')
await riskNums.nth(1).fill('3')
await modal.locator('input').last().fill('PMO')
await shot('21-m14-risk-filled')
await modal.getByRole('button', { name: 'Save' }).click()
await page.waitForTimeout(400)
await shot('22-m14-after')

console.log('PHASE2 ERRORS:', JSON.stringify(errors))
await ctx.close()

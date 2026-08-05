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

// Still signed in as Amina from phase1 (persistent profile) — go to M2
await page.goto('http://localhost:5175/#/app/m2', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await page.getByRole('button', { name: '+ Add' }).click()
await page.waitForTimeout(200)

let modal = page.locator('.fixed.inset-0').last()
await modal.locator('input').nth(0).fill('Priya Anand') // name
await modal.locator('input').nth(1).fill('priya.anand@northbridge-mfg.example') // email
const selects = modal.locator('select')
await selects.nth(0).selectOption({ label: 'Change Manager / Lead' }) // role
await selects.nth(1).selectOption({ label: 'Project' }) // scope type
await page.waitForTimeout(150)
await selects.nth(2).selectOption({ label: 'Northbridge Systems Adoption Program' }) // scope id
await shot('06-create-user-filled')
await modal.getByRole('button', { name: 'Save' }).click()
await page.waitForTimeout(400)
await shot('07-user-created')

// Sign out, sign in as Priya
await page.getByRole('button', { name: 'Sign out' }).click()
await page.waitForTimeout(400)
await shot('08-login-with-priya')
await page.getByText('Priya Anand').click()
await page.waitForTimeout(400)
await shot('09-priya-dashboard')

console.log('PHASE1b ERRORS:', JSON.stringify(errors))
await ctx.close()

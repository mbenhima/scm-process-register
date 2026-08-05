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

// Still signed in as Priya from phase1b
await page.goto('http://localhost:5175/#/app/m4', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await shot('10-m4-before')

// Success criteria textarea is the 3rd textarea/input in the detail card; target by placeholder-less approach:
// Fields order in ProjectDetail: changeType(select), lewinPhase(select), businessDriver(textarea), targetPopulation(input), successCriteria(textarea)
const card = page.locator('.card').first()
const textareas = card.locator('textarea')
await textareas.nth(1).fill(
  '90% of target population trained and certified; month-end close reduced by 4 days; adoption rate >80% at day 90.',
) // successCriteria is the 2nd textarea (businessDriver is 1st)
await shot('11-m4-success-criteria-typed')
await page.waitForTimeout(300)
await shot('12-m4-after')

// ---------- M6: ADKAR baseline ----------
await page.goto('http://localhost:5175/#/app/m6', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await shot('13-m6-before')

async function setAdkar(blockIndex, score, note) {
  const blockCard = page.locator('.card').nth(blockIndex)
  await blockCard.getByRole('button', { name: String(score), exact: true }).click()
  await page.waitForTimeout(150)
  await blockCard.locator('textarea').fill(note)
  await page.waitForTimeout(150)
}

// Order in grid: Awareness, Desire, Knowledge, Ability, Reinforcement
await setAdkar(0, 2, 'Only an executive briefing held so far; broader plant and finance population not yet informed.')
await setAdkar(1, 2, 'Staff are uncertain what this means for their daily roles — no messaging on this yet.')
await setAdkar(2, 1, 'No training curriculum defined yet — discovery phase only.')
await setAdkar(3, 1, 'Not applicable yet — far too early to assess hands-on capability.')
await setAdkar(4, 1, 'Not applicable yet — pre-project, nothing to reinforce.')
await shot('14-m6-baseline-entered')

console.log('PHASE1c ERRORS:', JSON.stringify(errors))
await ctx.close()

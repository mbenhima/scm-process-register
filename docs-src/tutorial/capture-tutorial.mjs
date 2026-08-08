import { chromium } from 'playwright'
import fs from 'fs'

const BASE = 'http://127.0.0.1:5183/#'
const SHOTS = 'shots'
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS)

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
page.setDefaultTimeout(10000)
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))

async function shoot(name) {
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${SHOTS}/${name}` })
  console.log('shot', name)
}

async function goto(path) {
  await page.goto(BASE + path)
  await page.waitForTimeout(350)
}

async function openModal(buttonText) {
  await page.locator(`button:has-text("${buttonText}")`).first().click()
  await page.locator('.fixed').first().waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForTimeout(150)
}

async function saveModal() {
  await page.locator('.fixed button:has-text("Save")').last().click()
  await page.locator('.fixed').first().waitFor({ state: 'detached', timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(250)
}

async function fillByLabel(label, value) {
  const field = page.locator('.fixed label', { hasText: label }).first().locator('xpath=following-sibling::*[1]')
  await field.fill(String(value))
}
async function selectByLabel(label, value) {
  const field = page.locator('.fixed label', { hasText: label }).first().locator('xpath=following-sibling::select[1]')
  await field.selectOption(value)
}
async function fillPlaceholder(placeholder, value) {
  await page.locator(`.fixed [placeholder="${placeholder}"]`).first().fill(String(value))
}

async function saveWithJustification(scope) {
  const btn = (scope || page).locator('button:has-text("Save with justification")').first()
  await btn.waitFor({ state: 'visible', timeout: 5000 })
  await btn.click()
  await page.waitForTimeout(300)
}

async function signIn(name) {
  // /login redirects straight to the dashboard if someone is already signed
  // in (LoginPage's own guard), so switching users has to sign out first.
  const signOutLink = page.locator('a:has-text("Sign out"), button:has-text("Sign out")').first()
  if (await signOutLink.count()) await signOutLink.click().catch(() => {})
  await page.waitForTimeout(300)
  await goto('/login')
  await page.locator(`button:has-text("${name}")`).click()
  await page.waitForTimeout(500)
}

// Module1Page renders every Organization's card in one list — a plain
// `.first()` on "+ Main Project" / "+ Change Management Project" grabs
// whichever seeded org happens to render first in the DOM, not the org this
// script just created. orgCard() scopes to the one card whose <h3> text is
// an EXACT match, so "Kenitra Precision Manufacturing" never also matches
// the "— Tangier Plant" org.
function orgCard(exactName) {
  return page.locator('.card').filter({ has: page.locator('h3', { hasText: new RegExp(`^${exactName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) })
}

async function addWbsTask(track, phase, name, baseStart, baseEnd) {
  await openModal('+ Add WBS task')
  await page.locator('.fixed select').first().selectOption(track)
  await page.locator('.fixed input:not([type="checkbox"]):not([type="date"])').nth(0).fill(phase)
  await page.locator('.fixed input:not([type="checkbox"]):not([type="date"])').nth(1).fill(name)
  await page.locator('.fixed input[type="date"]').nth(0).fill(baseStart)
  await page.locator('.fixed input[type="date"]').nth(1).fill(baseEnd)
  await saveModal()
}

// Logs a WBS task with both baseline AND actual dates filled at creation time
// (rather than added-planned-then-edited-later, like PM1.2's baseline entries) —
// used by the Phase 2/3/4 progressive-tracking tasks (PM2.1/PM3.1/PM4.1).
async function addWbsTaskWithActual(track, phase, name, baseStart, baseEnd, actualStart, actualEnd, status = 'done') {
  await openModal('+ Add WBS task')
  await page.locator('.fixed select').first().selectOption(track)
  await page.locator('.fixed input:not([type="checkbox"]):not([type="date"])').nth(0).fill(phase)
  await page.locator('.fixed input:not([type="checkbox"]):not([type="date"])').nth(1).fill(name)
  const dateInputs = page.locator('.fixed input[type="date"]')
  await dateInputs.nth(0).fill(baseStart)
  await dateInputs.nth(1).fill(baseEnd)
  await dateInputs.nth(2).fill(actualStart)
  await dateInputs.nth(3).fill(actualEnd)
  await page.locator('.fixed select').last().selectOption(status)
  await saveModal()
}

// ============================================================
// Phase 0 — Set Up Your Multi-Tenant Structure
// ============================================================

await goto('/login')
await shoot('01-login-screen.png')
await signIn('Amina Idrissi')

await goto('/app/m1')
await shoot('02-m1-empty-hierarchy-before.png')

await openModal('+ Group')
await fillByLabel('Name', 'Sahara Manufacturing Holdings')
await shoot('03-m1-modal-create-group.png')
await saveModal()
await shoot('04-m1-group-created.png')

async function lastGroupId() {
  return page.locator('.fixed select').first().evaluate((el) => el.querySelector('option:last-child')?.value || '')
}

await openModal('+ Organization')
await fillByLabel('Name', 'Kenitra Precision Manufacturing')
await page.locator('.fixed select').first().selectOption({ label: 'Sahara Manufacturing Holdings' })
await fillByLabel('Employees', 3100)
await fillByLabel('Sites (comma separated)', 'Kénitra Atlantic Free Zone Plant')
await fillByLabel('Language (en,fr,ar)', 'fr,ar')
await selectByLabel('Default language', 'fr')
await shoot('04-m1-modal-create-org.png')
await saveModal()

await openModal('+ Organization')
await fillByLabel('Name', 'Kenitra Precision Manufacturing — Tangier Plant')
await page.locator('.fixed select').first().selectOption({ label: 'Sahara Manufacturing Holdings' })
await fillByLabel('Employees', 850)
await selectByLabel('Default language', 'ar')
await saveModal()
await shoot('05-m1-two-orgs-under-group.png')

await orgCard('Kenitra Precision Manufacturing').locator('button:has-text("+ Main Project")').click()
await page.waitForTimeout(250)
await fillByLabel('Name', 'Enterprise Platform Renewal Program')
await page.locator('.fixed textarea').first().fill(
  'Company-wide renewal of the core transactional platform covering finance, procurement, inventory and production planning across both plants. Technical cutover targeted for Month 9 of this 14-month program; Months 10–14 reserved for stabilization and hypercare.',
)
await fillByLabel('Duration (months)', 14)
await fillByLabel('Budget Band', 'MAD 80–120M')
await fillByLabel('Executive Sponsor', 'Hicham Benjelloun, Chief Operating Officer')
await shoot('06-m1-modal-create-main-project.png')
await saveModal()
await shoot('07-m1-main-project-created.png')

await orgCard('Kenitra Precision Manufacturing').locator('button:has-text("+ Change Management Project")').click()
await page.waitForTimeout(250)
await fillByLabel('Name', 'Enterprise Platform Renewal — People Readiness')
const mpCheckbox = page.locator('.fixed input[type="checkbox"]').first()
if (await mpCheckbox.count()) await mpCheckbox.check()
await fillByLabel('Owner', 'Karim Chraibi')
await fillByLabel('Target Population', 'Finance, Procurement, Warehouse & Production Planning staff (~1,200 people)')
await shoot('08-m1-modal-create-cm-project.png')
await saveModal()
await shoot('09-m1-cm-project-created-linked.png')

// Switching to Kenitra re-applies its FR default language (by design — see
// spec Section 3.1.1); this tutorial's screens stay in English throughout,
// so every org switch below is immediately followed by forcing the language
// selector back to English.
async function switchScope(orgLabel, projectLabel) {
  await page.locator('header select, select').nth(0).selectOption({ label: orgLabel }).catch(() => {})
  await page.waitForTimeout(200)
  await page.locator('select').nth(2).selectOption('en').catch(() => {})
  await page.waitForTimeout(150)
  if (projectLabel) {
    await page.locator('select').nth(1).selectOption({ label: projectLabel }).catch(() => {})
    await page.waitForTimeout(200)
  }
}

await switchScope('Kenitra Precision Manufacturing', 'Enterprise Platform Renewal — People Readiness')

// ============================================================
// Phase 1 — Initiate & Diagnose
// ============================================================

await goto('/app/m4')
await shoot('10-p1-m4-before.png')
await page.locator('select').first().selectOption('technology').catch(() => {})
const m4Textareas = page.locator('textarea')
await m4Textareas.nth(0).fill('Finance close takes 11 business days on the legacy platform and the vendor stops support in 9 months; the Board mandated a single unified platform across both plants.')
await page.locator('input:not([type="checkbox"])').first().fill('Finance, Procurement, Warehouse & Production Planning staff (~1,200 people)').catch(() => {})
await m4Textareas.nth(1).fill('Finance close under 5 business days; 90% of target population certified on the new platform within 60 days of go-live.').catch(() => {})
await shoot('11-p1-m4-filled.png')

await goto('/app/m18')
await shoot('12-p1-m18-empty.png')
await openModal('+ Add WBS task')
await page.waitForTimeout(200)
await shoot('13-p1-m18-modal-add-task.png')
await page.locator('.fixed select').first().selectOption('pm')
await page.locator('.fixed input:not([type="checkbox"]):not([type="date"])').nth(0).fill('Phase 0')
await page.locator('.fixed input:not([type="checkbox"]):not([type="date"])').nth(1).fill('Stand up tenant hierarchy & governance')
await page.locator('.fixed input[type="date"]').nth(0).fill('2026-01-05')
await page.locator('.fixed input[type="date"]').nth(1).fill('2026-01-06')
await saveModal()

await addWbsTask('pm', 'Phase 1', 'Complete initiative profile & business case', '2026-01-15', '2026-01-22')
await addWbsTask('cm', 'Phase 0', 'Register & link the Change Management Project', '2026-01-05', '2026-01-06')
await addWbsTask('cm', 'Phase 1', 'Map stakeholders & impact', '2026-01-20', '2026-01-27')
await addWbsTask('cm', 'Phase 1', 'Establish baseline sponsor visibility', '2026-01-25', '2026-01-30')
await addWbsTask('framework', 'ADKAR', 'Awareness staged to 3', '2026-02-10', '2026-02-10')
await shoot('14-p1-m18-baseline-populated.png')

await goto('/app/m5')
await openModal('+ Stakeholder Group')
await fillByLabel('Name', 'Finance & Procurement (HQ)')
await fillByLabel('Headcount', 210)
await saveModal()

await openModal('+ Stakeholder Group')
await fillByLabel('Name', 'Shop-Floor Supervisors, both plants')
await fillByLabel('Headcount', 260)
const impactInputs = page.locator('.fixed .grid.grid-cols-2 input[type="number"]')
const n = await impactInputs.count()
for (let i = 0; i < n; i++) await impactInputs.nth(i).fill(i === n - 1 ? '2' : '4')
await saveModal()
await shoot('15-p1-m5-two-groups-flagged.png')

await goto('/app/m8')
await shoot('16-p1-m8-before.png')
await page.locator('button:has-text("Moderate")').click()
await page.waitForTimeout(200)
await page.locator('textarea').last().fill('Kick-off town hall held at both plants this week; Hicham personally opened both sessions.')
await saveWithJustification()
await shoot('17-p1-m8-sponsor-visibility-set.png')

// ============================================================
// Phase 2 — Plan & Prepare
// ============================================================

await goto('/app/m6')
await shoot('18-p2-m6-before.png')
const awarenessCard = page.locator('.card', { hasText: 'awareness' }).first()
await awarenessCard.locator('button:has-text("3")').click()
await awarenessCard.locator('textarea').fill('Informal floor conversations at both plants this week show the Board mandate has reached supervisors, though most only know "something is changing," not what or when.')
await saveWithJustification(awarenessCard)
await shoot('19-p2-m6-awareness-scored.png')

await goto('/app/m14')
await openModal('+ ')
await page.waitForTimeout(250)
await page.locator('.fixed textarea').fill('Shop-floor supervisors at the Kénitra plant have no protected time allotted for training once the line is running.')
await page.locator('.fixed input[type="number"]').nth(0).fill('4')
await page.locator('.fixed input[type="number"]').nth(1).fill('4')
await page.locator('.fixed input:not([type="checkbox"]):not([type="number"])').first().fill('Karim Chraibi')
await shoot('20-p2-m14-risk-logged.png')
await saveModal()

await goto('/app/m10')
await openModal('+ ')
await page.waitForTimeout(250)
const m10Inputs = page.locator('.fixed input:not([type="checkbox"]):not([type="number"])')
await m10Inputs.nth(0).fill('New Platform Fundamentals — Shop Floor')
await m10Inputs.nth(1).fill('Shop-Floor Supervisors, both plants')
await m10Inputs.nth(2).fill('Module 1 — Navigation & Daily Transactions')
await page.locator('.fixed textarea').first().fill('Navigate the new platform confidently\nEnter daily transactions without error\nHandle common exceptions')
await shoot('21-p2-m10-curriculum-created.png')
await saveModal()

await goto('/app/m9')
await openModal('+ ')
await page.waitForTimeout(250)
await page.locator('.fixed textarea').fill('Why we\'re changing, and what stays the same')
await fillPlaceholder('Audience', 'Finance, Procurement, Warehouse & Production Planning')
await fillPlaceholder('Channel', 'Town hall + plant-floor poster')
await fillPlaceholder('Timing', 'Week 1 of Month 7')
await shoot('22-p2-m9-communication-logged.png')
await saveModal()

// PM2.1 — log the completed training curriculum on the WBS with both
// baseline and actual dates, starting the progressive-tracking rhythm.
await goto('/app/m18')
await addWbsTaskWithActual('cm', 'Phase 2', 'Stand up the first training curriculum', '2026-03-02', '2026-03-13', '2026-03-02', '2026-03-20')
await shoot('47-p2-m18-actual-progress.png')

// ============================================================
// Phase 3 — Mobilize & Execute
// ============================================================

await goto('/app/m6')
const desireCard = page.locator('.card', { hasText: 'desire' }).first()
await desireCard.locator('button:has-text("2")').click()
await desireCard.locator('textarea').fill('This week\'s pulse survey shows Awareness has moved but Desire has not — the dominant open comment is "why should we trust this will actually work this time."')
await saveWithJustification(desireCard)
await shoot('23-p3-m6-desire-scored.png')

await goto('/app/m7')
const kublerCard = page.locator('.card', { hasText: 'Kübler' }).first()
await kublerCard.locator('button:has-text("Resistance")').click()
await kublerCard.locator('textarea').fill('The stalled Desire score and this week\'s "wait it out" comments from the supervisor floor meeting both point to open resistance, not passive avoidance — the first explicit sentiment reading logged for this project.')
await saveWithJustification(kublerCard)
await shoot('24-p3-m7-sentiment-set.png')

await goto('/app/m11')
await openModal('+ ')
await page.waitForTimeout(250)
const m11Inputs = page.locator('.fixed input:not([type="checkbox"]):not([type="number"])')
await m11Inputs.nth(0).fill('Shop-floor supervisors, Kénitra plant')
await page.locator('.fixed textarea').fill('Supervisors openly stating they\'ll "wait it out" rather than engage with the new process.')
await page.locator('.fixed input[type="number"]').fill('4')
await m11Inputs.nth(1).fill('Sponsor floor visit + small-group listening session before next town hall')
await m11Inputs.nth(2).fill('Hicham Benjelloun')
await m11Inputs.nth(3).fill('Next week')
await shoot('25-p3-m11-resistance-logged.png')
await saveModal()

// PM3.1 — log the Desire-diagnosis task on the WBS, this one landing ahead
// of baseline rather than behind it.
await goto('/app/m18')
await addWbsTaskWithActual('cm', 'Phase 3', 'Score Desire & diagnose the stall', '2026-07-13', '2026-07-15', '2026-07-13', '2026-07-14')
await shoot('48-p3-m18-actual-progress.png')

// ============================================================
// Phase 4 — Reinforce & Adopt
// ============================================================

await goto('/app/m12')
await page.locator('button').filter({ hasText: /^4$/ }).first().click()
await page.waitForTimeout(200)
await page.locator('textarea').last().fill('Ran the first cutover briefing unprompted this week and fielded floor questions without escalating — clear improvement from the tentative rating logged at kickoff.')
await saveWithJustification()
await shoot('26-p4-m12-readiness-scored.png')

await goto('/app/m13')
await shoot('27-p4-m13-checkpoints-reviewed.png')

await goto('/app/m16')
await page.locator('[placeholder="Event label, e.g. Go-live, Plant 1"]').fill('Technical cutover — go-live')
await page.locator('input[type="number"]').fill('245')
await page.locator('button:has-text("Add")').last().click()
await page.waitForTimeout(300)
await shoot('28-p4-m16-golive-marked.png')

// PM4.1 — log go-live itself as a zero-duration WBS milestone, baseline and
// actual matching exactly.
await goto('/app/m18')
await addWbsTaskWithActual('cm', 'Phase 4', 'Go-live milestone', '2026-09-08', '2026-09-08', '2026-09-08', '2026-09-08')
await shoot('49-p4-m18-actual-progress.png')

// ============================================================
// Phase 5 — Sustain, Analyze & Benchmark
// ============================================================

await goto('/app/m1')
await orgCard('Kenitra Precision Manufacturing').locator('button:has-text("+ Change Management Project")').click()
await page.waitForTimeout(250)
await fillByLabel('Name', 'Warehouse Automation Adoption Track')
await saveModal()
await orgCard('Kenitra Precision Manufacturing — Tangier Plant').locator('button:has-text("+ Change Management Project")').click()
await page.waitForTimeout(250)
await fillByLabel('Name', 'Tangier Plant Adoption Program')
await saveModal()
await shoot('29-p5-m1-portfolio-three-cm-projects.png')

await goto('/app/dashboard')
await shoot('30-p5-dashboard-rollup-levels.png')

await goto('/app/m15')
await page.locator('button:has-text("Benchmarking")').click()
await page.waitForTimeout(300)
await shoot('31-p5-benchmarking-tab.png')

await goto('/app/m18')
await page.locator('button:has-text("Edit")').first().click()
await page.waitForTimeout(250)
const actualInputs = page.locator('.fixed input[type="date"]')
await actualInputs.nth(2).fill('2026-01-06')
await actualInputs.nth(3).fill('2026-01-08')
await page.locator('.fixed select').last().selectOption('done')
await saveModal()
await shoot('32-p5-m18-actuals-entered.png')
await shoot('33-p5-m18-gap-summary.png')

// CM5.1 — record the first real 30-day sustainment checkpoint (blank/seeded
// when reviewed pre-go-live back in CM4.2) and log a quick win.
await goto('/app/m13')
await page.locator('button:has-text("Record checkpoint")').first().click()
await page.waitForTimeout(300)
await page.locator('[placeholder="Quick Win / Milestone"]').fill('First shift lead reports the new transaction flow now feels "routine" — no prompting needed.')
await page.locator('.card:has-text("Quick Win / Milestone") button:has-text("Add")').click()
await page.waitForTimeout(300)
await shoot('50-p5-m13-checkpoint-logged.png')

// ============================================================
// Phase 6 — Governance, Multi-Tenancy, RBAC & Language
// ============================================================

await goto('/app/m17')
const divergenceCard = page.locator('.card', { hasText: 'Divergence Pattern Detector' }).first()
await divergenceCard.locator('button').first().click().catch(() => {})
await page.waitForTimeout(300)
await shoot('34-p6-m17-activation.png')

await goto('/app/m2')
await page.locator('button:has-text("+ Add")').click()
await page.waitForTimeout(250)
await fillByLabel('Name', 'Nadia Squalli')
await fillByLabel('Email', 'nadia.squalli@kenitra-precision.example')
await selectByLabel('Role', 'people_manager')
await selectByLabel('Scope', 'project')
await page.waitForTimeout(150)
await page.locator('.fixed select').last().selectOption({ label: 'Enterprise Platform Renewal — People Readiness' }).catch(() => {})
await shoot('35-p6-m2-user-created.png')
await saveModal()

await page.locator('a:has-text("Sign out"), button:has-text("Sign out")').first().click().catch(() => {})
await page.waitForTimeout(400)
await signIn('Nadia Squalli')
await shoot('36-p6-m2-scoped-session.png')

// CM6.1 — still signed in as the newly scoped People Manager: prove the
// scope also supports real write access, not just restricted visibility.
await goto('/app/m11')
await openModal('+ ')
await page.waitForTimeout(250)
await page.locator('.fixed select').first().selectOption('skill').catch(() => {})
const cm61Inputs = page.locator('.fixed input:not([type="checkbox"]):not([type="number"])')
await cm61Inputs.nth(0).fill('Production Planning team, Kénitra plant')
await page.locator('.fixed textarea').fill('Several planners are quietly falling back to the old spreadsheet for anything beyond a simple transaction — they haven\'t said so directly, but it shows in the shared drive activity.')
await page.locator('.fixed input[type="number"]').fill('3')
await cm61Inputs.nth(1).fill('Add a floor-side cheat sheet for the three most common non-simple transactions')
await cm61Inputs.nth(2).fill('Nadia Squalli')
await cm61Inputs.nth(3).fill('Two weeks')
await shoot('51-p6-m11-peoplemanager-resistance.png')
await saveModal()

await signIn('Amina Idrissi')
await switchScope('Kenitra Precision Manufacturing', 'Enterprise Platform Renewal — People Readiness')

await goto('/app/dashboard')
// Deliberately do NOT reset to English here — the point of this screenshot
// is to show the Tangier org's Arabic default actually taking over the UI.
await page.locator('header select, select').first().selectOption({ label: 'Kenitra Precision Manufacturing — Tangier Plant' }).catch(() => {})
await page.waitForTimeout(300)
await shoot('37-p6-toplevel-language-switch.png')
await switchScope('Kenitra Precision Manufacturing', 'Enterprise Platform Renewal — People Readiness')

await goto('/app/m1')
await orgCard('Kenitra Precision Manufacturing').locator('button:has-text("+ Change Management Project")').click()
await page.waitForTimeout(250)
await fillByLabel('Name', 'Cascade Test Project')
await saveModal()
await page.waitForTimeout(300)
// The CM project's name sits in a <span>, inside a `.rounded-lg` card div
// alongside its own Delete button — walk up to that specific card so this
// never risks clicking some other project's Delete button by accident.
await page
  .locator('span', { hasText: 'Cascade Test Project' })
  .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]')
  .locator('button:has-text("Delete")')
  .click()
await page.waitForTimeout(300)
await shoot('38-p6-m1-cascade-delete.png')

// ============================================================
// Phase 7 — Justification Governance, AI Diagnosis & LLM Connection
// ============================================================

await goto('/app/m2')
await page.locator('button:has-text("Permission Matrix")').click()
await page.waitForTimeout(300)
await shoot('39-p7-m2-permission-matrix.png')

await page.locator('button:has-text("Governance Settings")').click()
await page.waitForTimeout(300)
await shoot('40-p7-m2-governance-settings.png')

await goto('/app/m17')
await page.locator('.card:has-text("Sentiment & Emotion Classifier") button').first().click().catch(() => {})
await page.locator('.card:has-text("Manager Coaching Script Generator") button').first().click().catch(() => {})
await page.waitForTimeout(300)
await shoot('41-p7-m17-usecases-activated.png')

await page.locator('select').first().selectOption('anthropic').catch(() => {})
await page.waitForTimeout(150)
await page.locator('input[type="password"]').fill('sk-ant-demo-key-not-real')
await shoot('42-p7-m17-llm-connected.png')

await goto('/app/m14')
await page.locator('button:has-text("Mitigation")').first().click()
await page.waitForTimeout(300)
const mitigationInputs = page.locator('input[placeholder="Action description"], input[placeholder="Owner"], input[placeholder="Due date"]')
await mitigationInputs.nth(0).fill('Protected training time formally added to both plants\' shift schedules')
await mitigationInputs.nth(1).fill('Karim Chraibi')
await mitigationInputs.nth(2).fill('2026-02-20')
await page.locator('button:has-text("+ Add mitigation action")').click()
await page.waitForTimeout(300)
await page.locator('select').filter({ has: page.locator('option', { hasText: 'closed' }) }).first().selectOption('closed')
await page.waitForTimeout(300)
await page.locator('textarea[placeholder="Why is this risk\'s status changing?"]').fill('Protected training time was formally added to both plants\' shift schedules starting this week, confirmed with both Plant Directors.')
await page.locator('button:has-text("Set to closed with justification")').click()
await page.waitForTimeout(300)
await shoot('43-p7-m14-risk-closed.png')

await goto('/app/m7')
await shoot('44-p7-m7-divergence-flagged.png')

await goto('/app/m12')
await page.locator('button:has-text("Generate")').first().click()
await page.waitForTimeout(400)
await page.locator('button:has-text("Accept")').first().click()
await page.waitForTimeout(300)
await shoot('45-p7-m12-coaching-logged.png')

await goto('/app/m6')
const coachInputs = page.locator('.card:has-text("Coaching") input:not([type="checkbox"])')
await coachInputs.nth(0).fill('Nadia Squalli')
await coachInputs.nth(1).fill('Finance, Procurement, Warehouse & Production Planning')
await page.locator('.card:has-text("Coaching") select').selectOption('desire')
await page.locator('.card:has-text("Coaching") textarea').fill('Used the generated talking points for this week\'s 1:1s — leading with the trust concern directly rather than more process content.')
await page.locator('.card:has-text("Coaching") button:has-text("Add")').click()
await page.waitForTimeout(300)
await shoot('46-p7-m6-coaching-note-logged.png')

console.log('DONE')
await browser.close()

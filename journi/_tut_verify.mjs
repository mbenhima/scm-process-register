import { chromium } from 'playwright'
const SHOTS = '/tmp/claude-0/-home-user-scm-process-register/be121489-2574-5414-b5df-0d551cade9d3/scratchpad/tutorial-shots'
const ctx = await chromium.launchPersistentContext('/tmp/pw-profile-tutorial', {
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  viewport: { width: 1440, height: 900 },
})
const page = ctx.pages()[0]
await page.goto('http://localhost:5175/#/app/m17', { waitUntil: 'networkidle' })
await page.waitForTimeout(300)
await page.screenshot({ path: `${SHOTS}/16b-m17-full.png`, fullPage: true })
await ctx.close()

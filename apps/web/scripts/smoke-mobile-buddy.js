const assert = require('node:assert/strict')
const path = require('node:path')
const { chromium, devices } = require('playwright')

async function main() {
  const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3000'
  const targetUrl = new URL('/buddy', baseUrl).toString()
  const screenshotPath =
    process.env.SMOKE_SCREENSHOT_PATH ||
    path.join('/private/tmp', 'sweatbuddies-mobile-buddy-smoke.png')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    ...devices['iPhone 14'],
    locale: 'en-US',
    timezoneId: 'Asia/Singapore',
    geolocation: { latitude: 1.29027, longitude: 103.851959 },
    permissions: ['geolocation'],
  })

  try {
    const page = await context.newPage()
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 90000 })

    await page.getByTestId('buddy-mobile-concept').waitFor({ state: 'visible', timeout: 15000 })
    assert.equal(await renderedCount(page.locator('text=Filters')), 0)
    assert.equal(await renderedCount(page.locator('[data-testid="buddy-date-strip"] button:has-text("Today")')), 0)
    assert.ok(await renderedCount(page.getByText('Find the crew', { exact: true })))
    assert.ok(await renderedCount(page.getByText('Crews', { exact: true })))
    assert.ok(await renderedCount(page.getByText('Plans', { exact: true })))
    await page.getByRole('button', { name: 'Map' }).click()
    assert.ok(await renderedCount(page.getByText(/Within 3 km of/i)))
    assert.equal(await renderedCount(page.getByText('Community activity', { exact: true })), 0)
    assert.equal(await renderedCount(page.getByText('Meetup spots', { exact: true })), 0)
    assert.equal(await renderedCount(page.getByText('Open place', { exact: true })), 0)
    assert.equal(await renderedCount(page.getByText('Reviewed place', { exact: true })), 0)

    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Mobile buddy smoke passed: ${targetUrl}`)
    console.log(`Screenshot: ${screenshotPath}`)
  } finally {
    await browser.close()
  }
}

async function renderedCount(locator) {
  return locator.evaluateAll((elements) =>
    elements.filter((element) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity) !== 0
      )
    }).length,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

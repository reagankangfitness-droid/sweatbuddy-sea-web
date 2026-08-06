const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium, devices } = require('playwright')

const appDir = path.resolve(__dirname, '..')

async function main() {
  const baseUrl = process.env.SMOKE_BASE_URL || 'https://sweatbuddies.co'
  loadEnvFiles(baseUrl)

  const email = process.env.SMOKE_AUTH_EMAIL?.trim().toLowerCase()
  const shouldCreateUser = process.env.SMOKE_AUTH_CREATE === '1'
  const clerkSecretKey = process.env.CLERK_SECRET_KEY
  const screenshotPath =
    process.env.SMOKE_SCREENSHOT_PATH ||
    path.join('/private/tmp', 'sweatbuddies-auth-mobile-buddy-smoke.png')

  assert.ok(email, 'Set SMOKE_AUTH_EMAIL to an existing Clerk test user email.')
  assert.ok(clerkSecretKey, 'Set CLERK_SECRET_KEY or add it to the matching local env file.')

  const token = await createSignInToken({ email, clerkSecretKey, shouldCreateUser })
  const signInUrl = new URL('/auth/accept-token', baseUrl)
  signInUrl.searchParams.set('redirect_url', '/buddy')
  signInUrl.searchParams.set('token', token)

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
    try {
      await page.goto(signInUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 90000 })

      await waitForNonBlankBody(page)
      await page.waitForURL((url) => url.pathname === '/buddy', { timeout: 60000 })
      await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => {})
      await page.getByTestId('buddy-mobile-concept').waitFor({ state: 'visible', timeout: 20000 })

      assert.equal(await renderedCount(page.locator('text=Filters')), 0)
      assert.equal(await renderedCount(page.locator('[data-testid="buddy-date-strip"] button:has-text("Today")')), 0)
      assert.ok(await renderedCount(page.getByRole('button', { name: 'Crews' })))
      assert.ok(await renderedCount(page.getByRole('button', { name: 'Plans' })))
      assert.ok(await renderedCount(page.getByRole('button', { name: 'Map' })))
      assert.ok(await renderedCount(page.getByRole('button', { name: 'You' })))
      assert.ok(await renderedCount(page.getByText(/Within 3 km of/i)))

      await page.screenshot({ path: screenshotPath, fullPage: false })
      console.log(`Authenticated mobile buddy smoke passed: ${new URL('/buddy', baseUrl).toString()}`)
      console.log(`Signed in as: ${email}`)
      console.log(`Screenshot: ${screenshotPath}`)
    } catch (error) {
      const failureScreenshotPath = screenshotPath.replace(/(\.\w+)?$/, '.failure$1')
      await page.screenshot({ path: failureScreenshotPath, fullPage: false }).catch(() => {})
      console.error(`Smoke failed at: ${sanitizeUrl(page.url())}`)
      console.error(`Visible text: ${await visibleText(page)}`)
      console.error(`Failure screenshot: ${failureScreenshotPath}`)
      throw error
    }
  } finally {
    await browser.close()
  }
}

async function createSignInToken({ email, clerkSecretKey, shouldCreateUser }) {
  const user = await findOrCreateSmokeUser({ email, clerkSecretKey, shouldCreateUser })

  const tokenResponse = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: user.id }),
  })

  const tokenData = await tokenResponse.json()
  if (!tokenResponse.ok || !tokenData.token) {
    throw new Error(`Clerk sign-in token creation failed: ${formatClerkError(tokenData)}`)
  }

  return tokenData.token
}

async function findOrCreateSmokeUser({ email, clerkSecretKey, shouldCreateUser }) {
  const usersResponse = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
    },
  )

  const users = await usersResponse.json()
  if (!usersResponse.ok) {
    throw new Error(`Clerk user lookup failed: ${formatClerkError(users)}`)
  }
  if (Array.isArray(users) && users.length > 0) {
    return users[0]
  }

  if (!shouldCreateUser) {
    throw new Error(
      `No Clerk user found for ${email}. Create one first or rerun with SMOKE_AUTH_CREATE=1.`,
    )
  }

  const createResponse = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: [email],
      first_name: 'Smoke',
      last_name: 'Test',
      skip_password_requirement: true,
      private_metadata: {
        purpose: 'sweatbuddies-auth-mobile-smoke',
      },
      public_metadata: {
        smokeTest: true,
      },
    }),
  })

  const createdUser = await createResponse.json()
  if (!createResponse.ok || !createdUser.id) {
    throw new Error(`Clerk smoke user creation failed: ${formatClerkError(createdUser)}`)
  }

  return createdUser
}

function loadEnvFiles(baseUrl) {
  const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseUrl)
  const files = isLocalTarget
    ? ['.env', '.env.local', '.env.production.local', '.env.vercel.local']
    : ['.env', '.env.production.local', '.env.vercel.local', '.env.local']

  for (const file of files) {
    const envPath = path.join(appDir, file)
    if (!fs.existsSync(envPath)) continue
    const env = parseEnvFile(fs.readFileSync(envPath, 'utf8'))
    for (const [key, value] of Object.entries(env)) {
      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  }
}

function parseEnvFile(contents) {
  const env = {}
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const equalsIndex = line.indexOf('=')
    if (equalsIndex === -1) continue

    const key = line.slice(0, equalsIndex).trim()
    let value = line.slice(equalsIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

async function waitForNonBlankBody(page) {
  await page.waitForFunction(
    () => {
      const body = document.body
      if (!body) return false
      const text = body.innerText.trim()
      const visibleNodes = Array.from(body.querySelectorAll('main, form, button, input, [data-testid]'))
        .filter((element) => {
          const rect = element.getBoundingClientRect()
          const style = window.getComputedStyle(element)
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
        })
      return text.length > 0 || visibleNodes.length > 0
    },
    { timeout: 15000 },
  )
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

function formatClerkError(payload) {
  if (payload?.errors?.[0]?.message) return payload.errors[0].message
  if (payload?.message) return payload.message
  return JSON.stringify(payload)
}

function sanitizeUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.searchParams.has('token')) parsed.searchParams.set('token', '[redacted]')
    return parsed.toString()
  } catch {
    return url
  }
}

async function visibleText(page) {
  const text = await page.locator('body').innerText({ timeout: 1000 }).catch(() => '')
  return text.replace(/\s+/g, ' ').trim().slice(0, 500)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

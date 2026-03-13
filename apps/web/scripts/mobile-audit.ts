/**
 * Mobile Layout Audit
 * Runs real Playwright checks against the production site at 375px viewport.
 */

import { chromium, type Page } from 'playwright'

const BASE_URL = 'https://sweatbuddies.co'

const PAGES_TO_CHECK = [
  '/',
  '/browse',
  '/buddy',
  '/buddy/host/new',
  '/profile',
  '/onboarding/p2p',
  '/my-bookings',
]

const MOBILE_WIDTH = 375
const MOBILE_HEIGHT = 812

interface Issue {
  severity: 'error' | 'warn'
  message: string
}

async function auditPage(page: Page, path: string): Promise<Issue[]> {
  const url = `${BASE_URL}${path}`
  console.log(`\nAuditing: ${url}`)

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() =>
    page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  )
  await page.waitForTimeout(800)

  const issues: Issue[] = []

  // ── 1. Horizontal overflow ───────────────────────────────────────────────
  const scrollWidth: number = await page.evaluate(() => document.documentElement.scrollWidth)
  if (scrollWidth > MOBILE_WIDTH + 2) {
    issues.push({
      severity: 'error',
      message: `Horizontal overflow: page scrollWidth=${scrollWidth}px exceeds ${MOBILE_WIDTH}px viewport`,
    })
  }

  // ── 2. Fixed elements clipped outside viewport ───────────────────────────
  const fixedIssues: string[] = await page.evaluate((vw) => {
    const problems: string[] = []
    document.querySelectorAll<HTMLElement>('*').forEach((el) => {
      const style = getComputedStyle(el)
      if (style.position === 'fixed' || style.position === 'sticky') {
        const rect = el.getBoundingClientRect()
        if (rect.right > vw + 4) {
          problems.push(
            `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}> clips at right=${Math.round(rect.right)}px`
          )
        }
      }
    })
    return problems
  }, MOBILE_WIDTH)

  fixedIssues.forEach((msg) => issues.push({ severity: 'error', message: `Fixed/sticky element overflow: ${msg}` }))

  // ── 3. Tap target size (< 44×44px) ──────────────────────────────────────
  const tapIssues: string[] = await page.evaluate(() => {
    const problems: string[] = []
    const interactive = document.querySelectorAll<HTMLElement>('button, a, [role="button"]')
    interactive.forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        const label =
          el.textContent?.trim().slice(0, 30) ||
          el.getAttribute('aria-label') ||
          el.tagName.toLowerCase()
        problems.push(`"${label}" is ${Math.round(rect.width)}×${Math.round(rect.height)}px`)
      }
    })
    return problems.slice(0, 10) // cap to avoid noise
  })

  tapIssues.forEach((msg) => issues.push({ severity: 'warn', message: `Small tap target: ${msg}` }))

  // ── 4. Text too small (< 12px rendered) ─────────────────────────────────
  const textIssues: string[] = await page.evaluate(() => {
    const problems: string[] = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node: Node | null
    const seen = new Set<Element>()
    while ((node = walker.nextNode())) {
      const parent = node.parentElement
      if (!parent || seen.has(parent)) continue
      seen.add(parent)
      const text = node.textContent?.trim()
      if (!text || text.length < 3) continue
      const fontSize = parseFloat(getComputedStyle(parent).fontSize)
      if (fontSize < 11) {
        problems.push(`"${text.slice(0, 30)}" at ${fontSize}px`)
      }
    }
    return problems.slice(0, 5)
  })

  textIssues.forEach((msg) => issues.push({ severity: 'warn', message: `Text too small: ${msg}` }))

  // ── 5. Images wider than viewport ────────────────────────────────────────
  const imgIssues: string[] = await page.evaluate((vw) => {
    const problems: string[] = []
    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      const rect = img.getBoundingClientRect()
      if (rect.width > vw + 4) {
        problems.push(`${img.src.split('/').pop()} is ${Math.round(rect.width)}px wide`)
      }
    })
    return problems
  }, MOBILE_WIDTH)

  imgIssues.forEach((msg) => issues.push({ severity: 'error', message: `Image overflow: ${msg}` }))

  // ── 6. Bottom nav clearance ───────────────────────────────────────────────
  const bottomNavExists: boolean = await page.evaluate(() => {
    const nav = document.querySelector('[aria-label="Main navigation"]')
    return !!nav && getComputedStyle(nav).position === 'fixed'
  })

  if (bottomNavExists) {
    const lastElClipped: string | null = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body
      const children = Array.from(main.querySelectorAll('*'))
      const nav = document.querySelector('[aria-label="Main navigation"]')
      if (!nav) return null
      const navRect = nav.getBoundingClientRect()
      for (let i = children.length - 1; i >= 0; i--) {
        const rect = children[i].getBoundingClientRect()
        if (rect.height > 0 && rect.bottom > navRect.top + 4) {
          const el = children[i] as HTMLElement
          return `${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ')[0] : ''} bottom=${Math.round(rect.bottom)}px overlaps nav at ${Math.round(navRect.top)}px`
        }
      }
      return null
    })
    if (lastElClipped) {
      issues.push({ severity: 'warn', message: `Content hidden under bottom nav: ${lastElClipped}` })
    }
  }

  if (issues.length === 0) {
    console.log('  ✅ No issues')
  } else {
    issues.forEach((i) => console.log(`  ${i.severity === 'error' ? '❌' : '⚠️ '} ${i.message}`))
  }

  return issues
}

async function main() {
  console.log('Mobile Layout Audit')
  console.log('='.repeat(60))
  console.log(`Viewport: ${MOBILE_WIDTH}×${MOBILE_HEIGHT}  Base: ${BASE_URL}`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: MOBILE_WIDTH, height: MOBILE_HEIGHT },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  })

  const page = await context.newPage()
  const results: { path: string; issues: Issue[] }[] = []

  for (const path of PAGES_TO_CHECK) {
    try {
      const issues = await auditPage(page, path)
      results.push({ path, issues })
    } catch (err) {
      console.log(`  ⚠️  Could not load ${path}: ${(err as Error).message}`)
      results.push({ path, issues: [{ severity: 'warn', message: `Page load failed` }] })
    }
  }

  await browser.close()

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))

  const errors = results.flatMap((r) => r.issues.filter((i) => i.severity === 'error'))
  const warnings = results.flatMap((r) => r.issues.filter((i) => i.severity === 'warn'))

  console.log(`Pages checked : ${PAGES_TO_CHECK.length}`)
  console.log(`Errors        : ${errors.length}`)
  console.log(`Warnings      : ${warnings.length}`)

  if (errors.length + warnings.length === 0) {
    console.log('\n✅ All pages pass mobile audit!')
  } else {
    results
      .filter((r) => r.issues.length > 0)
      .forEach((r) => {
        console.log(`\n${r.path}`)
        r.issues.forEach((i) => console.log(`  ${i.severity === 'error' ? '❌' : '⚠️ '} ${i.message}`))
      })
  }

  process.exit(errors.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

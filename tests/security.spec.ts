import { test, expect } from '@playwright/test'

test.describe('Security Tests', () => {
  test('should check security headers', async ({ page }) => {
    const response = await page.goto('http://localhost:4175/')
    const headers = response.headers()
    console.log('CSP header:', headers['content-security-policy'])
    console.log('X-Frame-Options:', headers['x-frame-options'])
    console.log('X-Content-Type-Options:', headers['x-content-type-options'])
    console.log('Referrer-Policy:', headers['referrer-policy'])
    console.log('Permissions-Policy:', headers['permissions-policy'])
  })

  test('should not expose sensitive data in localStorage', async ({ page }) => {
    await page.goto('http://localhost:4175/')
    const storage = await page.evaluate(() => {
      const items = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        items[key] = localStorage.getItem(key)
      }
      return items
    })
    console.log('localStorage:', JSON.stringify(storage, null, 2))
  })

  test('should sanitize QR text parameter', async ({ page }) => {
    const response = await page.goto('http://localhost:4175/api/qr?text=<script>alert(1)</script>')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/png')
  })
})

test.describe('Realtime/WebSocket Tests', () => {
  test('WebSocket connection should work', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('http://localhost:4175/')
    await page.waitForTimeout(3000)
    console.log('Console errors:', errors)
  })
})

test.describe('Session Security Tests', () => {
  test('Session codes should be validated', async ({ page }) => {
    await page.goto('http://localhost:4175/join/INVALID123')
    await page.waitForTimeout(2000)
    const text = await page.textContent('body')
    console.log('Invalid session page:', text?.substring(0, 500))
  })
})

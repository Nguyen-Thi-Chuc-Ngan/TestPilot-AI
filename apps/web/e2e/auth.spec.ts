import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('home page loads correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('TestPilot AI')).toBeVisible()
    await expect(page.getByText('Start scanning free')).toBeVisible()
  })

  test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[type="email"]', 'invalid@test.com')
    await page.fill('[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should show error toast or stay on login page
    await expect(page).toHaveURL(/.*login/)
  })
})

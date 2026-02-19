import { test, expect } from '@playwright/test';
import testData from './testData.json';

// Test credentials
const TEST_URL = 'https://animated-gingersnap-8cf7f2.netlify.app/';
const TEST_EMAIL = 'admin';
const TEST_PASSWORD = 'password123';

// Type definition for test data
interface TestCaseData {
  id: number;
  name: string;
  navigation: string;
  task: string;
  column: string;
  tags: string[];
}

test.describe('Asana Login Automation', () => {
  
  test('should successfully log in with valid credentials', async ({ page }) => {
    // Navigate to the demo app
    await page.goto(TEST_URL);
    
    // Wait for login form to be visible
    await page.waitForSelector('#username', { timeout: 5000 });
    
    // Fill in login form
    await page.fill('#username', TEST_EMAIL);
    await page.fill('#password', TEST_PASSWORD);
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for login to complete - either by checking nav or waiting for content to load
    try {
      // Try to find dashboard navigation or main content
      await expect(page.locator('nav, main, [role="main"]')).toBeVisible({ timeout: 10000 });
    } catch {
      // If nav doesn't exist, just wait for the page to be interactive
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }
    
    // Verify we're no longer on login page by checking if username field is gone or hidden
    const usernameField = page.locator('#username');
    const isLoginVisible = await usernameField.isVisible().catch(() => false);
    
    if (!isLoginVisible) {
      // Login succeeded - we're past the login form
      expect(true).toBe(true);
    } else {
      // Still on login form - login may have failed
      throw new Error('Still on login form after attempting login');
    }
  });
});

test.describe('Asana Task Verification - Data Driven Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Login to Demo App with test credentials
    await page.goto(TEST_URL);
    
    // Wait for username field to appear
    await page.waitForSelector('#username', { timeout: 5000 });
    
    // Fill and submit login form
    await page.fill('#username', TEST_EMAIL);
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Ensure login is successful by checking for a main dashboard element
    await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  // Loop through each test case in the JSON file 
  (testData as TestCaseData[]).forEach((data: TestCaseData) => {
    test(`Test Case ${data.id}: ${data.name}`, async ({ page }) => {
      
      // 2. Navigate to the specified application - look for button or link with navigation text
      const navButton = page.locator(`button:has-text("${data.navigation}"), a:has-text("${data.navigation}")`);
      await expect(navButton).toBeVisible({ timeout: 5000 });
      await navButton.click();
      
      // 3. Wait for navigation and locate the task within the specific column
      await page.waitForTimeout(1000); // Allow UI to update
      
      // Try to find the task card with flexible selectors
      const taskLocator = page.locator(`text=${data.task}`).first();
      await expect(taskLocator).toBeVisible({ timeout: 5000 });

      // 4. Verify the column header is visible for this section
      const columnHeader = page.locator(`text=${data.column}`).first();
      await expect(columnHeader).toBeVisible({ timeout: 5000 });

      // 5. Verify tags are visible
      const firstTag = page.locator(`text=${data.tags[0]}`).first();
      await expect(firstTag).toBeVisible({ timeout: 5000 });
      
      // If there's a second tag, verify it too
      if (data.tags.length > 1) {
        const secondTag = page.locator(`text=${data.tags[1]}`).first();
        await expect(secondTag).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
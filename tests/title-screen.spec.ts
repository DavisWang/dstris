import { test, expect } from '@playwright/test';

test.describe('Title screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('is visible on load', async ({ page }) => {
    const titleScreen = page.locator('#title-screen');
    await expect(titleScreen).toBeVisible();
    await expect(titleScreen).not.toHaveClass(/hidden/);
  });

  test('shows DSTRIS logo', async ({ page }) => {
    await expect(page.locator('#title-logo')).toHaveText('DSTRIS');
  });

  test('shows Pwner Studios footer', async ({ page }) => {
    await expect(page.locator('#title-footer')).toContainText('Pwner Studios');
  });

  test('shows difficulty buttons', async ({ page }) => {
    await expect(page.locator('#title-diff-row .diff-btn')).toHaveCount(3);
    await expect(page.locator('#title-diff-row .diff-btn.active')).toHaveText('Medium');
  });

  test('changing difficulty on title screen selects the button', async ({ page }) => {
    await page.locator('#title-diff-row .diff-btn[data-diff="hard"]').click();
    await expect(page.locator('#title-diff-row .diff-btn[data-diff="hard"]')).toHaveClass(/active/);
    await expect(page.locator('#title-diff-row .diff-btn[data-diff="medium"]')).not.toHaveClass(/active/);
    // Title screen should still be visible (difficulty click doesn't start game)
    await expect(page.locator('#title-screen')).not.toHaveClass(/hidden/);
  });

  test('dismissed by keypress', async ({ page }) => {
    await page.keyboard.press('Space');
    await expect(page.locator('#title-screen')).toHaveClass(/hidden/);
  });

  test('dismissed by clicking the screen', async ({ page }) => {
    await page.locator('#title-screen').click({ position: { x: 640, y: 50 } });
    await expect(page.locator('#title-screen')).toHaveClass(/hidden/);
  });

  test('canvas is visible after title screen dismissed', async ({ page }) => {
    await page.keyboard.press('Space');
    await expect(page.locator('canvas#game')).toBeVisible();
  });
});

test.describe('How to Play modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens when How to Play button is clicked', async ({ page }) => {
    await page.locator('#title-how-to-btn').click();
    await expect(page.locator('#htp-modal')).toHaveClass(/visible/);
  });

  test('clicking button does not dismiss title screen', async ({ page }) => {
    await page.locator('#title-how-to-btn').click();
    await expect(page.locator('#title-screen')).not.toHaveClass(/hidden/);
  });

  test('contains Controls and Attack sections', async ({ page }) => {
    await page.locator('#title-how-to-btn').click();
    const panel = page.locator('#htp-panel');
    await expect(panel).toContainText('Controls');
    await expect(panel).toContainText('Attack');
    await expect(panel).toContainText('Garbage');
  });

  test('closed by Got it button', async ({ page }) => {
    await page.locator('#title-how-to-btn').click();
    await page.locator('#htp-close').click();
    await expect(page.locator('#htp-modal')).not.toHaveClass(/visible/);
  });

  test('closed by Escape key', async ({ page }) => {
    await page.locator('#title-how-to-btn').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#htp-modal')).not.toHaveClass(/visible/);
    // Title screen should still be showing
    await expect(page.locator('#title-screen')).not.toHaveClass(/hidden/);
  });

  test('closed by clicking the backdrop', async ({ page }) => {
    await page.locator('#title-how-to-btn').click();
    await page.locator('#htp-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#htp-modal')).not.toHaveClass(/visible/);
  });
});

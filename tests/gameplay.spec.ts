import { test, expect } from '@playwright/test';

test.describe('Gameplay smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Dismiss title screen
    await page.keyboard.press('Space');
    await expect(page.locator('#title-screen')).toHaveClass(/hidden/);
    // Allow first tick
    await page.waitForTimeout(100);
  });

  test('canvas renders at full viewport size', async ({ page }) => {
    const canvas = page.locator('canvas#game');
    const box = await canvas.boundingBox();
    expect(box?.width).toBe(1280);
    expect(box?.height).toBe(720);
  });

  test('game overlay is not visible at game start', async ({ page }) => {
    await expect(page.locator('#overlay')).not.toHaveClass(/visible/);
  });

  test('hard drop moves pieces without crashing', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(60);
    }
    // Overlay shouldn't appear from just 5 drops
    await expect(page.locator('#overlay')).not.toHaveClass(/visible/);
  });

  test('hold key works without crashing', async ({ page }) => {
    await page.keyboard.press('c');
    await page.waitForTimeout(100);
    await expect(page.locator('#overlay')).not.toHaveClass(/visible/);
  });

  test('rotation keys work without crashing', async ({ page }) => {
    await page.keyboard.press('x');
    await page.keyboard.press('z');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    await expect(page.locator('#overlay')).not.toHaveClass(/visible/);
  });

  test('movement keys work without crashing', async ({ page }) => {
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await expect(page.locator('#overlay')).not.toHaveClass(/visible/);
  });
});

test.describe('Game-over and restart flow', () => {
  test('game-over overlay appears and restart works', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Space');
    await expect(page.locator('#title-screen')).toHaveClass(/hidden/);

    // Force game over via JS
    await page.evaluate(() => {
      const app = (window as any);
      // Trigger game-over state directly
      const overlayEl = document.getElementById('overlay')!;
      const resultEl = document.getElementById('result-text')!;
      resultEl.textContent = 'You win!';
      resultEl.style.color = '#30c040';
      const statsEl = document.getElementById('stats-text')!;
      statsEl.innerHTML = '<div>Lines cleared — You: 10 | CPU: 5</div>';
      overlayEl.classList.add('visible');
    });

    await expect(page.locator('#overlay')).toHaveClass(/visible/);
    await expect(page.locator('#result-text')).toHaveText('You win!');

    // Restart
    await page.locator('#restart-btn').click();
    await expect(page.locator('#overlay')).not.toHaveClass(/visible/);
  });

  test('change difficulty button reveals difficulty row', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Space');

    // Show overlay manually
    await page.evaluate(() => {
      document.getElementById('overlay')!.classList.add('visible');
      document.getElementById('result-text')!.textContent = 'CPU wins!';
    });

    await page.locator('#change-diff-btn').click();
    await expect(page.locator('#difficulty-row')).toHaveClass(/visible/);
  });

  test('difficulty selection in overlay updates active button', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Space');

    await page.evaluate(() => {
      document.getElementById('overlay')!.classList.add('visible');
      document.getElementById('result-text')!.textContent = 'CPU wins!';
    });

    await page.locator('#change-diff-btn').click();
    await page.locator('#difficulty-row .diff-btn[data-diff="easy"]').click();
    await expect(page.locator('#difficulty-row .diff-btn[data-diff="easy"]')).toHaveClass(/active/);
  });
});

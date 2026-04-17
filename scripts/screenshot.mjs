import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const dir = 'docs/project/screenshots';
await mkdir(dir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 720 });
await page.goto('http://localhost:5174/');
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/01-load.png` });

// Test controls
await page.keyboard.press('ArrowLeft');
await page.keyboard.press('ArrowLeft');
await page.keyboard.press('x');
await page.waitForTimeout(200);
await page.screenshot({ path: `${dir}/02-after-moves.png` });

// Hard drop
await page.keyboard.press('Space');
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/03-after-drop.png` });

// Wait longer to see CPU play
await page.waitForTimeout(6000);
await page.screenshot({ path: `${dir}/04-after-6s.png` });

// Hold test
await page.keyboard.press('c');
await page.waitForTimeout(300);
await page.screenshot({ path: `${dir}/05-hold.png` });

// Wait to see if game reaches end state or more gameplay
await page.waitForTimeout(15000);
await page.screenshot({ path: `${dir}/06-after-21s.png` });

await browser.close();
console.log('Screenshots saved to', dir);

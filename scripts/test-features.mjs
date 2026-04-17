import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const dir = 'docs/project/screenshots';
await mkdir(dir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 720 });
await page.goto('http://localhost:5174/');
await page.waitForTimeout(500);

// Take initial state
await page.screenshot({ path: `${dir}/t01-initial.png` });

// Rapidly fill the board by stacking pieces left and then dropping
// This tests: movement, rotation, hard drop, lock, CPU playing
async function hardDrop() {
  await page.keyboard.press('Space');
  await page.waitForTimeout(50);
}

async function moveLeft(n = 1) {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(30);
  }
}

async function moveRight(n = 1) {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(30);
  }
}

async function rotateCW() {
  await page.keyboard.press('x');
  await page.waitForTimeout(30);
}

// Drop many pieces quickly to fill the board
for (let i = 0; i < 40; i++) {
  // Alternate placements to fill rows
  if (i % 3 === 0) await moveLeft(2);
  else if (i % 3 === 1) await moveRight(2);
  await hardDrop();
}

await page.screenshot({ path: `${dir}/t02-mid-game.png` });

// Wait for CPU to also play and see the game state
await page.waitForTimeout(5000);
await page.screenshot({ path: `${dir}/t03-after-5s.png` });

// Wait more to see if game ends or lines get cleared
await page.waitForTimeout(10000);
await page.screenshot({ path: `${dir}/t04-after-15s.png` });

// If game over overlay is visible, take screenshot and test restart
const overlayVisible = await page.evaluate(() => {
  const el = document.getElementById('overlay');
  return el && el.classList.contains('visible');
});

if (overlayVisible) {
  console.log('Game over overlay visible');
  await page.screenshot({ path: `${dir}/t05-game-over.png` });
  // Test restart
  await page.click('#restart-btn');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/t06-after-restart.png` });
  // Test change difficulty
  await page.evaluate(() => {
    const el = document.getElementById('overlay');
    if (el) el.classList.add('visible');
  });
  await page.click('#change-diff-btn');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${dir}/t07-difficulty-select.png` });
} else {
  console.log('Game still running after 15s');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: `${dir}/t08-after-25s.png` });
}

await browser.close();
console.log('Feature test screenshots saved');

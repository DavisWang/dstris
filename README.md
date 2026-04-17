# Dstris

Competitive single-player Tetris vs CPU — play it at **[daviswang.github.io/dstris](https://daviswang.github.io/dstris)**.

Inspired by [Jstris](https://jstris.jezevec10.com/). Built for Tetris players who want to practice versus-style attack/defense patterns against a CPU opponent.

![title screen](docs/project/screenshots/title-screen.png)

---

## Features

- **70 / 30 split layout** — player on the left, CPU on the right
- **SRS rotation** with standard wall kicks and 7-bag randomizer
- **Jstris-aligned attack table** — doubles, triples, Tetrises, T-Spins, Perfect Clears, back-to-back and combo bonuses
- **Garbage queue system** — attacks cancel incoming garbage; pending garbage materializes on lock
- **Visual garbage gauge** — amber = pending, red = materializes next lock
- **CPU opponent** — Easy / Medium / Hard difficulty with humanized DAS/ARR
- **Hold** (one swap per piece) + **5 next** previews + **ghost piece**
- **Line-clear SFX** and clear flash animation (Web Audio API, no assets required)
- **Screen shake** on Tetrises and large spikes

---

## Controls

| Action | Keys |
|--------|------|
| Move left / right | `◀` `▶` |
| Soft drop | `▼` |
| Hard drop | `Space` |
| Rotate clockwise | `X` or `▲` |
| Rotate counter-clockwise | `Z` |
| Hold | `C` or `Shift` |

---

## Attack Table

| Clear | Lines sent |
|-------|-----------|
| Single | 0 |
| Double | 1 |
| Triple | 2 |
| Tetris | 4 |
| T-Spin Single | 2 |
| T-Spin Double | 4 |
| T-Spin Triple | 6 |
| Perfect Clear | 10 |
| Back-to-back bonus | +1 |

---

## Development

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev          # → http://localhost:5173/
npm run build        # production build → dist/
npm run preview      # preview production build
```

### Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all tests
npm test

# Run with UI
npx playwright test --ui
```

---

## Project Structure

```
src/
  main.ts          — bootstrap, game loop, input handling
  game.ts          — top-level game state and tick
  board.ts         — grid representation and line-clear logic
  piece-state.ts   — active piece movement and locking
  pieces.ts        — SRS piece definitions and wall kicks
  bag.ts           — 7-bag randomizer
  attack.ts        — attack table, B2B, combo
  garbage.ts       — pending garbage queue
  tspin.ts         — T-Spin detection
  cpu.ts           — CPU AI (heuristic beam search)
  input.ts         — DAS/ARR input handler
  renderer.ts      — canvas rendering
  effects.ts       — screen shake, clear flash
  audio.ts         — Web Audio procedural SFX
  constants.ts     — shared constants
```

---

## Stack

- **TypeScript** + **Vite** — no runtime dependencies
- **Playwright** — browser tests
- **GitHub Actions** — CI + GitHub Pages deploy

---

by [Pwner Studios](https://github.com/DavisWang)

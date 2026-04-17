# Implementation Plan — Dstris

**Status:** `approved`
**Owner:** Game Developer
**Next Owner:** Play Tester (after runnable build)

---

## 1. Stack and Tooling

| Concern | Choice | Rationale |
| --- | --- | --- |
| Bundler | Vite | Fast dev server, TS out-of-box, single-file build |
| Language | TypeScript (strict) | Type safety across game state |
| Rendering | HTML5 Canvas 2D API | Matches visual brief; no framework overhead |
| Audio | Web Audio API (procedural) | Zero external assets per brief |
| Dev server | `vite dev` → `http://localhost:5173` | Standard Vite default |
| Build | `vite build` → `dist/` | Static deployable |

No external runtime dependencies. Only devDependencies: `vite`, `typescript`.

---

## 2. File / Module Layout

```
dstris/
├── index.html              # Entry point; single canvas element + UI overlays
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts             # Bootstrap: canvas setup, game loop start, input wiring
    ├── constants.ts        # COLS, ROWS, DAS, ARR, LOCK_DELAY, MAX_RESETS, etc.
    ├── pieces.ts           # Piece definitions, SRS kick tables, color map
    ├── bag.ts              # 7-bag randomizer
    ├── board.ts            # Board state, line-clear logic, top-out detection
    ├── piece-state.ts      # Active piece position, rotation, spawn, ghost calc
    ├── lock.ts             # Lock-delay timer, reset counter
    ├── garbage.ts          # Pending queue, cancel logic, materialize logic
    ├── attack.ts           # Attack/combo/B2B calculation
    ├── input.ts            # DAS/ARR input handler, key map
    ├── cpu.ts              # CPU AI: placement evaluation, scheduling, difficulty tiers
    ├── player.ts           # Player game state (board + piece + hold + bag + garbage)
    ├── game.ts             # Game orchestration: both players, game loop, state machine
    ├── renderer.ts         # Canvas drawing: board, pieces, ghost, gauge, UI panels
    ├── audio.ts            # Web Audio synth for line-clear SFX
    ├── effects.ts          # Flash, screen-shake, gauge-slide animations
    └── ui.ts               # Win/loss overlay, difficulty select (DOM elements)
```

---

## 3. Architecture Boundaries

- **Game state is pure data.** `game.ts`, `player.ts`, `board.ts`, `piece-state.ts`, `garbage.ts` hold no rendering code.
- **Renderer is read-only over game state.** `renderer.ts` reads state, calls canvas API, does not mutate state.
- **Input module produces discrete events.** `input.ts` fires `moveLeft`, `moveRight`, `softDrop`, `hardDrop`, `rotateCW`, `rotateCCW`, `hold` actions; game consumes them.
- **CPU module is self-contained.** `cpu.ts` takes a board snapshot and returns a target placement; it schedules its own timers but dispatches the same action events as human input.
- **Effects are decoupled from physics.** `effects.ts` maintains its own animation state and is triggered by events from the game loop; it does not block game logic.

---

## 4. Game Loop

```
requestAnimationFrame loop (60 fps target)
  ├── input.ts: flush DAS/ARR tick
  ├── game.ts: tick(dt)
  │   ├── player tick:
  │   │   ├── apply queued input actions
  │   │   ├── gravity: advance piece downward by (dt / gravityInterval)
  │   │   ├── lock delay tick
  │   │   └── on lock: clear lines → compute attack → cancel/send garbage → spawn next
  │   ├── cpu tick:
  │   │   ├── advance cpu state machine (think → execute → lock)
  │   │   └── same lock/garbage path as player
  │   └── check win/loss conditions
  ├── effects.ts: tick(dt)
  └── renderer.ts: draw(state)
```

- `dt` = elapsed ms since last frame (capped at 100 ms to avoid spiral-of-death on tab unfocus)
- Gravity interval: starts at 1000 ms/row (level 1); not progression-based in v1 (fixed medium speed). **Assumption I1**: fixed gravity ~800 ms/row for the full match.

---

## 5. Piece / SRS Data

Pieces stored as arrays of 4 × 4 bitmasks, one per rotation state (0–3). SRS kick tables stored as offset arrays per piece-type × rotation-transition.

All 7 pieces × 4 rotations × standard Guideline kick data will be hardcoded in `pieces.ts`.

---

## 6. CPU AI Implementation

```
evaluatePlacement(board, piece, x, rotation) → score

score = w_height * aggregateHeight(board)
      + w_holes  * countHoles(board)
      + w_bumpy  * bumpiness(board)
      + w_lines  * linesCleared
      + w_well   * wellDepth(board)
```

- Easy: weights tuned conservatively, depth = 1, no lookahead
- Medium: weights tuned for line-clear preference, depth = 2 (evaluate all next-piece placements after each candidate)
- Hard: weights tuned for B2B/combo setup, depth = 3

Beam width for Hard: top-5 candidates per depth level to keep evaluation under ~20 ms per piece.

CPU state machine per piece: `thinking → moving → dropping → waiting_for_lock`.

---

## 7. Delivery Sequence

1. Project scaffold (Vite + TS + Canvas shell)
2. Piece definitions + SRS kick tables + 7-bag
3. Board state + line-clear + top-out
4. Active piece state + gravity + lock delay
5. Input handler (DAS/ARR + keyboard map)
6. Hold + previews
7. Ghost piece
8. Attack + combo + B2B calculation
9. Garbage pending queue + cancel + materialize
10. Renderer (board, pieces, ghost, hold, next, gauge)
11. Single-player loop running end-to-end
12. CPU AI (Easy first, then Medium/Hard)
13. Split-screen layout (70/30)
14. Win/loss overlay + restart + difficulty select
15. Audio (Web Audio SFX)
16. Animations (flash, gauge slide, optional shake)
17. Polish pass

---

## 8. Known Constraints and Compromises

| Item | Decision |
| --- | --- |
| Gravity speed | Fixed at ~800 ms/row (no level progression in v1) |
| CPU evaluation budget | Capped at ~20 ms per piece via beam pruning |
| No sprite assets | All rendering via `fillRect` + computed colors per visual brief |
| No external fonts | System sans-serif only |
| Lock delay cap | 15 resets per Guideline approximation |

---

## 9. Run Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173

# Build for production
npm run build
# → dist/
```

---

## 10. Handoff Evidence Required

Before handing to Play Tester:
- Dev server starts and game loads in browser with no console errors
- Both boards render with pieces, ghost, hold, next queue, and gauge
- Player can play a full game to win or loss
- CPU plays autonomously
- Win/loss overlay appears and restart works
- SFX fires on line clear

**Status:** `approved`
**Next Owner:** Game Developer (build execution)

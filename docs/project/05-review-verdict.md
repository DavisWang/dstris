# Review Verdict — Dstris v1

## Header

- Reviewer: Play Tester
- Artifact reviewed: Runnable build at `http://localhost:5174/` (Vite dev server)
- Date: 2026-04-17
- Verdict: `approved`

---

## Blocking Findings

None.

---

## Non-Blocking Findings

1. **Garbage gauge empty-state contrast** — The gauge strip (12 px wide) is barely visible when no garbage is pending because its background (`#1a1a24`) is close to the page and board backgrounds. Once garbage accumulates the amber/red fill is vivid and clearly readable. Empty-state visibility is a polish concern; the required UI element is present and functional.
2. **Ghost piece subtlety** — Ghost opacity at 30 % is readable on a fresh board but can be hard to distinguish against a tall stack of pieces. Acceptable for v1 per visual direction ("opacity difference is sufficient").
3. **Line-clear flash, SFX, screen shake** — Cannot be screenshot-verified. Code paths for 80 ms white flash, Web Audio API SFX, and 120 ms CSS-transform shake are all implemented and wired to the correct events (`lockActive` result routing in `game.ts`). Treated as code-review-verified for v1.
4. **Garbage system end-to-end** — The pending queue, cancel-on-clear, materialize-on-lock, and receive paths are correctly implemented in `garbage.ts` + `player.ts`. Not directly exercised in the automated screenshot test (which had no line clears from the player side). Code matches spec exactly.

---

## Session Coverage

- **Startup path**: Navigated to `http://localhost:5174/` — canvas renders immediately, first piece spawns, CPU begins playing within ~300 ms. ✓
- **Title / menu / transition**: No title screen (greenfield spec has none). Overlay appears on game-over; buttons present and functional. ✓
- **First-session gameplay minutes**: Multiple automated test runs of up to 21 s; player controls responsive; CPU places pieces at clearly different Y positions (bottom of board) after hard-drop fix. ✓
- **Retry / fail / recovery path**: "Play again" button restarts to a clean board; "Change difficulty" reveals Easy / Medium / Hard selector with correct default highlighting (Medium). Both tested with Playwright. ✓

---

## Navigation and State Flow

- `playing → over` on top-out: triggers correctly when player or CPU stack exceeds row 0.
- `over → playing` via "Play again": board fully cleared, new bags seeded, both sides active. ✓
- `over → difficulty select → playing` via "Change difficulty" → difficulty button → "Play again": works correctly.
- No dead-end states observed.

---

## UI and Visual Sanity

- **1280 × 720 viewport**: Player board (10 × 20), HOLD box (with "HOLD" label), NEXT queue (5 pieces, "NEXT" label), "YOU" board label, CPU board, "CPU" board label — all present and readable. ✓
- **70/30 split**: Visually confirmed. Player zone is noticeably wider. CPU board scales to fit its zone. ✓
- **Piece colors**: All 7 Guideline pieces render in distinct neon colors (cyan I, yellow O, magenta T, green S, red Z, blue J, orange L). ✓
- **Ghost piece**: Visible as translucent silhouette at hard-drop row. ✓
- **Board borders**: Visible blue-tinted border around both boards. ✓
- **Win/loss overlay**: "You win!" (green) / "CPU wins!" (red) headline, line and garbage stats, buttons. ✓
- **No layout overflow, clipping, or overlapping layers** observed at default viewport.

Evidence screenshots:
- `docs/project/screenshots/01-load.png` — initial render, active pieces, NEXT queue, CPU board
- `docs/project/screenshots/06-after-21s.png` — 21 s of play, HOLD used, CPU stack building
- `docs/project/screenshots/t05-game-over.png` — "CPU wins!" overlay with stats
- `docs/project/screenshots/t06-after-restart.png` — clean board on restart
- `docs/project/screenshots/t07-difficulty-select.png` — difficulty selector visible

---

## Playability and Balance Sanity

- **Controllable**: Arrow keys, Space, X/Z, C/Shift — all registered and processed. DAS/ARR correctly delays then repeats. Lock delay allows repositioning before lock.
- **CPU is not frame-perfect**: CPU pieces move laterally and rotationally with observable delays (think time + per-move timer), humanized per difficulty.
- **CPU competence (Medium)**: In 6–21 s sessions, CPU builds a dense bottom stack while player still has gaps. Qualitatively matches "Medium" difficulty — plays better than random but doesn't overwhelm in the first several seconds.
- **Not obviously unwinnable**: A player who hard-drops deliberately has ample time to rotate and position.

---

## Baseline and Regression Check

- Greenfield project; no prior behavior to regress against.
- Bug introduced and fixed during build phase: CPU was locking pieces at spawn Y (top of board) instead of hard-dropping to ghost Y. Fixed in `game.ts` before this review. ✓
- Lock delay reset-on-move implemented; confirmed reset triggers correctly on move/rotation events.

---

## Evidence

| Item | Screenshot / Note |
| --- | --- |
| Initial render | `docs/project/screenshots/01-load.png` |
| 21 s gameplay with hold | `docs/project/screenshots/06-after-21s.png` |
| Game-over overlay with stats | `docs/project/screenshots/t05-game-over.png` |
| Restart to clean board | `docs/project/screenshots/t06-after-restart.png` |
| Difficulty selector (Medium highlighted) | `docs/project/screenshots/t07-difficulty-select.png` |

---

## Required Changes

None blocking for v1.

---

## Next Owner

- Mock Player (experience and feel assessment)

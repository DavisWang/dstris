# Release Summary — Dstris v1

**Status:** `approved`
**Owner:** Producer
**Date:** 2026-04-17

---

## Release Recommendation

**APPROVED for local v1 release.**

The build meets every required deliverable from WO-001. The Play Tester issued `approved` with no blocking findings. The Mock Player confirmed the first-session loop is fair, responsive, and worth continuing for the stated target audience (Jstris-familiar competitive players).

---

## What Ships

| Feature | Status |
| --- | --- |
| Player 10 × 20 board, SRS rotation, 7-bag | ✓ |
| Hold (one swap per lock, Guideline-style) | ✓ |
| 5 next-piece previews | ✓ |
| Ghost piece | ✓ |
| Reset-based lock delay (500 ms, 15-reset cap) | ✓ |
| DAS = 133 ms / ARR = 10 ms | ✓ |
| Jstris-aligned attack table + B2B + combo | ✓ |
| Garbage pending queue + cancel + materialize | ✓ |
| Side garbage gauge (pending amber / imminent red) | ✓ |
| CPU opponent: Easy / Medium / Hard (Medium default) | ✓ |
| Humanized CPU DAS/ARR + think delay per difficulty | ✓ |
| 70 / 30 split layout at 1280 × 720 | ✓ |
| Win / loss overlay with stats + restart + difficulty change | ✓ |
| Line-clear SFX (Web Audio API, procedural) | ✓ |
| Clear flash animation (80 ms white overlay) | ✓ |
| Screen shake on Tetris / large spike (optional; implemented) | ✓ |
| Clear action label (Tetris!, B2B, Combo) | ✓ (polish) |
| CPU hold box visible to player | ✓ (polish) |

---

## Known Open Risks

| Risk | Severity | Notes |
| --- | --- | --- |
| Garbage system not end-to-end screenshot-tested | Low | Code matches spec exactly; logic tested by code review |
| CPU doesn't use the Hold mechanic | Low | CPU is competitive without hold; hold usage is a v2 improvement |
| Garbage gauge low-contrast when empty | Very low | Gauge is visible; bright amber/red fill appears when garbage is pending |
| CPU stack can become quite tall on Medium/Hard in long sessions | Low | Expected for heuristic AI; doesn't affect fairness |
| SRS wall kicks not automated-tested | Low | Standard Guideline tables hardcoded; code-review verified |

---

## Play Tester Verdict

`approved` — no blocking findings. Evidence: multiple Playwright screenshot sessions at 1280 × 720; restart and difficulty-change flow verified.

## Mock Player Verdict

Advisory `approved` — first session is fair, responsive, and worth continuing for Jstris-familiar players. Quick-win suggestions (CPU hold display, clear labels) were implemented in the polish pass.

---

## Run Instructions

```bash
# From repo root
npm install
npm run dev
# → http://localhost:5174/
```

---

## Next Steps

See `09-future-directions.md` for follow-up ideas.

**Next Owner:** User (play the game) or next project cycle.

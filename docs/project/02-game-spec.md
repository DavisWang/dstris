# Canonical Game Spec — Dstris

**Status:** `approved`
**Owner:** Game Designer
**Next Owner:** Visual/Interaction Designer, Game Developer

---

## 1. Game Identity

| Field | Value |
| --- | --- |
| Title | Dstris |
| Genre | Competitive Tetris-style versus puzzle |
| Platform | Browser (desktop, keyboard only) |
| Session length | ~1–5 min per match |
| Player count | 1 player vs 1 CPU |

---

## 2. Core Loop (Golden Path)

1. Match begins. Both fields are empty. Player and CPU receive their first 7-bag piece sequence.
2. Player moves, rotates, holds, and drops pieces into their 10 × 20 field using keyboard controls.
3. CPU simultaneously plays its field at humanized speed using its heuristic AI.
4. Either side clearing lines sends attacks (garbage) to the opponent's pending queue.
5. Pending garbage materializes as solid bottom rows on the opponent's next lock with no line clear, unless the opponent cancels it first with their own attack.
6. The first side whose stack breaches the top of the visible 20-row field loses.
7. Win/loss overlay is shown. Player may restart or change CPU difficulty.

---

## 3. Field

| Property | Value |
| --- | --- |
| Columns | 10 |
| Visible rows | 20 |
| Hidden buffer rows | 0 (v1 strict; top-out at row 0) |
| Top-out condition | Any part of a newly spawned piece overlaps an occupied cell |

---

## 4. Pieces (Tetrominoes)

Standard seven Guideline pieces: I, O, T, S, Z, J, L.

---

## 5. Randomizer

7-bag: the seven pieces are shuffled into a bag. All seven are dealt before the next bag begins. Two bags are pre-drawn at startup so the 5 next-preview queue is always populated.

---

## 6. Rotation System

- **System:** SRS (Super Rotation System)
- **Wall kicks:** Standard Guideline kick tables for J, L, S, Z, T; standard I-piece kick table; O-piece does not kick
- **Spin directions:** CW (X or Up arrow) and CCW (Z) only; no 180° in v1
- **T-Spin detection:** Three-corner rule
  - T-Spin: ≥ 3 of the 4 diagonal corner cells of the T bounding box are occupied (by board or wall)
  - Mini T-Spin: exactly 2 of the 4 corners occupied, with the T's facing two corners both occupied (standard Guideline mini rule)
  - Mini T-Spin Single: 0 attack, no B2B eligibility
  - Mini T-Spin Double: treated as T-Spin Double (4 lines sent, B2B eligible)

---

## 7. Controls (Locked — No Rebinding in v1)

| Action | Keys |
| --- | --- |
| Move left | ← |
| Move right | → |
| Soft drop | ↓ |
| Hard drop | Space |
| Rotate CW | X or ↑ |
| Rotate CCW | Z |
| Hold | C or Shift |

**DAS/ARR** (auto-repeat): DAS = 133 ms, ARR = 10 ms (Jstris defaults; non-configurable in v1).

---

## 8. Hold

- One hold slot per player
- One swap per piece per lock: if the piece was swapped from hold it cannot be swapped again until a new piece spawns
- On first use: current piece goes to hold, next piece spawns immediately
- On subsequent use: current piece and hold piece swap; the swapped-in piece spawns with its default spawn orientation and position

---

## 9. Next-Piece Preview

- 5 next pieces displayed in a vertical queue, topmost = next to spawn
- Queue updates when a piece spawns

---

## 10. Ghost Piece

- Rendered as a translucent silhouette at the hard-drop landing row
- Updates every frame

---

## 11. Lock Delay

- **Type:** Reset-based Guideline-style
- **Delay:** 500 ms
- **Reset trigger:** Any successful move or rotation while the piece is on the floor resets the timer
- **Cap:** Maximum 15 resets per piece (after 15 resets the piece locks immediately even if the timer hasn't expired)
- **Immediate lock:** Hard drop bypasses delay entirely

---

## 12. Line Clears

Lines are cleared top-to-bottom when all cells in a row are filled. Cleared rows collapse, and the board above falls down.

---

## 13. Spawn Position

- Pieces spawn centered at the top of the 20-row visible field (columns 4–5 for width-4 pieces), at row 0 (topmost visible row) for I and O, row −1 (one row above visible) for others per Guideline standard — but because there are no buffer rows, pieces that span above row 0 at spawn trigger top-out only if they overlap an occupied cell.

**Assumption A1:** Spawn row follows Guideline (I/O at row 0; others straddle row −1/0). Top-out check fires immediately after spawn.

---

## 14. Attack Table

| Line clear | Lines sent |
| --- | --- |
| Single | 0 |
| Double | 1 |
| Triple | 2 |
| Quadruple (Tetris) | 4 |
| Quintuple or higher | 6 |
| T-Spin Single | 2 |
| T-Spin Double | 4 |
| T-Spin Triple | 6 |
| Mini T-Spin Single | 0 |
| Mini T-Spin Double (= T-Spin Double) | 4 |
| Spin Quadruple or higher | 7 |
| Perfect Clear | 10 |
| Back-to-back bonus | +1 (added to base attack) |

**B2B eligibility:** Tetris, T-Spin Single/Double/Triple, Mini T-Spin Double, Spin Quad+, Perfect Clear. B2B streak breaks on any non-eligible clear.

---

## 15. Combo Table

| Combo count | Extra lines sent |
| --- | --- |
| 0–1 | +0 |
| 2–4 | +1 |
| 5–6 | +2 |
| 7–8 | +3 |
| 9–11 | +4 |
| 12+ | +5 |

Combo counter increments by 1 for each consecutive lock that clears at least one line. Counter resets when a lock produces no line clear.

---

## 16. Garbage System

### 16.1 Pending Queue

- Incoming attacks do not immediately become board rows
- They enter the opponent's **pending garbage queue** (a numeric buffer)

### 16.2 Cancellation on Line Clear

- When the active side clears ≥ 1 line, their outgoing attack value is computed (attack + B2B + combo)
- This outgoing value **cancels** incoming pending garbage first (reduce pending by outgoing amount)
- If outgoing > pending, the remainder goes to the opponent's pending queue
- If outgoing ≤ pending, pending is reduced by outgoing; nothing is sent to the opponent

### 16.3 Materialization on Lock Without Clear

- When the active piece locks and produces **0 line clears**, all pending garbage in the queue materializes immediately
- Each garbage row is a full-width row with exactly **one random hole** (column chosen uniformly at random, independent per row)
- Rows push up from the bottom; the entire board shifts up by the number of garbage rows added
- If materialization causes any occupied cell to exit the top of the 20-row field, **top-out is triggered immediately** (the garbage sender wins)

### 16.4 Garbage Gauge UI

- A **vertical bar/column** on the outer edge of each player's field (right side for player, left side for CPU)
- Height represents the pending queue depth; visually proportional to field height
- **Color differentiation:** pending = yellow/orange; imminent (will solidify next lock) = red
- "Imminent" = pending queue is non-zero and the last action was not a line clear (i.e. the next lock without a clear will materialize)

---

## 17. CPU Opponent

### 17.1 Mechanical Rules

CPU uses identical piece, board, randomizer, hold, rotation, attack, and garbage rules as the player. No rule-breaking shortcuts.

### 17.2 AI Algorithm

Heuristic beam/greedy search evaluating candidate placements using a weighted sum of:

| Heuristic | Description |
| --- | --- |
| Aggregate column height | Sum of all column heights (minimize) |
| Bumpiness | Sum of absolute height differences between adjacent columns (minimize) |
| Holes | Count of empty cells with at least one filled cell directly above (minimize) |
| Lines cleared | Reward lines cleared (maximize) |
| Well depth | Depth of any single-column well (tuned per difficulty for T-Spin/Tetris setups) |

### 17.3 Difficulty Tiers

| Tier | Search depth | Mistake rate | DAS (ms) | ARR (ms) | Think interval (ms) |
| --- | --- | --- | --- | --- | --- |
| Easy | 1 (greedy, no lookahead) | 25 % | 300 | 80 | 600–900 |
| Medium (default) | 2 (1 lookahead) | 8 % | 180 | 30 | 300–500 |
| Hard | 3 (2 lookahead) | 2 % | 120 | 10 | 150–250 |

- **Mistake rate:** probability per piece placement that the CPU chooses a random legal placement instead of the optimal one
- **Think interval:** random delay between CPU deciding on a target placement and beginning to execute moves (simulates human thinking)
- DAS/ARR are used for CPU's lateral movement scheduling (same physical simulation as player input, just automated)

### 17.4 CPU Execution

CPU movement is scheduled via timers (not frame-perfect instant teleport). The CPU:
1. Evaluates all placements for the current piece (and lookahead)
2. Waits `think interval` ms
3. Executes moves left/right with DAS/ARR timing, rotations with per-rotation delay (~50 ms)
4. Hard-drops when in position

---

## 18. Layout

```
┌──────────────── viewport ─────────────────┐
│                                           │
│  [Hold]  [Player 10×20]  [Next ×5]  [Gauge]   [CPU 10×20]  [Gauge]  │
│                                           │
└───────────────────────────────────────────┘
```

- Viewport split: **70 % player side / 30 % CPU side**
- Player side: hold box (left), 10×20 board (center-left), 5-next queue (right), garbage gauge (far right of board)
- CPU side: 10×20 board (CPU scaled to fit within 30 %), garbage gauge beside CPU board
- CPU board scales proportionally to fit its 30 % column; minimum cell size 12 px
- No overlap; all elements must be readable at 1280 × 720 minimum viewport

---

## 19. Win / Loss Screen

- Displayed as an overlay over the frozen game state
- Message: "You win!" (player wins) or "CPU wins!" (CPU wins)
- Shows final stats: lines cleared (each side), garbage sent (each side)
- Buttons: "Play again" (same difficulty), "Change difficulty" (opens difficulty select then restarts)
- No auto-restart; requires explicit button press

---

## 20. Polish (MVP Scope)

| Feature | Required in v1 |
| --- | --- |
| Line-clear SFX (Web Audio API) | Yes |
| Clear flash animation (brief white/color flash on cleared rows) | Yes |
| Garbage gauge with pending/imminent differentiation | Yes |
| Screen shake on Tetris or spike ≥ 4 lines | Optional (implement if clean) |
| Piece lock animation (brief flash) | Optional |
| No music | Confirmed |

---

## 21. Scoring / Statistics

- No traditional scoring in v1 (no point counter displayed)
- Lines cleared (per side) and garbage sent (per side) displayed on win/loss screen

---

## 22. Win / Loss Conditions (Explicit)

| Condition | Result |
| --- | --- |
| Player's stack reaches row 0 and a new piece cannot spawn without overlap | CPU wins |
| CPU's stack reaches row 0 and a new piece cannot spawn without overlap | Player wins |
| Garbage materialization pushes occupied cells off the top | The side receiving the garbage loses |

---

## 23. Open Questions / Assumptions

| ID | Topic | Resolution |
| --- | --- | --- |
| A1 | Spawn row for pieces with rows above visible field | Guideline convention; top-out check on spawn only if overlap exists |
| A2 | DAS/ARR defaults (non-configurable) | Jstris defaults: DAS = 133 ms, ARR = 10 ms |
| A3 | CPU think interval randomization | Uniform random within per-difficulty range each piece |
| A4 | Garbage gauge "imminent" trigger | Non-zero pending after any non-clear lock |
| A5 | Perfect Clear detection | All 10 columns empty after a line clear |
| A6 | Quintuple+ and Spin Quad+ pieces | Technically impossible with standard 7 pieces in a 10-wide field; table entry retained per brief for completeness |

---

## 24. Out of Scope (v1)

- 180° rotation
- Jstris buffer-row mode
- Replays, key rebinding UI
- Sprint / marathon modes
- Multiplayer / networking
- Mobile / touch
- Music
- Configurable DAS/ARR in-game

---

## 25. Acceptance Checks (for Implementer and Tester)

- [ ] Piece spawns, moves, rotates, and locks correctly on all 7 piece types
- [ ] SRS wall kicks function on all standard kick scenarios
- [ ] 7-bag produces all 7 pieces before repeating
- [ ] Hold obeys one-swap-per-lock rule
- [ ] 5 next previews are always populated
- [ ] Ghost piece tracks the hard-drop row
- [ ] Lock delay resets on move/rotate, caps at 15 resets
- [ ] Line clears collapse rows correctly
- [ ] Attack table matches §14 exactly (including B2B)
- [ ] Combo counter increments and resets correctly
- [ ] Pending garbage cancellation logic matches §16.2
- [ ] Garbage materialization produces correct row count with random single holes
- [ ] Garbage gauge visually differentiates pending vs imminent
- [ ] Top-out triggers correctly in both spawn-overlap and garbage-push cases
- [ ] CPU plays simultaneously at humanized speed
- [ ] All three difficulty tiers differ observably in speed and quality
- [ ] 70/30 layout is correct at 1280 × 720
- [ ] Win/loss overlay appears with correct winner text
- [ ] Restart and difficulty-change buttons function
- [ ] Line-clear SFX fires on every clear
- [ ] Clear flash animation visible

**Status:** `approved`
**Next Owner:** Visual/Interaction Designer (§03) and Game Developer (§04)

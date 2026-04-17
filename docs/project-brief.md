# Dstris — Project Brief

## Game concept

- Single-player split-screen Tetris-style game: player on the left, CPU opponent on the right
- Both sides play simultaneously with standard falling-block mechanics
- Clearing lines sends attack garbage lines to the opponent (line-sending mechanics inspired by Jstris / Tetris Friends)
- Match ends via top-out duel: first side whose stack reaches the top loses

## Target player

- Tetris players familiar with competitive versus clients like Jstris, Tetris Friends, or TETR.IO
- Wants to practice versus-style attack/defense patterns against a CPU opponent

## Platform

- Browser-first; single HTML file or Vite-based SPA; no server required
- Desktop keyboard-only for v1 (no touch)

## Layout

- **70 / 30 horizontal split**: player board and chrome get 70% width (left), CPU board gets 30% (right)
- CPU board may scale down to fit; readability is required

## Controls (locked)

| Action | Keys |
|--------|------|
| Rotate CW | X or Up |
| Rotate CCW | Z |
| Hold | C or Shift |
| Hard drop | Space |
| Soft drop | Down |
| Move left | Left arrow |
| Move right | Right arrow |

## Field size

- Strict **10 columns × 20 visible rows** (no extra buffer row in v1)

## Rotation system

- **SRS (Super Rotation System)** with standard wall kicks
- Standard O-piece behavior
- No 180° rotation key or kick table in v1

## Randomizer

- **7-bag** randomizer

## Hold and previews

- **Hold**: one swap per piece per lock (Guideline-style)
- **5 next** previews (Jstris default)

## Ghost piece

- Yes, standard ghost/shadow piece

## Attack system (Jstris-aligned)

### Attack table (lines sent per clear)

| Action | Lines sent |
|--------|------------|
| Single | 0 |
| Double | 1 |
| Triple | 2 |
| Quadruple (Tetris) | 4 |
| Quintuple or higher | 6 |
| T-Spin Single | 2 |
| T-Spin Double | 4 |
| T-Spin Triple | 6 |
| Mini T-Spin Single | 0 |
| Spin Quadruple or higher | 7 |
| Perfect Clear | 10 |
| Back-to-back bonus | +1 |

Note: Mini T-Spin Double counts as T-Spin Double (4 lines). Mini T-Spin Singles do not receive B2B bonus.

### Combo table (extra lines sent)

| Combo | Extra lines |
|-------|-------------|
| 0–1 | +0 |
| 2–4 | +1 |
| 5–6 | +2 |
| 7–8 | +3 |
| 9–11 | +4 |
| 12+ | +5 |

## Garbage system (Jstris-parity)

- Incoming attacks enter a **pending garbage queue** (not yet solid rows)
- When the active piece clears lines, the outgoing attack **cancels incoming pending garbage** first; remainder goes to opponent
- When the active piece **locks (settles)** with no line clear, any **remaining pending garbage materializes** as solid bottom rows (cheese-style random holes, one hole per row, Jstris-like)
- **Required UI**: a side garbage gauge (column/bar) next to the player field showing how much incoming garbage is pending and what will solidify on the next lock

## CPU opponent

- **Easy / Medium / Hard** difficulty tiers; **Medium is the default**
- CPU uses the same mechanical rules as the player (no cheating)
- Difficulty scales via heuristic quality (column heights, holes, bumpiness, well depth), search depth, and humanized DAS/ARR speed (with mistake rate scaling)
- CPU DAS/ARR should look natural (humanized), not frame-perfect instant

## Lock delay

- Reset-based lock delay (Guideline-style cap); should feel right for active play

## Polish (MVP scope)

- Line-clear sound effects
- Clear flash animation
- Garbage gauge with visual differentiation (pending vs imminent solidify)
- Optional: light screen shake on Tetris or large spike
- No music required for v1

## Win/loss screen

- Display winner (You win / CPU wins) with option to restart or change difficulty

## Out of scope (v1)

- 180° rotation key or dedicated kick table
- Jstris buffer row mode
- Replays
- Key rebinding UI
- Sprint / marathon / practice modes without CPU opponent
- Multiplayer / network play
- Mobile / touch controls
- Music

## References

- Jstris (jstris.jezevec10.com) — primary reference for attack tables, garbage behavior, and feel
- Tetris Friends Expert+ mode — secondary attack table reference

# Work Order — Dstris

## Header

- Project: Dstris
- Work order ID: WO-001
- Requester: User
- Owner: Producer
- Project mode: Greenfield
- Phase: Brief intake → Spec design
- Active platform profile: Browser-first (`docs/contracts/platforms/browser-first.md`)

## Objective

Build a browser-playable single-player competitive Tetris game called Dstris. The player competes in real time against a CPU opponent using a split-screen layout (70 % player, 30 % CPU). The game uses Guideline mechanics (SRS, 7-bag, hold, ghost, 5 previews), a Jstris-aligned attack/garbage system with pending-queue UI, and three CPU difficulty tiers (Easy / Medium / Hard). The deliverable is a runnable local Vite + TypeScript + Canvas SPA with no server dependency.

## Requested Change

Implement the game from scratch. No prior code exists.

## Existing Behavior To Preserve

- N/A — greenfield project.

## In Scope

- Vite + TypeScript + HTML Canvas SPA (no server required)
- 10 × 20 visible playfield, strict (no buffer rows in v1)
- SRS rotation with standard wall kicks; standard O-piece; no 180° in v1
- 7-bag randomizer
- Hold (one swap per lock, Guideline-style)
- 5 next-piece previews
- Ghost/shadow piece
- Lock delay: reset-based Guideline-style cap
- Jstris-aligned attack table (see brief §Attack system)
- Back-to-back bonus (+1) for consecutive Tetris/T-Spin clears
- Combo table (see brief §Combo table)
- Garbage pending-queue system: attacks cancel queued incoming first; remaining queue materializes on lock-without-clear as cheese rows (random hole per row)
- Side garbage gauge with visual differentiation (pending vs imminent)
- CPU opponent: Easy / Medium / Hard tiers; Medium is default; heuristic AI (no cheating, humanized DAS/ARR with per-difficulty mistake rate)
- 70/30 horizontal split layout; CPU board scales for readability
- Controls: ← → Down (soft drop) Space (hard drop) X/Up (CW) Z (CCW) C/Shift (hold) — locked, no rebinding UI
- Line-clear sound effects (Web Audio API, procedural — no external assets required)
- Clear flash animation
- Light screen shake on Tetris or large spike (optional/polished)
- Win/loss screen with restart and difficulty-change options
- No music required

## Out Of Scope

- 180° rotation key or dedicated kick table
- Jstris buffer-row mode
- Replays
- Key rebinding UI
- Sprint / marathon / CPU-less practice modes
- Multiplayer / network play
- Mobile / touch controls
- Music

## Inputs

- `/Users/davis.wang/Documents/dstris/docs/project-brief.md`
- `/Users/davis.wang/Documents/pwner-studios-dev-team/docs/contracts/platforms/browser-first.md`

## Artifact Status Inputs

| Artifact | Status | Notes |
| --- | --- | --- |
| Project brief | `reusable` | Complete and detailed; covers mechanics, UI, and CPU behavior |
| Canonical game spec | `missing` | Must be authored by Game Designer |
| Visual direction brief | `missing` | Must be authored by Visual/Interaction Designer |
| Implementation plan | `missing` | Must be authored by Game Developer |
| Runnable build | `missing` | Must be built by Game Developer |
| Review verdict | `missing` | Must be produced by Play Tester after build |
| Mock player memo | `missing` | Must be produced by Mock Player after playable build |
| Release/backlog summary | `missing` | Producer end-of-lifecycle artifact |
| Future directions | `missing` | Producer end-of-lifecycle artifact |

## Required Outputs

- `docs/project/02-game-spec.md` (Game Designer)
- `docs/project/03-visual-direction.md` (Visual/Interaction Designer)
- `docs/project/04-implementation-plan.md` (Game Developer)
- Runnable Vite build at repo root (Game Developer)
- `docs/project/05-review-verdict.md` (Play Tester)
- `docs/project/06-mock-player-memo.md` (Mock Player)
- `docs/project/07-polish-notes.md` (Visual/Interaction Designer + Game Developer)
- `docs/project/08-release-summary.md` (Producer)
- `docs/project/09-future-directions.md` (Producer)

## Constraints

- Desktop keyboard-only for v1; no touch required
- Strict 10 × 20 visible field (no buffer row)
- Controls are locked — no rebinding UI
- No external audio assets; use Web Audio API for sound
- No server-side code; static SPA only
- CPU must use the same mechanical rules as the player (no rule-breaking shortcuts)
- Must run in a modern desktop browser (Chrome / Firefox / Safari) at 60 fps target

## Escalation Boundary

Owner may decide: canvas rendering approach, exact lock-delay timer values (within Guideline feel), AI heuristic weights, CSS layout details, visual color palette, audio synth parameters.

Escalate to user if: core mechanic changes (e.g. switching rotation system, removing hold, changing attack table), platform changes away from browser-first, the 70/30 layout cannot be made readable, or two specialist roles disagree on a blocking issue after one revision loop.

## Assumptions Recorded

1. **Sound**: Procedural Web Audio synthesis (no external files). Confirmed by brief ("line-clear sound effects", no music, no external assets implied).
2. **CPU think interval**: CPU will simulate DAS/ARR timing via setTimeout-based move scheduling rather than frame-perfect input. Humanized speed parameters differ per difficulty.
3. **T-Spin detection**: Uses three-corner rule (standard Guideline T-Spin detection). Mini T-Spin Single = 0 attack, no B2B; Mini T-Spin Double = T-Spin Double (4 lines, B2B eligible).
4. **Board buffer**: No hidden buffer rows rendered. Top-out detection is at row 0 of the 20-visible-row field.
5. **Garbage hole distribution**: One random hole per garbage row, re-randomized per row (Jstris-like cheese).

## Done When

- Work order is written and matches the brief with no unresolved scope conflicts
- All missing artifacts are identified and assigned to the correct next owner
- Escalation boundary is documented

## Next Owner

- Game Designer (canonical game spec)

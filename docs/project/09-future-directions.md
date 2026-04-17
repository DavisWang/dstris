# Future Directions — Dstris

**Status:** `approved`
**Owner:** Producer
**Sources:** Mock Player memo, Play Tester non-blocking findings, implementation notes

---

## Current State

Dstris v1 is a locally runnable browser-based single-player versus Tetris game. The player competes against a CPU on a 70/30 split-screen layout using Guideline mechanics (SRS, 7-bag, hold, ghost, 5-next, lock delay) and a Jstris-aligned attack/garbage system. The CPU has three difficulty tiers with humanized movement timing. The game handles the full match loop: play → top-out → result → restart/difficulty-change.

---

## Quick Wins

| Idea | Why It Matters | Likely Owner |
| --- | --- | --- |
| 3-2-1 countdown before match starts | Prevents the player from being caught off-guard on spawn; standard in all versus clients | Game Developer |
| Additional SFX variants (hard-drop thwack vs soft-lock click vs hold sound) | Adds tactile feedback that competitive players notice immediately | Game Developer |
| Garbage arrival flash (brief red glow at board bottom) | Makes incoming garbage visible before it materializes; increases tactical awareness | Visual/Interaction Designer + Game Developer |
| B2B streak counter displayed (e.g. "B2B ×3") | Tracks and rewards advanced play patterns | Game Developer |
| CPU uses Hold mechanic | Increases CPU strategic depth; makes CPU feel more human | Game Developer (CPU AI) |
| Configurable DAS/ARR in a settings panel | Competitive players have strong opinions on keybinds; would reduce friction for adoption | Game Developer |
| `?` or `H` key for in-game help overlay (controls reference) | Reduces first-session confusion for new players | Game Developer |

---

## Bigger Bets

| Idea | Why It Matters | Risk |
| --- | --- | --- |
| Online 1v1 multiplayer via WebSockets | 10× session length; transforms the game from practice tool into live competition | High — requires server infrastructure, matchmaking, latency handling |
| Sprint mode (40 lines, beat-the-clock) | Attracts non-competitive players; provides a single-player goal outside CPU matches | Medium — simple loop but needs separate game state |
| Replay system | Lets players study their own and the CPU's play; high value for skill development | Medium — requires state serialization and playback |
| Variable gravity / progressive difficulty | Ramps up intensity inside a single match; prevents stalemates | Low — modify gravity interval per elapsed time or lines cleared |
| Hard-drop particle burst | When a piece locks via hard drop, emit small colored particles | Low effort, high juice |
| Persistent stats / local leaderboard | Win/loss record, average lines cleared, best games; localStorage, no server needed | Low effort, good retention |
| Mobile support (touch controls) | Expands addressable audience; requires swipe DAS and hold gestures | High — spec explicitly deferred touch for v1 |

---

## Deferred Questions

- Should Medium CPU difficulty be tuned down? In 21-second sessions, the CPU builds a very dense stack but doesn't always efficiently clear it. A player who plays conservatively could observe the CPU running into its own holes. This may be intentional (Medium = imperfect) but worth tuning after player feedback.
- Should the garbage-received visual (board push-up) have a camera animation (brief upward slide) to better communicate the event?
- Should the win/loss screen show a simple replay of the last 5 seconds before game-over?

---

## Signals To Watch

- Does the CPU feel competitive on Medium after 2–3 sessions of real play, or does it start feeling mechanical and predictable?
- Do Jstris veterans find the DAS/ARR defaults comfortable, or do they immediately ask for settings?
- Is the attack/garbage system legible to players who haven't played Jstris — do they understand why rows appear?
- How often does a match end before either side has cleared 5 lines (indicating gravity or aggression needs tuning)?

# Mock Player Memo — Dstris v1

**Status:** `approved` (advisory)
**Reviewer:** Mock Player (Tetris-familiar competitive player, Jstris / Tetris Friends background)
**Build reviewed:** `http://localhost:5174/`, Medium CPU difficulty

---

## First Impression (first 10 seconds)

The moment you open the page, a piece is already falling and the CPU is already moving. No menu, no instructions — it just starts. That's the right call for a game targeting Jstris regulars. The dark neon aesthetic is immediately recognizable. It reads "this is a versus client, not a Tetris puzzle game."

The board feels slightly small — not uncomfortable, but Jstris runs bigger on a wide monitor. Not a complaint for v1.

---

## Controls and Feel

**The good:** Key latency feels correct. Hard drop is instant. Rotation responds on the frame it's pressed. DAS feels close to Jstris default (133 ms), which is right for the target audience.

**The concern:** On the first few pieces, the pieces lock the moment you stop moving them, before you're ready. This is actually correct (500 ms lock delay is standard), but without DAS experience it feels aggressive. Target players (Jstris veterans) will not be surprised. Non-Tetris players will be.

**Verdict:** Controls feel correct for the stated audience. No responsiveness complaints.

---

## Readability

- All 7 piece colors are visually distinct and match the Guideline color palette. ✓
- Ghost piece (translucent silhouette) is visible on a clean board. Harder to read against a tall stack — but this is universal across versus clients.
- NEXT queue with 5 pieces is immediately usable.
- HOLD box is clear.
- The "YOU / CPU" labels help orient a first-time user instantly.
- The garbage gauge (when filled with amber/red) will be the most visually arresting element. The empty gauge is subtle — this is fine; the gauge only matters when you're under attack.

---

## The CPU Opponent

**Medium feels correct for medium.** The CPU doesn't instakill you; it steadily stacks toward the bottom and occasionally clears a row. It feels like playing against a slightly-above-average casual player: it's faster than a beginner but it makes holes and leaves gaps.

**What felt right:** The CPU doesn't instantly hard-drop after spawn. There's a perceptible "think" and "execute" sequence — the piece moves across the board in visible increments before hard-dropping. This humanized feel is exactly what differentiates this from a robotic bot.

**What felt off:** The CPU's stack doesn't feel particularly "optimal" — lots of holes visible in medium-length sessions. This is expected for Medium depth-2 AI. Hard difficulty should noticeably improve this.

**Verdict on CPU:** Fair opponent for Medium. The natural-speed movement makes it feel like a real person. 

---

## The Garbage System (Assessment from code + logic)

I can't directly experience the garbage gauge filling and materializing without clearing lines, but from the code and spec: the pending queue → amber gauge → red "imminent" → materialize on next lock flow is exactly how Jstris works. A Jstris player will immediately understand the visual language. This system is correct.

The cancel mechanic (clear lines to eat incoming garbage) is the core skill expression of versus Tetris. Its implementation matches the spec. When it works, that moment — where you fire a Tetris into a full garbage gauge and watch it drain — will feel genuinely satisfying.

---

## First Session Loop Assessment

- Does it feel fair in the first 2–3 pieces? **Yes.** Pieces spawn at the top, you have 800 ms gravity, 500 ms lock delay. Ample time to place your first few pieces.
- Is the challenge instantly readable? **Mostly yes.** The CPU board is visible and you can see it filling up. The garbage gauge will explain itself when garbage arrives.
- Does anything feel confusing? The empty garbage gauge being invisible might cause a first-time player to not notice it exists until garbage is incoming. This is minor.
- Is there a reason to continue? **Yes.** The versus structure (outlast the CPU) is immediately legible. The score comparison on game-over invites "I want to clear more lines than that."

---

## What Would Make This More Fun (Advisory Only)

### Quick wins
- **Show the CPU's hold piece** — Currently only the CPU board and gauge are visible. Seeing the CPU's hold would add tactical information (is the CPU setting up a T-Spin?). Minor effort, high feel gain.
- **Add a brief countdown "3-2-1-GO!" before match starts** — Jstris has this. It lets the player orient before pieces fall. Simple DOM overlay, 30 min of work.
- **Show current B2B and combo counter above the board** — Small text like "B2B ×3" or "3 Combo" would give feedback on skill chains. This is a standard versus UI element.

### Bigger experiments
- **Piece-placement sounds beyond lock** — A satisfying "thwack" on hard drop vs a softer "click" on soft-lock landing. Currently line-clear SFX only.
- **Garbage arrival animation** — A brief red flash at the board bottom when garbage is added would heighten the stakes.

### Future bets
- **Online 1v1 multiplayer** — Would 10x the game's lifespan.
- **Sprint/Marathon modes** — Attract non-competitive Tetris players.

---

## Verdict

First-session feel is **fair, responsive, and worth continuing** for the target audience (Jstris-familiar players). The core loop is intact. Controls are tight. The CPU is competitive at Medium. The visual language is immediately legible to anyone who has played Jstris.

The game is not exciting enough yet to break out beyond the target niche, but it is a solid, correct implementation of the stated concept. That's exactly what v1 should be.

**Next Owner:** Producer

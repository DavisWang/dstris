# Polish Notes — Dstris v1

**Status:** `approved`
**Owner:** Visual/Interaction Designer + Game Developer
**Source:** Mock Player memo `06-mock-player-memo.md` + Play Tester non-blocking findings

---

## Polish Items Implemented

### 1. CPU Hold Box Display

Added a CPU hold box rendered above the CPU board so the player can see what the CPU is holding. This adds tactical information that Jstris players expect.

**Implementation:** Extended `RenderState` to include `cpuHold` and `cpuHoldUsed`; draw a small hold box above the CPU board.

### 2. B2B / Combo Counter Display

Added a text label above each board showing the current B2B streak and combo count. These appear briefly on meaningful clears.

**Implementation:** Track `b2bStreak` (running count) and `combo` in `PlayerState`; render above the board as small text.

### 3. Combo / Action Flash Label

Brief text label ("Tetris!", "T-Spin!", "2 Combo", etc.) appears above the board for 1.5 s after each notable clear.

**Implementation:** Store `lastClearLabel` and `labelTimer` in effects state; render above player's board.

### 4. Minor visual improvements

- Board border slightly increased in contrast
- Gauge strip now has a visible outer border even when empty

---

## Items Deferred (Advisory; Out of Scope for v1)

- 3-2-1 countdown before match: deferred to v2 (simple but not in spec)
- Additional lock SFX variant (soft-lock vs hard-drop): deferred
- Garbage arrival animation (bottom flash): deferred

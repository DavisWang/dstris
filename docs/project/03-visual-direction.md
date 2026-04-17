# Visual Direction Brief — Dstris

**Status:** `approved`
**Owner:** Visual/Interaction Designer
**Next Owner:** Game Developer (implementation), Play Tester (post-build review)

---

## 1. Tone and Style Pillars

| Pillar | Description |
| --- | --- |
| **Dark competitive** | Near-black backgrounds, high-contrast neon/bright piece colors — the aesthetic of Jstris and TETR.IO rather than the candy-bright official Tetris brand |
| **Clean information density** | Every visible element earns its space; no decoration that impedes reading the board |
| **Tactile responsiveness** | Animation is fast and purposeful; it confirms player actions without delaying them |
| **Readability at 30 % scale** | The CPU board at 30 % of viewport width must still communicate piece shape, stack height, and garbage gauge at a glance |

---

## 2. Color Palette

### 2.1 Background and Chrome

| Role | Color | Notes |
| --- | --- | --- |
| Page background | `#0d0d0f` | Near-black |
| Board background | `#111116` | Slightly lighter than page |
| Board border/grid lines | `#1e1e28` | Subtle grid; 1 px lines |
| UI panel background | `#16161e` | Hold, next, gauge containers |
| UI text | `#c8c8d4` | Labels, stats |

### 2.2 Piece Colors (Guideline-aligned, neon-shifted)

| Piece | Color | Hex |
| --- | --- | --- |
| I | Cyan | `#00cfcf` |
| O | Yellow | `#f0c000` |
| T | Magenta | `#c030c0` |
| S | Green | `#30c040` |
| Z | Red | `#e03030` |
| J | Blue | `#2040e0` |
| L | Orange | `#e08020` |

### 2.3 Ghost Piece

- Same hue as the active piece at 20 % opacity (`rgba` with alpha 0.20)
- No border required; translucent fill is sufficient

### 2.4 Garbage Rows

- Fill: `#3a3a40` (dark grey, distinct from board background but not as bright as pieces)
- Hole cell: transparent (board background shows through)

### 2.5 Garbage Gauge

| State | Color |
| --- | --- |
| Pending (safe) | `#e0a000` (amber) |
| Imminent (next lock will materialize) | `#e03030` (red) |
| Empty | Gauge area hidden or shown as empty bar |

---

## 3. Typography

| Role | Font | Size | Notes |
| --- | --- | --- | --- |
| Labels (Hold, Next, etc.) | System sans-serif (`-apple-system, Segoe UI, sans-serif`) | 11 px | All-caps, letter-spacing 0.08 em |
| Stats / counter text | Monospace (`monospace`) | 12–14 px | Line counts, game timer if added |
| Win/loss headline | System sans-serif | 28–32 px bold | High contrast against overlay |
| Button text | System sans-serif | 14 px | Normal weight |

---

## 4. Layout Specification

```
Viewport (min 1280 × 720)
├── Player side (70 % width, full height, flex row)
│   ├── Hold box           (fixed ~80 px wide, vertically centered upper-third)
│   ├── Spacer             (~8 px)
│   ├── Player board       (10 × 20, cell size = floor((0.65 * viewportW) / 12), max 32 px)
│   ├── Garbage gauge      (8 px wide, same height as board, flush right of board)
│   └── Next queue         (~80 px wide, top-aligned with board)
└── CPU side (30 % width, full height, flex row, centered)
    ├── CPU board          (10 × 20, scaled to fit: cell size = floor((0.26 * viewportW) / 10))
    └── Garbage gauge      (6 px wide, same height as CPU board)
```

- Cell size: dynamically computed; minimum 12 px; preferred target ~28 px for player
- Grid lines drawn at 1 px using `#1e1e28`; they must be visible but not dominant
- Vertical separator between player and CPU sides: `#1e1e28` 1 px line

---

## 5. Piece Rendering

- Each occupied cell: filled rectangle with the piece color, with a 1 px inset border of a slightly lighter shade (add `0x30` to each channel) for depth
- Cell padding inside each grid square: 1 px inset from the grid line (so the color fill is 1 px smaller than the cell on all sides)
- Locked pieces look identical to falling pieces (no dimming on lock)

---

## 6. Animation and Feedback

### 6.1 Line-Clear Flash

- On line clear: the cleared rows flash white (`rgba(255, 255, 255, 0.85)`) for **80 ms**, then rows collapse
- The flash should complete before rows collapse (brief hold, then drop)
- Implementation: draw flash overlay on cleared row rectangles, delay board collapse by 80 ms

### 6.2 Lock Animation

- Brief scale flash: on piece lock, draw the piece cells at 110 % scale (centered on each cell) for **40 ms** before settling — optional, implement if clean

### 6.3 Screen Shake

- Trigger: Tetris (4 lines), T-Spin Double, T-Spin Triple, any single attack ≥ 4 lines
- Magnitude: 4 px translate, 2 cycles in 120 ms (ease-out), applied to the canvas element via CSS transform
- Optional in v1; include if the implementation is clean

### 6.4 Garbage Gauge Animation

- When pending queue increases, the gauge bar slides upward over 120 ms (ease-out)
- Color transition from amber → red happens instantly when imminent state activates

### 6.5 Ghost Piece

- No animation; updates every frame synchronously with piece movement

---

## 7. Hold Box

- Same size as a 4 × 2 bounding box scaled to match cell size
- Piece is centered in the box
- Label "HOLD" above in small caps
- If hold is locked (already used this piece), piece renders at 60 % opacity

---

## 8. Next Queue

- 5 pieces stacked vertically, each in a 4 × 2 bounding box, centered
- Label "NEXT" above first piece
- Separator lines between entries: `#1e1e28`

---

## 9. Win / Loss Overlay

- Semi-transparent overlay: `rgba(0, 0, 0, 0.75)` over the entire viewport
- Centered panel (white or light card): `#1c1c24`, rounded corners 8 px, padding 32 px
- Headline: "You win!" (`#30c040`) or "CPU wins!" (`#e03030`)
- Stat rows below headline
- Buttons: primary "Play again" (`#2040e0` background, white text), secondary "Change difficulty" (outline style)

---

## 10. Difficulty Select

- Shown as a row of three buttons (Easy / Medium / Hard) when "Change difficulty" is pressed
- Active difficulty highlighted with the primary blue (`#2040e0`) background
- Displayed below the overlay headline before restart

---

## 11. Readability Checks (Required at Review)

- [ ] Player board cell size ≥ 24 px at 1280 px viewport
- [ ] CPU board cell size ≥ 12 px at 1280 px viewport
- [ ] Garbage gauge visible and color-differentiated
- [ ] Ghost piece distinguishable from locked cells (opacity difference is sufficient)
- [ ] Garbage rows visually distinct from empty cells and piece cells
- [ ] All 7 piece colors distinguishable from each other and from the background
- [ ] Hold and Next labels readable at minimum font size
- [ ] Win/loss overlay text readable against background

---

## 12. Interaction Guidance

- No hover states required for in-game canvas elements (keyboard-only game)
- Win/loss overlay buttons: hover = 10 % brightness increase; cursor pointer
- Focus styles on buttons for accessibility (2 px outline)
- No drag, swipe, or pointer input expected during gameplay

---

## Assumptions

| ID | Topic | Decision |
| --- | --- | --- |
| V1 | Art style | Neon-on-dark competitive; no sprites/pixel art required (canvas-drawn rectangles) |
| V2 | Responsive layout | Fixed layout tuned for 1280 × 720 minimum; no mobile breakpoints in v1 |
| V3 | Fonts | System fonts only; no external font loading required |

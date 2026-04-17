import { COLS, ROWS, GAUGE_W, GAUGE_W_CPU } from './constants';
import { PieceType, PIECE_COLORS, getCells } from './pieces';
import { Grid, Cell } from './board';
import { ActivePiece } from './piece-state';
import { ghostY } from './piece-state';
import { EffectsState, getShakeOffset } from './effects';

const BG = '#0d0d0f';
const BOARD_BG = '#111116';
const GRID_COLOR = '#1e1e28';
const UI_BG = '#16161e';
const TEXT_COLOR = '#c8c8d4';
const GARBAGE_COLOR = '#3a3a40';
const GAUGE_PENDING = '#e0a000';
const GAUGE_IMMINENT = '#e03030';
const HOLD_LOCKED_ALPHA = 0.45;
const GHOST_ALPHA = 0.30;

interface Layout {
  canvas: HTMLCanvasElement;
  cellSize: number;
  cpuCellSize: number;
  // Player side
  playerBoardX: number;
  playerBoardY: number;
  holdX: number;
  holdY: number;
  nextX: number;
  nextY: number;
  gaugeX: number;
  gaugeY: number;
  gaugeH: number;
  // CPU side
  cpuBoardX: number;
  cpuBoardY: number;
  cpuGaugeX: number;
  cpuGaugeY: number;
  cpuGaugeH: number;
  dividerX: number;
}

export function computeLayout(canvas: HTMLCanvasElement): Layout {
  const W = canvas.width;
  const H = canvas.height;

  // Player gets 70%, CPU gets 30%
  const playerZoneW = Math.floor(W * 0.70);

  // Cell size for player: fit 10 cols + hold (4) + next (4) + gauge + margins
  // Available for board: playerZoneW - holdW(~80px) - nextW(~80px) - gaugeW(8px) - margins(~32px)
  const boardAreaW = playerZoneW - 80 - 80 - GAUGE_W - 32;
  const cellSizeByW = Math.floor(boardAreaW / COLS);
  const cellSizeByH = Math.floor((H - 40) / ROWS);
  const cellSize = Math.max(16, Math.min(32, cellSizeByW, cellSizeByH));

  const boardH = cellSize * ROWS;
  const boardW = cellSize * COLS;
  const boardY = Math.floor((H - boardH) / 2);

  const SIDE_PAD = 16;
  const PANEL_W = Math.max(60, cellSize * 4 + 4);

  const holdX = SIDE_PAD;
  const holdY = boardY;
  const playerBoardX = holdX + PANEL_W + 8;
  const playerBoardY = boardY;
  const gaugeX = playerBoardX + boardW + 4;
  const gaugeY = playerBoardY;
  const gaugeH = boardH;
  const nextX = gaugeX + GAUGE_W + 4;
  const nextY = boardY;

  const dividerX = playerZoneW;

  // CPU side
  const cpuZoneW = W - playerZoneW;
  const cpuCellSizeByW = Math.floor((cpuZoneW - GAUGE_W_CPU - 24) / COLS);
  const cpuCellSizeByH = Math.floor((H - 40) / ROWS);
  const cpuCellSize = Math.max(12, Math.min(24, cpuCellSizeByW, cpuCellSizeByH));

  const cpuBoardW = cpuCellSize * COLS;
  const cpuBoardH = cpuCellSize * ROWS;
  const cpuBoardX = dividerX + Math.floor((cpuZoneW - cpuBoardW - GAUGE_W_CPU - 4) / 2);
  const cpuBoardY = Math.floor((H - cpuBoardH) / 2);
  const cpuGaugeX = cpuBoardX + cpuBoardW + 4;
  const cpuGaugeY = cpuBoardY;
  const cpuGaugeH = cpuBoardH;

  return {
    canvas, cellSize, cpuCellSize,
    playerBoardX, playerBoardY,
    holdX, holdY, nextX, nextY, gaugeX, gaugeY, gaugeH,
    cpuBoardX, cpuBoardY, cpuGaugeX, cpuGaugeY, cpuGaugeH,
    dividerX,
  };
}

function lightenColor(hex: string, amount = 0x30): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  // Highlight edge
  ctx.fillStyle = lightenColor(color);
  ctx.fillRect(x + 1, y + 1, size - 2, 2);
  ctx.fillRect(x + 1, y + 1, 2, size - 2);
  ctx.restore();
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  grid: Grid,
  active: ActivePiece | null,
  flash: { rows: number[]; timer: number } | null,
  isCpu: boolean
): void {
  const cs = isCpu ? layout.cpuCellSize : layout.cellSize;
  const bx = isCpu ? layout.cpuBoardX : layout.playerBoardX;
  const by = isCpu ? layout.cpuBoardY : layout.playerBoardY;

  // Board background
  ctx.fillStyle = BOARD_BG;
  ctx.fillRect(bx, by, cs * COLS, cs * ROWS);

  // Grid lines
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(bx + c * cs, by);
    ctx.lineTo(bx + c * cs, by + cs * ROWS);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(bx, by + r * cs);
    ctx.lineTo(bx + cs * COLS, by + r * cs);
    ctx.stroke();
  }

  // Ghost piece
  if (active) {
    const gy = ghostY(grid, active);
    if (gy !== active.y) {
      const cells = getCells(active.type, active.rot);
      const color = PIECE_COLORS[active.type];
      for (const [dr, dc] of cells) {
        const r = gy + dr;
        const c = active.x + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          ctx.save();
          ctx.globalAlpha = GHOST_ALPHA;
          ctx.fillStyle = color;
          ctx.fillRect(bx + c * cs + 1, by + r * cs + 1, cs - 2, cs - 2);
          ctx.restore();
        }
      }
    }
  }

  // Locked cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      const color = cell === 'garbage' ? GARBAGE_COLOR : PIECE_COLORS[cell as PieceType];
      drawCell(ctx, bx + c * cs, by + r * cs, cs, color);
    }
  }

  // Active piece
  if (active) {
    const cells = getCells(active.type, active.rot);
    const color = PIECE_COLORS[active.type];
    for (const [dr, dc] of cells) {
      const r = active.y + dr;
      const c = active.x + dc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        drawCell(ctx, bx + c * cs, by + r * cs, cs, color);
      }
    }
  }

  // Flash overlay
  if (flash && flash.timer > 0) {
    const alpha = Math.min(0.85, flash.timer / 80 * 0.85);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    for (const row of flash.rows) {
      ctx.fillRect(bx, by + row * cs, cs * COLS, cs);
    }
    ctx.restore();
  }

  // Board border
  ctx.strokeStyle = '#444466';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx - 1, by - 1, cs * COLS + 2, cs * ROWS + 2);
}

function drawPieceInBox(
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  cs: number,
  alpha = 1
): void {
  const cells = getCells(type, 0);
  // Compute bounding box of piece
  const minR = Math.min(...cells.map(([r]) => r));
  const maxR = Math.max(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  const maxC = Math.max(...cells.map(([, c]) => c));
  const pieceW = (maxC - minC + 1) * cs;
  const pieceH = (maxR - minR + 1) * cs;
  const offX = Math.floor((boxW - pieceW) / 2);
  const offY = Math.floor((boxH - pieceH) / 2);
  const color = PIECE_COLORS[type];
  for (const [dr, dc] of cells) {
    const px = boxX + offX + (dc - minC) * cs;
    const py = boxY + offY + (dr - minR) * cs;
    drawCell(ctx, px, py, cs, color, alpha);
  }
}

function drawHold(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  hold: PieceType | null,
  holdUsed: boolean
): void {
  const cs = Math.min(layout.cellSize, 20);
  const boxW = cs * 4 + 4;
  const boxH = cs * 2 + 4;
  const bx = layout.holdX;
  const by = layout.holdY;

  ctx.fillStyle = UI_BG;
  ctx.fillRect(bx, by, boxW, boxH + 20);

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold 10px -apple-system, sans-serif`;
  ctx.fillText('HOLD', bx + 2, by + 11);

  if (hold) {
    drawPieceInBox(ctx, hold, bx, by + 12, boxW, boxH, cs, holdUsed ? HOLD_LOCKED_ALPHA : 1);
  }
}

function drawNext(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  next: PieceType[]
): void {
  const cs = Math.min(layout.cellSize, 20);
  const boxW = cs * 4 + 4;
  const boxH = cs * 2 + 2;
  const bx = layout.nextX;
  const by = layout.nextY;

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold 10px -apple-system, sans-serif`;
  ctx.fillText('NEXT', bx + 2, by + 11);

  for (let i = 0; i < Math.min(5, next.length); i++) {
    const ey = by + 14 + i * (boxH + 4);
    ctx.fillStyle = UI_BG;
    ctx.fillRect(bx, ey, boxW, boxH);
    drawPieceInBox(ctx, next[i], bx, ey, boxW, boxH, cs);
  }
}

function drawGauge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pending: number,
  imminent: boolean
): void {
  // Always draw gauge container (slightly lighter than board bg so it's visible when empty)
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#2a2a3a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  if (pending <= 0) return;

  const fillRatio = Math.min(1, pending / ROWS);
  const fillH = Math.round(fillRatio * h);
  ctx.fillStyle = imminent ? GAUGE_IMMINENT : GAUGE_PENDING;
  ctx.fillRect(x, y + h - fillH, w, fillH);
}

export interface RenderState {
  playerGrid: Grid;
  playerActive: ActivePiece | null;
  playerHold: PieceType | null;
  playerHoldUsed: boolean;
  playerNext: PieceType[];
  playerPending: number;
  playerImminent: boolean;
  cpuGrid: Grid;
  cpuActive: ActivePiece | null;
  cpuHold: PieceType | null;
  cpuHoldUsed: boolean;
  cpuPending: number;
  cpuImminent: boolean;
  effects: EffectsState;
}

export function render(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  state: RenderState
): void {
  const { canvas } = layout;
  const shake = getShakeOffset(state.effects.shake);

  ctx.save();
  ctx.translate(shake.x, shake.y);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(-4, -4, canvas.width + 8, canvas.height + 8);

  // Divider
  ctx.fillStyle = GRID_COLOR;
  ctx.fillRect(layout.dividerX, 0, 1, canvas.height);

  // Player board
  drawBoard(ctx, layout, state.playerGrid, state.playerActive, state.effects.playerFlash, false);
  drawHold(ctx, layout, state.playerHold, state.playerHoldUsed);
  drawNext(ctx, layout, state.playerNext);
  drawGauge(ctx, layout.gaugeX, layout.gaugeY, GAUGE_W, layout.gaugeH, state.playerPending, state.playerImminent);

  // CPU board
  drawBoard(ctx, layout, state.cpuGrid, state.cpuActive, state.effects.cpuFlash, true);
  drawGauge(ctx, layout.cpuGaugeX, layout.cpuGaugeY, GAUGE_W_CPU, layout.cpuGaugeH, state.cpuPending, state.cpuImminent);

  // CPU mini hold
  if (state.cpuHold) {
    const cs = Math.min(layout.cpuCellSize, 14);
    const boxW = cs * 4;
    const boxH = cs * 2;
    const hbx = layout.cpuBoardX;
    const hby = layout.cpuBoardY - boxH - 14;
    ctx.fillStyle = UI_BG;
    ctx.fillRect(hbx, hby, boxW, boxH);
    drawPieceInBox(ctx, state.cpuHold, hbx, hby, boxW, boxH, cs, state.cpuHoldUsed ? HOLD_LOCKED_ALPHA : 1);
  }

  // Labels above boards
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `bold 11px -apple-system, sans-serif`;
  ctx.fillText('YOU', layout.playerBoardX + 2, layout.playerBoardY - 6);
  ctx.fillText('CPU', layout.cpuBoardX + 2, layout.cpuBoardY - 6);

  // Clear action labels
  if (state.effects.playerLabel && state.effects.playerLabelTimer > 0) {
    const alpha = Math.min(1, state.effects.playerLabelTimer / 400);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 13px -apple-system, sans-serif`;
    ctx.fillText(state.effects.playerLabel, layout.playerBoardX + 2, layout.playerBoardY - 20);
    ctx.restore();
  }
  if (state.effects.cpuLabel && state.effects.cpuLabelTimer > 0) {
    const alpha = Math.min(1, state.effects.cpuLabelTimer / 400);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#c8c8d4';
    ctx.font = `bold 11px -apple-system, sans-serif`;
    ctx.fillText(state.effects.cpuLabel, layout.cpuBoardX + 2, layout.cpuBoardY - 20);
    ctx.restore();
  }

  ctx.restore();
}

import { COLS, ROWS, LOCK_DELAY_MS, LOCK_RESET_MAX, GRAVITY_MS } from './constants';
import { PieceType, getCells, getKicks, spawnX, spawnY } from './pieces';
import { Grid, hasCollision } from './board';

export interface ActivePiece {
  type: PieceType;
  x: number;
  y: number;
  rot: number;
  lastMoveWasRotation: boolean;
}

export interface LockState {
  timer: number;    // ms remaining
  resets: number;
  onGround: boolean;
}

export function spawnPiece(type: PieceType): ActivePiece {
  return {
    type,
    x: spawnX(type),
    y: spawnY(type),
    rot: 0,
    lastMoveWasRotation: false,
  };
}

export function ghostY(grid: Grid, piece: ActivePiece): number {
  const cells = getCells(piece.type, piece.rot);
  let gy = piece.y;
  while (!hasCollision(grid, cells, piece.x, gy + 1)) {
    gy++;
  }
  return gy;
}

export function tryMove(
  grid: Grid,
  piece: ActivePiece,
  dx: number,
  dy: number
): ActivePiece | null {
  const cells = getCells(piece.type, piece.rot);
  const nx = piece.x + dx;
  const ny = piece.y + dy;
  if (hasCollision(grid, cells, nx, ny)) return null;
  return { ...piece, x: nx, y: ny, lastMoveWasRotation: false };
}

export function tryRotate(
  grid: Grid,
  piece: ActivePiece,
  direction: 1 | -1
): ActivePiece | null {
  const fromRot = piece.rot;
  const toRot = ((fromRot + direction + 4) % 4) as 0 | 1 | 2 | 3;
  const kicks = getKicks(piece.type, fromRot, toRot);
  const cells = getCells(piece.type, toRot);

  for (const [kx, ky] of kicks) {
    const nx = piece.x + kx;
    const ny = piece.y - ky; // SRS uses inverted y (positive = up in math, down in screen)
    if (!hasCollision(grid, cells, nx, ny)) {
      return { ...piece, x: nx, y: ny, rot: toRot, lastMoveWasRotation: true };
    }
  }
  return null;
}

export function isOnGround(grid: Grid, piece: ActivePiece): boolean {
  const cells = getCells(piece.type, piece.rot);
  return hasCollision(grid, cells, piece.x, piece.y + 1);
}

export function createLockState(): LockState {
  return { timer: LOCK_DELAY_MS, resets: 0, onGround: false };
}

export function tickLockDelay(
  lock: LockState,
  onGround: boolean,
  moved: boolean,
  dt: number
): { lock: LockState; shouldLock: boolean } {
  let l = { ...lock };

  if (!onGround) {
    // Floating: reset timer, clear onGround
    return { lock: { ...l, onGround: false, timer: LOCK_DELAY_MS }, shouldLock: false };
  }

  if (!l.onGround) {
    // Just landed
    l = { ...l, onGround: true, timer: LOCK_DELAY_MS };
  }

  if (moved && l.resets < LOCK_RESET_MAX) {
    l = { ...l, timer: LOCK_DELAY_MS, resets: l.resets + 1 };
  }

  l.timer -= dt;

  if (l.timer <= 0 || l.resets >= LOCK_RESET_MAX) {
    return { lock: l, shouldLock: true };
  }

  return { lock: l, shouldLock: false };
}

export interface GravityState {
  accumulator: number; // ms
}

export function tickGravity(
  grav: GravityState,
  dt: number,
  interval: number = GRAVITY_MS
): { grav: GravityState; steps: number } {
  const acc = grav.accumulator + dt;
  const steps = Math.floor(acc / interval);
  return { grav: { accumulator: acc % interval }, steps };
}

// Spawn-overlap check
export function spawnCollides(grid: Grid, type: PieceType): boolean {
  const piece = spawnPiece(type);
  const cells = getCells(type, 0);
  return hasCollision(grid, cells, piece.x, piece.y);
}

export { ROWS, COLS };

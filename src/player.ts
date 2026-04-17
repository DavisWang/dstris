import { Grid, createGrid, cloneGrid, clearLines, lockPiece, addGarbage, isPerfectClear } from './board';
import { ActivePiece, LockState, GravityState, spawnPiece, tryMove, tryRotate,
  isOnGround, ghostY, tickLockDelay, tickGravity, spawnCollides, createLockState } from './piece-state';
import { GarbageQueue, createGarbageQueue, cancelAndSend, materialize, receiveGarbage } from './garbage';
import { Bag7 } from './bag';
import { PieceType, getCells } from './pieces';
import { computeAttack, isB2BEligible, TSpinType } from './attack';
import { detectTSpin } from './tspin';
import { GRAVITY_MS } from './constants';
import { Action } from './input';

export interface PlayerState {
  grid: Grid;
  active: ActivePiece | null;
  hold: PieceType | null;
  holdUsed: boolean;
  bag: Bag7;
  garbageQueue: GarbageQueue;
  b2bActive: boolean;
  b2bStreak: number;
  combo: number;
  linesCleared: number;
  garbageSent: number;
  lockState: LockState;
  gravState: GravityState;
  dead: boolean;
  lastClearedRows: number[];
  lastAttack: number;
  lastClearLabel: string;
  softDropActive: boolean;
}

export function createPlayerState(): PlayerState {
  const bag = new Bag7();
  const active = spawnPiece(bag.next());
  return {
    grid: createGrid(),
    active,
    hold: null,
    holdUsed: false,
    bag,
    garbageQueue: createGarbageQueue(),
    b2bActive: false,
    b2bStreak: 0,
    combo: 0,
    linesCleared: 0,
    garbageSent: 0,
    lockState: createLockState(),
    gravState: { accumulator: 0 },
    dead: false,
    lastClearedRows: [],
    lastAttack: 0,
    lastClearLabel: '',
    softDropActive: false,
  };
}

export interface LockResult {
  linesCleared: number;
  attackOut: number;
  topOut: boolean;
  clearedRows: number[];
  perfectClear: boolean;
}

// Apply pending garbage to the player board
export function applyPendingGarbage(state: PlayerState): { state: PlayerState; topOut: boolean } {
  const { lines, newQueue } = materialize(state.garbageQueue);
  if (lines === 0) return { state: { ...state, garbageQueue: newQueue }, topOut: false };
  const { grid, topOut } = addGarbage(state.grid, lines);
  return { state: { ...state, grid, garbageQueue: newQueue }, topOut };
}

// Returns which rows are full (before clearing)
function getFullRows(grid: Grid): number[] {
  const rows: number[] = [];
  for (let r = 0; r < grid.length; r++) {
    if (grid[r].every(c => c !== null)) rows.push(r);
  }
  return rows;
}

// Called when the active piece locks
export function lockActive(state: PlayerState): { state: PlayerState; result: LockResult } {
  if (!state.active) return { state, result: { linesCleared: 0, attackOut: 0, topOut: false, clearedRows: [], perfectClear: false } };

  const cells = getCells(state.active.type, state.active.rot);
  let grid = lockPiece(state.grid, cells, state.active.x, state.active.y, state.active.type);

  const fullRows = getFullRows(grid);
  const { grid: clearedGrid, linesCleared } = clearLines(grid);
  const perfectClear = linesCleared > 0 && isPerfectClear(clearedGrid);

  const tSpin: TSpinType = detectTSpin(
    state.grid,
    state.active.type,
    state.active.x,
    state.active.y,
    state.active.rot,
    state.active.lastMoveWasRotation
  );

  const newCombo = linesCleared > 0 ? state.combo + 1 : 0;
  const { lines: attackOut, label: clearLabel, isB2B } = computeAttack(
    linesCleared,
    tSpin,
    perfectClear,
    state.b2bActive,
    newCombo
  );

  const newB2BEligible = isB2BEligible(linesCleared, tSpin, perfectClear);
  const newB2B = linesCleared > 0 ? newB2BEligible : state.b2bActive;
  const newB2BStreak = linesCleared > 0
    ? (newB2BEligible && state.b2bActive ? state.b2bStreak + 1 : (newB2BEligible ? 0 : 0))
    : state.b2bStreak;

  let displayLabel = clearLabel;
  if (isB2B && linesCleared > 0) displayLabel = `B2B ${clearLabel}`;
  if (newCombo > 1) displayLabel = displayLabel ? `${displayLabel} · ${newCombo} Combo` : `${newCombo} Combo`;

  // Cancel incoming garbage with outgoing attack
  let newGarbageQueue = state.garbageQueue;
  let finalAttackOut = attackOut;

  if (linesCleared > 0 && attackOut > 0) {
    const { remaining, newQueue } = cancelAndSend(newGarbageQueue, attackOut);
    finalAttackOut = remaining;
    newGarbageQueue = newQueue;
  } else if (linesCleared === 0) {
    // Materialize pending garbage
    const { lines, newQueue } = materialize(newGarbageQueue);
    newGarbageQueue = newQueue;
    if (lines > 0) {
      const { grid: g2, topOut } = addGarbage(clearedGrid, lines);
      const newState: PlayerState = {
        ...state,
        grid: g2,
        active: null,
        garbageQueue: newGarbageQueue,
        b2bActive: newB2B,
        b2bStreak: newB2BStreak,
        combo: newCombo,
        linesCleared: state.linesCleared + linesCleared,
        garbageSent: state.garbageSent,
        lockState: createLockState(),
        gravState: { accumulator: 0 },
        holdUsed: false,
        lastClearedRows: fullRows,
        lastAttack: finalAttackOut,
        lastClearLabel: displayLabel,
      };
      return { state: newState, result: { linesCleared, attackOut: 0, topOut, clearedRows: fullRows, perfectClear } };
    }
  }

  const newState: PlayerState = {
    ...state,
    grid: clearedGrid,
    active: null,
    garbageQueue: newGarbageQueue,
    b2bActive: newB2B,
    b2bStreak: newB2BStreak,
    combo: newCombo,
    linesCleared: state.linesCleared + linesCleared,
    garbageSent: state.garbageSent + (linesCleared > 0 ? finalAttackOut : 0),
    lockState: createLockState(),
    gravState: { accumulator: 0 },
    holdUsed: false,
    lastClearedRows: fullRows,
    lastAttack: finalAttackOut,
    lastClearLabel: displayLabel,
  };

  return {
    state: newState,
    result: { linesCleared, attackOut: finalAttackOut, topOut: false, clearedRows: fullRows, perfectClear },
  };
}

// Spawn next piece; returns topOut=true if it collides immediately
export function spawnNext(state: PlayerState): { state: PlayerState; topOut: boolean } {
  const type = state.bag.next();
  const topOut = spawnCollides(state.grid, type);
  const active = spawnPiece(type);
  return {
    state: { ...state, active, lockState: createLockState(), gravState: { accumulator: 0 } },
    topOut,
  };
}

// Process a single action
export function applyAction(
  state: PlayerState,
  action: Action
): { state: PlayerState; movedOnGround: boolean } {
  if (!state.active) return { state, movedOnGround: false };

  let moved = false;
  let active = state.active;
  let grid = state.grid;

  if (action === 'moveLeft') {
    const r = tryMove(grid, active, -1, 0);
    if (r) { active = r; moved = true; }
  } else if (action === 'moveRight') {
    const r = tryMove(grid, active, 1, 0);
    if (r) { active = r; moved = true; }
  } else if (action === 'softDrop') {
    const r = tryMove(grid, active, 0, 1);
    if (r) { active = r; moved = true; }
  } else if (action === 'rotateCW') {
    const r = tryRotate(grid, active, 1);
    if (r) { active = r; moved = true; }
  } else if (action === 'rotateCCW') {
    const r = tryRotate(grid, active, -1);
    if (r) { active = r; moved = true; }
  } else if (action === 'hardDrop') {
    const gy = ghostY(grid, active);
    active = { ...active, y: gy };
    // Force immediate lock (handled by caller via hardDrop flag)
  } else if (action === 'hold') {
    if (!state.holdUsed) {
      const heldType = state.hold;
      const newHold = active.type;
      const nextType = heldType ?? state.bag.next();
      const topOut = spawnCollides(state.grid, nextType);
      const newActive = spawnPiece(nextType);
      return {
        state: {
          ...state,
          active: newActive,
          hold: newHold,
          holdUsed: true,
          lockState: createLockState(),
          gravState: { accumulator: 0 },
        },
        movedOnGround: false,
      };
    }
    return { state, movedOnGround: false };
  }

  const onGround = isOnGround(grid, active);
  const movedOnGround = moved && onGround;

  return { state: { ...state, active }, movedOnGround };
}

export function isHardDrop(action: Action): boolean {
  return action === 'hardDrop';
}

export { ghostY, isOnGround, tickLockDelay, tickGravity, getCells };

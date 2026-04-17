import { Grid, clearLines, lockPiece, hasCollision,
  aggregateHeight, countHoles, bumpiness, wellDepth } from './board';
import { PieceType, getCells, PIECE_MATRICES } from './pieces';
import { Difficulty, CPU_PARAMS } from './constants';

export interface Placement {
  x: number;
  rot: number;
}

// Weights tuned per difficulty. Holes are the #1 killer — penalise them heavily.
const WEIGHTS: Record<Difficulty, {
  height: number; holes: number; bumpy: number; lines: number; well: number;
}> = {
  easy:   { height: -0.30, holes: -0.60, bumpy: -0.20, lines: 0.80, well: 0.10 },
  medium: { height: -0.51, holes: -1.20, bumpy: -0.18, lines: 1.40, well: 0.25 },
  hard:   { height: -0.51, holes: -1.80, bumpy: -0.18, lines: 2.00, well: 0.45 },
};

function evalBoard(grid: Grid, diff: Difficulty): number {
  const w = WEIGHTS[diff];
  return (
    w.height * aggregateHeight(grid) +
    w.holes  * countHoles(grid) +
    w.bumpy  * bumpiness(grid) +
    w.well   * wellDepth(grid)
  );
}

// Terminal score: board eval + line-clear bonus
function terminalScore(grid: Grid, linesCleared: number, diff: Difficulty): number {
  return evalBoard(grid, diff) + WEIGHTS[diff].lines * linesCleared;
}

function allRotations(type: PieceType): number[] {
  const mats = PIECE_MATRICES[type];
  const seen = new Set<string>();
  const result: number[] = [];
  for (let r = 0; r < 4; r++) {
    const key = JSON.stringify(mats[r]);
    if (!seen.has(key)) { seen.add(key); result.push(r); }
  }
  return result;
}

function allPlacements(grid: Grid, type: PieceType): Placement[] {
  const placements: Placement[] = [];
  for (const rot of allRotations(type)) {
    const cells = getCells(type, rot);
    for (let x = -2; x < 12; x++) {
      let y = 0;
      if (hasCollision(grid, cells, x, y)) continue;
      while (!hasCollision(grid, cells, x, y + 1)) y++;
      placements.push({ x, rot });
    }
  }
  return placements;
}

function placePiece(
  grid: Grid, type: PieceType, p: Placement
): { grid: Grid; linesCleared: number } | null {
  const cells = getCells(type, p.rot);
  let y = 0;
  if (hasCollision(grid, cells, p.x, y)) return null;
  while (!hasCollision(grid, cells, p.x, y + 1)) y++;
  const newGrid = lockPiece(grid, cells, p.x, y, type);
  const { grid: clearedGrid, linesCleared } = clearLines(newGrid);
  return { grid: clearedGrid, linesCleared };
}

// 1-piece lookahead
function best1(
  grid: Grid, type: PieceType, diff: Difficulty
): { p: Placement; score: number } {
  const placements = allPlacements(grid, type);
  let best: Placement = { x: 3, rot: 0 };
  let bestScore = -Infinity;
  for (const p of placements) {
    const r = placePiece(grid, type, p);
    if (!r) continue;
    const s = terminalScore(r.grid, r.linesCleared, diff);
    if (s > bestScore) { bestScore = s; best = p; }
  }
  return { p: best, score: bestScore };
}

// 2-piece beam search — terminal score is evalBoard(boardAfterBoth) + lineBonus(l1+l2)
function best2(
  grid: Grid, type: PieceType, nextType: PieceType, diff: Difficulty
): { p: Placement; score: number } {
  const BEAM = 10;
  const placements = allPlacements(grid, type);

  type Candidate = { p: Placement; score: number; grid: Grid; lines: number };
  const candidates: Candidate[] = [];
  for (const p of placements) {
    const r = placePiece(grid, type, p);
    if (!r) continue;
    candidates.push({ p, score: terminalScore(r.grid, r.linesCleared, diff), grid: r.grid, lines: r.linesCleared });
  }
  candidates.sort((a, b) => b.score - a.score);
  const topN = candidates.slice(0, BEAM);

  let best: Placement = { x: 3, rot: 0 };
  let bestScore = -Infinity;
  for (const { p, grid: g1, lines: l1 } of topN) {
    const { score: s2 } = best1(g1, nextType, diff);
    // s2 = evalBoard(g2) + lines2Bonus; add lines1 bonus on top
    const combined = s2 + WEIGHTS[diff].lines * l1;
    if (combined > bestScore) { bestScore = combined; best = p; }
  }
  return { p: best, score: bestScore };
}

// 3-piece beam search
function best3(
  grid: Grid, type: PieceType, nextTypes: PieceType[], diff: Difficulty
): { p: Placement; score: number } {
  const BEAM1 = 8;
  const BEAM2 = 6;

  type Candidate = { p: Placement; score: number; grid: Grid; lines: number };
  const c1: Candidate[] = [];
  for (const p of allPlacements(grid, type)) {
    const r = placePiece(grid, type, p);
    if (!r) continue;
    c1.push({ p, score: terminalScore(r.grid, r.linesCleared, diff), grid: r.grid, lines: r.linesCleared });
  }
  c1.sort((a, b) => b.score - a.score);
  const top1 = c1.slice(0, BEAM1);

  let best: Placement = { x: 3, rot: 0 };
  let bestScore = -Infinity;

  for (const { p, grid: g1, lines: l1 } of top1) {
    const c2: { score: number; grid: Grid; lines: number }[] = [];
    for (const p2 of allPlacements(g1, nextTypes[0])) {
      const r2 = placePiece(g1, nextTypes[0], p2);
      if (!r2) continue;
      c2.push({ score: terminalScore(r2.grid, r2.linesCleared, diff), grid: r2.grid, lines: r2.linesCleared });
    }
    c2.sort((a, b) => b.score - a.score);
    const top2 = c2.slice(0, BEAM2);

    for (const { grid: g2, lines: l2 } of top2) {
      const { score: s3 } = best1(g2, nextTypes[1], diff);
      const combined = s3 + WEIGHTS[diff].lines * (l1 + l2);
      if (combined > bestScore) { bestScore = combined; best = p; }
    }
  }
  return { p: best, score: bestScore };
}

function scoreForPiece(
  grid: Grid, type: PieceType, nextTypes: PieceType[], diff: Difficulty, depth: number
): { p: Placement; score: number } {
  if (depth === 1) return best1(grid, type, diff);
  if (depth === 2) return best2(grid, type, nextTypes[0] ?? type, diff);
  return best3(grid, type, nextTypes, diff);
}

export interface PlacementChoice {
  placement: Placement;
  useHold: boolean;
}

export function choosePlacement(
  grid: Grid,
  type: PieceType,
  nextTypes: PieceType[],
  holdType: PieceType | null,
  holdUsed: boolean,
  diff: Difficulty
): PlacementChoice {
  const params = CPU_PARAMS[diff];

  // Random mistake
  if (Math.random() < params.mistakeRate) {
    const placements = allPlacements(grid, type);
    const p = placements.length > 0
      ? placements[Math.floor(Math.random() * placements.length)]
      : { x: 3, rot: 0 };
    return { placement: p, useHold: false };
  }

  const current = scoreForPiece(grid, type, nextTypes, diff, params.depth);

  // Consider hold when it hasn't been used this piece
  if (!holdUsed) {
    // After swapping: the active piece becomes holdType (or nextTypes[0] if no hold),
    // and the preview queue shifts accordingly.
    const swapType: PieceType | null = holdType ?? (nextTypes[0] ?? null);
    if (swapType) {
      const nextAfterHold: PieceType[] = holdType ? nextTypes : nextTypes.slice(1);
      const withHold = scoreForPiece(grid, swapType, nextAfterHold, diff, params.depth);
      // Use hold if it scores meaningfully better (avoid churn)
      if (withHold.score > current.score + 1.0) {
        return { placement: withHold.p, useHold: true };
      }
    }
  }

  return { placement: current.p, useHold: false };
}

// ---- CPU execution state machine ----

type CpuPhase = 'thinking' | 'moving' | 'done';

export interface CpuMoveState {
  phase: CpuPhase;
  thinkTimer: number;
  target: Placement | null;
  currentX: number;
  currentRot: number;
  moveTimer: number;
  difficulty: Difficulty;
}

export function createCpuMoveState(difficulty: Difficulty): CpuMoveState {
  const p = CPU_PARAMS[difficulty];
  return {
    phase: 'thinking',
    thinkTimer: p.thinkMin + Math.random() * (p.thinkMax - p.thinkMin),
    target: null,
    currentX: 3,
    currentRot: 0,
    moveTimer: 0,
    difficulty,
  };
}

export interface CpuActions {
  moveLeft: boolean;
  moveRight: boolean;
  rotateCW: boolean;
  rotateCCW: boolean;
  hardDrop: boolean;
  hold: boolean;
}

export function tickCpu(
  ms: CpuMoveState,
  grid: Grid,
  type: PieceType,
  nextTypes: PieceType[],
  holdType: PieceType | null,
  holdUsed: boolean,
  currentX: number,
  currentRot: number,
  dt: number
): { ms: CpuMoveState; actions: CpuActions } {
  const noActions: CpuActions = {
    moveLeft: false, moveRight: false,
    rotateCW: false, rotateCCW: false,
    hardDrop: false, hold: false,
  };
  let m = { ...ms, currentX, currentRot };

  if (m.phase === 'thinking') {
    m.thinkTimer -= dt;
    if (m.thinkTimer <= 0) {
      const choice = choosePlacement(grid, type, nextTypes, holdType, holdUsed, m.difficulty);
      if (choice.useHold) {
        // Signal hold; game.ts will apply hold + reset this state machine
        m = { ...m, phase: 'done' };
        return { ms: m, actions: { ...noActions, hold: true } };
      }
      m = { ...m, phase: 'moving', target: choice.placement, moveTimer: 0 };
    }
    return { ms: m, actions: noActions };
  }

  if (m.phase === 'done') return { ms: m, actions: noActions };
  if (!m.target) return { ms: m, actions: noActions };

  const p = CPU_PARAMS[m.difficulty];
  m.moveTimer -= dt;
  if (m.moveTimer > 0) return { ms: m, actions: noActions };

  const actions: CpuActions = {
    moveLeft: false, moveRight: false,
    rotateCW: false, rotateCCW: false,
    hardDrop: false, hold: false,
  };

  // Rotate first, then translate
  const rotDiff = ((m.target.rot - m.currentRot + 4) % 4);
  if (rotDiff !== 0) {
    actions.rotateCW = rotDiff <= 2;
    actions.rotateCCW = rotDiff > 2;
    m.moveTimer = p.rotDelay;
    return { ms: m, actions };
  }

  const dx = m.target.x - m.currentX;
  if (dx < 0) {
    actions.moveLeft = true;
    m.moveTimer = p.arr;
  } else if (dx > 0) {
    actions.moveRight = true;
    m.moveTimer = p.arr;
  } else {
    actions.hardDrop = true;
    m = { ...m, phase: 'done' };
  }

  return { ms: m, actions };
}

import { COLS, ROWS } from './constants';
import { PieceType } from './pieces';

// null = empty; string = piece color/type
export type Cell = PieceType | 'garbage' | null;
export type Grid = Cell[][];

export function createGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function cloneGrid(g: Grid): Grid {
  return g.map(row => [...row]);
}

export function isRowFull(row: Cell[]): boolean {
  return row.every(c => c !== null);
}

// Returns new grid and number of lines cleared
export function clearLines(grid: Grid): { grid: Grid; linesCleared: number } {
  const kept = grid.filter(row => !isRowFull(row));
  const cleared = ROWS - kept.length;
  const newRows: Cell[][] = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { grid: [...newRows, ...kept], linesCleared: cleared };
}

// Add garbage rows at the bottom (push board up)
// Returns new grid; if any row of filled cells is pushed off the top, top-out occurred
export function addGarbage(grid: Grid, count: number): { grid: Grid; topOut: boolean } {
  const newGrid = cloneGrid(grid);
  // Check if adding garbage would push filled cells off the top
  let topOut = false;
  for (let r = 0; r < count; r++) {
    if (newGrid[0].some(c => c !== null)) {
      topOut = true;
    }
    newGrid.shift();
    const hole = Math.floor(Math.random() * COLS);
    const garbageRow: Cell[] = Array(COLS).fill('garbage');
    garbageRow[hole] = null;
    newGrid.push(garbageRow);
  }
  return { grid: newGrid, topOut };
}

// Check if a piece at (x, y, rot) overlaps the board or is out-of-bounds
export function hasCollision(
  grid: Grid,
  cells: [number, number][],
  x: number,
  y: number
): boolean {
  for (const [dr, dc] of cells) {
    const col = x + dc;
    const row = y + dr;
    if (col < 0 || col >= COLS) return true;
    if (row >= ROWS) return true;
    if (row >= 0 && grid[row][col] !== null) return true;
  }
  return false;
}

// Lock a piece onto the board in-place
export function lockPiece(
  grid: Grid,
  cells: [number, number][],
  x: number,
  y: number,
  type: PieceType
): Grid {
  const g = cloneGrid(grid);
  for (const [dr, dc] of cells) {
    const row = y + dr;
    const col = x + dc;
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      g[row][col] = type;
    }
  }
  return g;
}

// Check if all cells are empty (perfect clear)
export function isPerfectClear(grid: Grid): boolean {
  return grid.every(row => row.every(c => c === null));
}

// Count holes: empty cells with at least one filled cell above in the same column
export function countHoles(grid: Grid): number {
  let holes = 0;
  for (let c = 0; c < COLS; c++) {
    let hasBlockAbove = false;
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][c] !== null) {
        hasBlockAbove = true;
      } else if (hasBlockAbove) {
        holes++;
      }
    }
  }
  return holes;
}

// Column heights
export function columnHeights(grid: Grid): number[] {
  const heights: number[] = Array(COLS).fill(0);
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][c] !== null) {
        heights[c] = ROWS - r;
        break;
      }
    }
  }
  return heights;
}

export function aggregateHeight(grid: Grid): number {
  return columnHeights(grid).reduce((s, h) => s + h, 0);
}

export function bumpiness(grid: Grid): number {
  const h = columnHeights(grid);
  let sum = 0;
  for (let c = 0; c < COLS - 1; c++) {
    sum += Math.abs(h[c] - h[c + 1]);
  }
  return sum;
}

export function wellDepth(grid: Grid): number {
  const h = columnHeights(grid);
  let maxWell = 0;
  for (let c = 0; c < COLS; c++) {
    const left = c === 0 ? ROWS : h[c - 1];
    const right = c === COLS - 1 ? ROWS : h[c + 1];
    const depth = Math.min(left, right) - h[c];
    if (depth > maxWell) maxWell = depth;
  }
  return maxWell;
}

import { Grid } from './board';
import { COLS, ROWS } from './constants';
import { PieceType } from './pieces';
import { TSpinType } from './attack';

/**
 * Three-corner T-Spin detection (Guideline).
 * Called after a rotation that placed the T-piece.
 * lastMoveWasRotation must be true; this is only called when the last move was a rotation.
 */
export function detectTSpin(
  grid: Grid,
  type: PieceType,
  x: number,
  y: number,
  rot: number,
  lastMoveWasRotation: boolean
): TSpinType {
  if (type !== 'T' || !lastMoveWasRotation) return 'none';

  // T bounding box is 3×3 but stored in 4×4; center of T is at relative [1,1]
  // The 4 diagonal corners of the 3×3 bounding box relative to piece origin (y+dr, x+dc):
  const corners: [number, number][] = [
    [y, x],         // top-left of 3×3
    [y, x + 2],     // top-right
    [y + 2, x],     // bottom-left
    [y + 2, x + 2], // bottom-right
  ];

  function isSolid(r: number, c: number): boolean {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true; // wall counts
    return grid[r][c] !== null;
  }

  const filled = corners.map(([r, c]) => isSolid(r, c));
  const filledCount = filled.filter(Boolean).length;

  if (filledCount < 3) return 'none';

  // Facing corners: depends on rotation
  // rot 0: facing up → front corners are top-left (0) and top-right (1)
  // rot 1: facing right → front corners are top-right (1) and bottom-right (3)
  // rot 2: facing down → front corners are bottom-left (2) and bottom-right (3)
  // rot 3: facing left → front corners are top-left (0) and bottom-left (2)
  const frontPairs: [number, number][] = [
    [0, 1], // rot 0
    [1, 3], // rot 1
    [2, 3], // rot 2
    [0, 2], // rot 3
  ];
  const [fa, fb] = frontPairs[rot % 4];
  const frontFilled = filled[fa] && filled[fb];

  if (filledCount === 4) return 'full';
  if (frontFilled) return 'full';
  return 'mini';
}

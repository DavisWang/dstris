export const COLS = 10;
export const ROWS = 20;

// DAS/ARR (ms)
export const DAS = 133;
export const ARR = 10;

// Lock delay
export const LOCK_DELAY_MS = 500;
export const LOCK_RESET_MAX = 15;

// Gravity (ms per row drop)
export const GRAVITY_MS = 800;

// Line clear flash duration (ms)
export const FLASH_MS = 80;

// Screen shake
export const SHAKE_MAGNITUDE = 4;
export const SHAKE_DURATION = 120;

// Garbage gauge width (px)
export const GAUGE_W = 12;
export const GAUGE_W_CPU = 10;

// Attack table (lines cleared → lines sent)
export const ATTACK_TABLE: Record<string, number> = {
  single: 0,
  double: 1,
  triple: 2,
  tetris: 4,
  quintuple: 6,
  tspin_single: 2,
  tspin_double: 4,
  tspin_triple: 6,
  mini_tspin_single: 0,
  mini_tspin_double: 4, // treated as tspin_double
  spin_quad: 7,
  perfect_clear: 10,
};

export const B2B_BONUS = 1;

// Combo table (combo count → extra lines)
export const COMBO_TABLE = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5];
// index = combo count; beyond length-1 → 5

export function comboBonus(combo: number): number {
  if (combo <= 1) return 0;
  if (combo >= COMBO_TABLE.length) return 5;
  return COMBO_TABLE[combo];
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export const CPU_PARAMS: Record<Difficulty, {
  depth: number;
  mistakeRate: number;
  das: number;
  arr: number;
  thinkMin: number;
  thinkMax: number;
  rotDelay: number;
}> = {
  easy: { depth: 1, mistakeRate: 0.25, das: 300, arr: 80, thinkMin: 600, thinkMax: 900, rotDelay: 80 },
  medium: { depth: 2, mistakeRate: 0.08, das: 180, arr: 30, thinkMin: 300, thinkMax: 500, rotDelay: 55 },
  hard: { depth: 3, mistakeRate: 0.02, das: 120, arr: 10, thinkMin: 150, thinkMax: 250, rotDelay: 40 },
};

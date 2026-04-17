import { ATTACK_TABLE, B2B_BONUS, comboBonus } from './constants';

export type TSpinType = 'none' | 'mini' | 'full';

export interface AttackResult {
  lines: number;  // lines sent
  label: string;  // display label
  isB2B: boolean;
}

export function computeAttack(
  linesCleared: number,
  tSpin: TSpinType,
  perfectClear: boolean,
  b2bActive: boolean,
  combo: number
): AttackResult {
  let base = 0;
  let label = '';
  let b2bEligible = false;

  if (perfectClear) {
    base = ATTACK_TABLE.perfect_clear;
    label = 'Perfect Clear';
    b2bEligible = true;
  } else if (tSpin === 'full') {
    if (linesCleared === 1) { base = ATTACK_TABLE.tspin_single; label = 'T-Spin Single'; b2bEligible = true; }
    else if (linesCleared === 2) { base = ATTACK_TABLE.tspin_double; label = 'T-Spin Double'; b2bEligible = true; }
    else if (linesCleared === 3) { base = ATTACK_TABLE.tspin_triple; label = 'T-Spin Triple'; b2bEligible = true; }
    else if (linesCleared >= 4) { base = ATTACK_TABLE.spin_quad; label = 'T-Spin Quad'; b2bEligible = true; }
    else { base = 0; label = 'T-Spin'; }
  } else if (tSpin === 'mini') {
    if (linesCleared === 0) { base = 0; label = 'Mini T-Spin'; }
    else if (linesCleared === 1) { base = ATTACK_TABLE.mini_tspin_single; label = 'Mini T-Spin Single'; b2bEligible = false; }
    else { // mini double treated as full double
      base = ATTACK_TABLE.mini_tspin_double; label = 'Mini T-Spin Double'; b2bEligible = true;
    }
  } else {
    switch (linesCleared) {
      case 0: base = 0; label = ''; break;
      case 1: base = ATTACK_TABLE.single; label = 'Single'; break;
      case 2: base = ATTACK_TABLE.double; label = 'Double'; break;
      case 3: base = ATTACK_TABLE.triple; label = 'Triple'; break;
      case 4: base = ATTACK_TABLE.tetris; label = 'Tetris'; b2bEligible = true; break;
      default: base = ATTACK_TABLE.quintuple; label = `${linesCleared}-line`; b2bEligible = true;
    }
  }

  if (base === 0 && !perfectClear) {
    return { lines: 0, label, isB2B: false };
  }

  let total = base;
  const isB2B = b2bEligible && b2bActive;
  if (isB2B) total += B2B_BONUS;
  total += comboBonus(combo);

  return { lines: Math.max(0, total), label, isB2B };
}

// Returns whether the clear is B2B-eligible (to update the running b2b streak)
export function isB2BEligible(
  linesCleared: number,
  tSpin: TSpinType,
  perfectClear: boolean
): boolean {
  if (perfectClear) return true;
  if (tSpin === 'full' && linesCleared >= 1) return true;
  if (tSpin === 'mini' && linesCleared >= 2) return true;
  if (tSpin === 'none' && linesCleared >= 4) return true;
  return false;
}

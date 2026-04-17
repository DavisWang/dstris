import { FLASH_MS, SHAKE_DURATION, SHAKE_MAGNITUDE } from './constants';

export interface Flash {
  rows: number[];   // board row indices that are flashing
  timer: number;    // ms remaining
}

export interface Shake {
  timer: number;
  duration: number;
  magnitude: number;
}

export interface EffectsState {
  playerFlash: Flash | null;
  cpuFlash: Flash | null;
  shake: Shake | null;
  playerGaugeTarget: number;
  cpuGaugeTarget: number;
  playerLabel: string;
  playerLabelTimer: number;
  cpuLabel: string;
  cpuLabelTimer: number;
}

export function createEffectsState(): EffectsState {
  return {
    playerFlash: null,
    cpuFlash: null,
    shake: null,
    playerGaugeTarget: 0,
    cpuGaugeTarget: 0,
    playerLabel: '',
    playerLabelTimer: 0,
    cpuLabel: '',
    cpuLabelTimer: 0,
  };
}

export const LABEL_DURATION = 1500; // ms

export function triggerLabel(state: EffectsState, side: 'player' | 'cpu', label: string): EffectsState {
  if (!label) return state;
  if (side === 'player') return { ...state, playerLabel: label, playerLabelTimer: LABEL_DURATION };
  return { ...state, cpuLabel: label, cpuLabelTimer: LABEL_DURATION };
}

export function triggerFlash(state: EffectsState, side: 'player' | 'cpu', rows: number[]): EffectsState {
  if (side === 'player') return { ...state, playerFlash: { rows, timer: FLASH_MS } };
  return { ...state, cpuFlash: { rows, timer: FLASH_MS } };
}

export function triggerShake(state: EffectsState): EffectsState {
  return { ...state, shake: { timer: SHAKE_DURATION, duration: SHAKE_DURATION, magnitude: SHAKE_MAGNITUDE } };
}

export function tickEffects(state: EffectsState, dt: number): EffectsState {
  let { playerFlash, cpuFlash, shake } = state;
  let { playerLabel, playerLabelTimer, cpuLabel, cpuLabelTimer } = state;

  if (playerFlash) {
    playerFlash = { ...playerFlash, timer: playerFlash.timer - dt };
    if (playerFlash.timer <= 0) playerFlash = null;
  }
  if (cpuFlash) {
    cpuFlash = { ...cpuFlash, timer: cpuFlash.timer - dt };
    if (cpuFlash.timer <= 0) cpuFlash = null;
  }
  if (shake) {
    shake = { ...shake, timer: shake.timer - dt };
    if (shake.timer <= 0) shake = null;
  }
  if (playerLabelTimer > 0) {
    playerLabelTimer -= dt;
    if (playerLabelTimer <= 0) { playerLabelTimer = 0; playerLabel = ''; }
  }
  if (cpuLabelTimer > 0) {
    cpuLabelTimer -= dt;
    if (cpuLabelTimer <= 0) { cpuLabelTimer = 0; cpuLabel = ''; }
  }

  return { ...state, playerFlash, cpuFlash, shake, playerLabel, playerLabelTimer, cpuLabel, cpuLabelTimer };
}

export function getShakeOffset(shake: Shake | null): { x: number; y: number } {
  if (!shake) return { x: 0, y: 0 };
  const progress = 1 - shake.timer / shake.duration;
  const damping = 1 - progress;
  const cycles = 2;
  const x = Math.sin(progress * Math.PI * 2 * cycles) * shake.magnitude * damping;
  return { x, y: 0 };
}

import { DAS, ARR } from './constants';

export type Action =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'hold';

interface DasState {
  key: string;
  action: Action;
  dasRemaining: number;  // > 0 = charging, <= 0 = ARR active
  arrAccum: number;
}

export interface InputState {
  immediateQueue: Action[];
  held: Set<string>;
  das: DasState | null;
  softDropHeld: boolean;
}

const KEY_MAP: Record<string, Action> = {
  // Arrow controls
  ArrowLeft: 'moveLeft',
  ArrowRight: 'moveRight',
  ArrowDown: 'softDrop',
  ArrowUp: 'rotateCW',
  ' ': 'hardDrop',
  // Letter rotate / hold
  x: 'rotateCW',
  X: 'rotateCW',
  z: 'rotateCCW',
  Z: 'rotateCCW',
  c: 'hold',
  C: 'hold',
  ShiftLeft: 'hold',
  ShiftRight: 'hold',
  // IJKL + V alternate controls (i = up → rotateCW, j = left, k = down, l = right, v = hard drop)
  i: 'rotateCW',
  I: 'rotateCW',
  j: 'moveLeft',
  J: 'moveLeft',
  k: 'softDrop',
  K: 'softDrop',
  l: 'moveRight',
  L: 'moveRight',
  v: 'hardDrop',
  V: 'hardDrop',
};

const DAS_ACTIONS = new Set<Action>(['moveLeft', 'moveRight']);

export function createInputState(): InputState {
  return { immediateQueue: [], held: new Set(), das: null, softDropHeld: false };
}

export function onKeyDown(state: InputState, e: KeyboardEvent): InputState {
  const key = e.code === 'ShiftLeft' || e.code === 'ShiftRight' ? e.code : e.key;
  const action = KEY_MAP[key];
  if (!action) return state;
  if (state.held.has(key)) return state;

  const held = new Set(state.held);
  held.add(key);

  const immediateQueue = [...state.immediateQueue, action];
  let { das, softDropHeld } = state;

  if (DAS_ACTIONS.has(action)) {
    das = { key, action, dasRemaining: DAS, arrAccum: 0 };
  }
  if (action === 'softDrop') softDropHeld = true;

  return { immediateQueue, held, das, softDropHeld };
}

export function onKeyUp(state: InputState, e: KeyboardEvent): InputState {
  const key = e.code === 'ShiftLeft' || e.code === 'ShiftRight' ? e.code : e.key;
  const action = KEY_MAP[key];
  const held = new Set(state.held);
  held.delete(key);

  let { das, softDropHeld } = state;
  if (das && das.key === key) das = null;
  if (action === 'softDrop') softDropHeld = false;

  return { immediateQueue: state.immediateQueue, held, das, softDropHeld };
}

// Drain the queue and update DAS/ARR; returns [newState, actionsThisFrame]
export function tickInput(state: InputState, dt: number): [InputState, Action[]] {
  const actions: Action[] = [...state.immediateQueue];
  let das = state.das ? { ...state.das } : null;

  if (das) {
    if (das.dasRemaining > 0) {
      das.dasRemaining -= dt;
      if (das.dasRemaining <= 0) {
        // DAS just charged — fire immediately
        actions.push(das.action);
        das.arrAccum = 0;
      }
    } else {
      // ARR phase
      das.arrAccum += dt;
      if ((ARR as number) === 0) {
        actions.push(das.action);
        das.arrAccum = 0;
      } else {
        while (das.arrAccum >= ARR) {
          actions.push(das.action);
          das.arrAccum -= ARR;
        }
      }
    }
  }

  return [
    { immediateQueue: [], held: state.held, das, softDropHeld: state.softDropHeld },
    actions,
  ];
}

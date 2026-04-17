import { PlayerState, createPlayerState, lockActive, spawnNext, applyAction, isHardDrop } from './player';
import { isOnGround, ghostY, tickLockDelay, tickGravity, createLockState } from './piece-state';
import { getCells } from './pieces';
import { receiveGarbage } from './garbage';
import { Action, InputState, createInputState, tickInput, onKeyDown, onKeyUp } from './input';
import { EffectsState, createEffectsState, triggerFlash, triggerShake, tickEffects, triggerLabel } from './effects';
import { CpuMoveState, createCpuMoveState, tickCpu } from './cpu';
import { Difficulty } from './constants';
import { playClear, playLock, playHold, playTopOut, playWin } from './audio';

export type GamePhase = 'playing' | 'over';

export interface GameState {
  player: PlayerState;
  cpu: PlayerState;
  phase: GamePhase;
  winner: 'player' | 'cpu' | null;
  input: InputState;
  effects: EffectsState;
  cpuMoveState: CpuMoveState;
  difficulty: Difficulty;
}

export function createGameState(difficulty: Difficulty): GameState {
  return {
    player: createPlayerState(),
    cpu: createPlayerState(),
    phase: 'playing',
    winner: null,
    input: createInputState(),
    effects: createEffectsState(),
    cpuMoveState: createCpuMoveState(difficulty),
    difficulty,
  };
}

export function handleKeyDown(state: GameState, e: KeyboardEvent): GameState {
  if (state.phase !== 'playing') return state;
  return { ...state, input: onKeyDown(state.input, e) };
}

export function handleKeyUp(state: GameState, e: KeyboardEvent): GameState {
  return { ...state, input: onKeyUp(state.input, e) };
}

function processPlayerActions(gs: GameState, actions: Action[]): GameState {
  let state = { ...gs };

  for (const action of actions) {
    if (!state.player.active) break;
    if (state.phase !== 'playing') break;

    if (action === 'hold') {
      const { state: newPlayer } = applyAction(state.player, 'hold');
      state = { ...state, player: newPlayer };
      playHold();
      continue;
    }

    const isHD = isHardDrop(action);
    const { state: newPlayer, movedOnGround } = applyAction(state.player, action);
    state = { ...state, player: newPlayer };

    if (isHD) {
      // Force immediate lock
      state = lockPlayerPiece(state, 'player');
      break;
    }

    if (movedOnGround && state.player.lockState) {
      // Reset handled in tick
    }
  }

  return state;
}

function lockPlayerPiece(gs: GameState, side: 'player' | 'cpu'): GameState {
  let state = { ...gs };
  const isPlayer = side === 'player';
  const pState = isPlayer ? state.player : state.cpu;

  const { state: afterLock, result } = lockActive(pState);

  let effects = state.effects;

  if (result.clearedRows.length > 0) {
    effects = triggerFlash(effects, side, result.clearedRows);
    playClear(result.linesCleared);
    if (afterLock.lastClearLabel) effects = triggerLabel(effects, side, afterLock.lastClearLabel);

    if (result.linesCleared >= 4 || result.attackOut >= 4) {
      effects = triggerShake(effects);
    }
  } else {
    playLock();
  }

  // Send attack to opponent
  let player = isPlayer ? afterLock : state.player;
  let cpu = isPlayer ? state.cpu : afterLock;

  if (result.attackOut > 0) {
    if (isPlayer) {
      cpu = { ...cpu, garbageQueue: receiveGarbage(cpu.garbageQueue, result.attackOut) };
    } else {
      player = { ...player, garbageQueue: receiveGarbage(player.garbageQueue, result.attackOut) };
    }
  }

  if (result.topOut) {
    playTopOut();
    const winner = isPlayer ? 'cpu' : 'player';
    if (winner === 'player') playWin();
    return {
      ...state,
      player,
      cpu,
      effects,
      phase: 'over',
      winner,
    };
  }

  // Spawn next piece
  const spawnSide = isPlayer ? player : cpu;
  const { state: afterSpawn, topOut: spawnTopOut } = spawnNext(spawnSide);

  if (isPlayer) player = afterSpawn;
  else cpu = afterSpawn;

  if (spawnTopOut) {
    playTopOut();
    const winner = isPlayer ? 'cpu' : 'player';
    if (winner === 'player') playWin();
    return { ...state, player, cpu, effects, phase: 'over', winner };
  }

  // Reset CPU move state after CPU locks
  let cpuMoveState = state.cpuMoveState;
  if (!isPlayer) {
    cpuMoveState = createCpuMoveState(state.difficulty);
  }

  return { ...state, player, cpu, effects, cpuMoveState };
}

export function tick(gs: GameState, dt: number): GameState {
  if (gs.phase !== 'playing') return gs;

  let state = { ...gs };

  // Tick effects
  state = { ...state, effects: tickEffects(state.effects, dt) };

  // Process player input
  const [newInput, actions] = tickInput(state.input, dt);
  state = { ...state, input: newInput };

  if (state.player.active) {
    // Capture piece state before actions for lock-reset detection
    const beforeActive = state.player.active ? { ...state.player.active } : null;
    state = processPlayerActions(state, actions);
    // Detect if a move/rotation happened while on ground → reset lock delay
    const afterActive = state.player.active;
    const movedOnGroundThisFrame = !!(
      beforeActive && afterActive &&
      (beforeActive.x !== afterActive.x || beforeActive.rot !== afterActive.rot) &&
      isOnGround(state.player.grid, afterActive)
    );
    if (movedOnGroundThisFrame && state.player.lockState.resets < 15) {
      const pl = state.player;
      state = { ...state, player: { ...pl, lockState: { ...pl.lockState, timer: 500, resets: pl.lockState.resets + 1 } } };
    }
  }

  // Player gravity + lock delay
  if (state.player.active && state.phase === 'playing') {
    const gravInterval = state.input.softDropHeld ? 75 : 800;
    const { grav: newGrav, steps } = tickGravity(state.player.gravState, dt, gravInterval);
    let player = { ...state.player, gravState: newGrav };

    for (let i = 0; i < steps && player.active; i++) {
      const { state: moved } = applyAction(player, 'softDrop');
      player = moved;
    }

    if (player.active) {
      const onGround = isOnGround(player.grid, player.active);
      const { lock: newLock, shouldLock } = tickLockDelay(
        player.lockState, onGround, false, dt
      );
      player = { ...player, lockState: newLock };

      if (shouldLock) {
        state = { ...state, player };
        state = lockPlayerPiece(state, 'player');
      } else {
        state = { ...state, player };
      }
    } else {
      state = { ...state, player };
    }
  }

  // CPU tick
  if (state.cpu.active && state.phase === 'playing') {
    const nextTypes = state.cpu.bag.peek(3);
    const { ms: newMs, actions: cpuActions } = tickCpu(
      state.cpuMoveState,
      state.cpu.grid,
      state.cpu.active.type,
      nextTypes,
      state.cpu.hold,
      state.cpu.holdUsed,
      state.cpu.active.x,
      state.cpu.active.rot,
      dt
    );
    state = { ...state, cpuMoveState: newMs };

    if (cpuActions.hold) {
      // Apply hold and reset the move state so the new active piece gets a fresh think
      const { state: heldCpu } = applyAction(state.cpu, 'hold');
      state = { ...state, cpu: heldCpu, cpuMoveState: createCpuMoveState(state.difficulty) };
    } else {
      if (cpuActions.rotateCW) {
        const { state: newCpu } = applyAction(state.cpu, 'rotateCW');
        state = { ...state, cpu: newCpu };
      } else if (cpuActions.rotateCCW) {
        const { state: newCpu } = applyAction(state.cpu, 'rotateCCW');
        state = { ...state, cpu: newCpu };
      }
      if (cpuActions.moveLeft) {
        const { state: newCpu } = applyAction(state.cpu, 'moveLeft');
        state = { ...state, cpu: newCpu };
      } else if (cpuActions.moveRight) {
        const { state: newCpu } = applyAction(state.cpu, 'moveRight');
        state = { ...state, cpu: newCpu };
      }
      if (cpuActions.hardDrop && state.cpu.active) {
        const { state: droppedCpu } = applyAction(state.cpu, 'hardDrop');
        state = { ...state, cpu: droppedCpu };
        state = lockPlayerPiece(state, 'cpu');
      }
    }
  }

  // CPU gravity (fallback so CPU pieces eventually land even if AI doesn't hard drop)
  if (state.cpu.active && state.phase === 'playing') {
    const { grav: newGrav, steps } = tickGravity(state.cpu.gravState, dt, 1200);
    let cpu = { ...state.cpu, gravState: newGrav };
    for (let i = 0; i < steps && cpu.active; i++) {
      const { state: moved } = applyAction(cpu, 'softDrop');
      cpu = moved;
    }
    if (cpu.active) {
      const onGround = isOnGround(cpu.grid, cpu.active);
      const { lock: newLock, shouldLock } = tickLockDelay(cpu.lockState, onGround, false, dt);
      cpu = { ...cpu, lockState: newLock };
      if (shouldLock) {
        state = { ...state, cpu };
        state = lockPlayerPiece(state, 'cpu');
      } else {
        state = { ...state, cpu };
      }
    } else {
      state = { ...state, cpu };
    }
  }

  return state;
}

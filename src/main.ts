import { createGameState, handleKeyDown, handleKeyUp, tick, GameState } from './game';
import { computeLayout, render } from './renderer';
import { Difficulty } from './constants';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLDivElement;
const resultText = document.getElementById('result-text') as HTMLHeadingElement;
const statsText = document.getElementById('stats-text') as HTMLDivElement;
const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
const changeDiffBtn = document.getElementById('change-diff-btn') as HTMLButtonElement;
const diffRow = document.getElementById('difficulty-row') as HTMLDivElement;
const diffBtns = document.querySelectorAll<HTMLButtonElement>('#overlay .diff-btn');

const titleScreen = document.getElementById('title-screen') as HTMLDivElement;
const titleDiffBtns = document.querySelectorAll<HTMLButtonElement>('#title-diff-row .diff-btn');
const htpModal = document.getElementById('htp-modal') as HTMLDivElement;
const htpOpenBtn = document.getElementById('title-how-to-btn') as HTMLButtonElement;
const htpCloseBtn = document.getElementById('htp-close') as HTMLButtonElement;

let currentDifficulty: Difficulty = 'medium';
let gameState: GameState = createGameState(currentDifficulty);
let lastTime: number | null = null;
let rafId: number | null = null;
let onTitleScreen = true;

function resizeCanvas(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function updateDiffButtons(): void {
  diffBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === currentDifficulty);
  });
  titleDiffBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === currentDifficulty);
  });
}

function dismissTitleScreen(): void {
  if (!onTitleScreen) return;
  onTitleScreen = false;
  titleScreen.classList.add('hidden');
  startGame();
}

function showOverlay(winner: 'player' | 'cpu'): void {
  resultText.textContent = winner === 'player' ? 'You win!' : 'CPU wins!';
  resultText.style.color = winner === 'player' ? '#30c040' : '#e03030';

  const p = gameState.player;
  const c = gameState.cpu;
  statsText.innerHTML = `
    <div>Lines cleared — You: ${p.linesCleared} &nbsp;|&nbsp; CPU: ${c.linesCleared}</div>
    <div>Garbage sent — You: ${p.garbageSent} &nbsp;|&nbsp; CPU: ${c.garbageSent}</div>
  `;

  diffRow.classList.remove('visible');
  overlay.classList.add('visible');
}

function hideOverlay(): void {
  overlay.classList.remove('visible');
  diffRow.classList.remove('visible');
}

function startGame(): void {
  gameState = createGameState(currentDifficulty);
  lastTime = null;
  hideOverlay();
  if (rafId !== null) cancelAnimationFrame(rafId);
  requestAnimationFrame(loop);
}

function loop(timestamp: number): void {
  if (lastTime === null) lastTime = timestamp;
  const dt = Math.min(timestamp - lastTime, 100);
  lastTime = timestamp;

  const ctx = canvas.getContext('2d')!;
  const layout = computeLayout(canvas);

  gameState = tick(gameState, dt);

  // Check game over
  if (gameState.phase === 'over' && gameState.winner) {
    // Render final frame
    const player = gameState.player;
    const cpu = gameState.cpu;
    render(ctx, layout, {
      playerGrid: player.grid,
      playerActive: null,
      playerHold: player.hold,
      playerHoldUsed: player.holdUsed,
      playerNext: player.bag.peek(5),
      playerPending: player.garbageQueue.pending,
      playerImminent: player.garbageQueue.pending > 0,
      cpuGrid: cpu.grid,
      cpuActive: null,
      cpuHold: cpu.hold,
      cpuHoldUsed: cpu.holdUsed,
      cpuPending: cpu.garbageQueue.pending,
      cpuImminent: cpu.garbageQueue.pending > 0,
      effects: gameState.effects,
    });
    showOverlay(gameState.winner);
    return;
  }

  const player = gameState.player;
  const cpu = gameState.cpu;

  render(ctx, layout, {
    playerGrid: player.grid,
    playerActive: player.active,
    playerHold: player.hold,
    playerHoldUsed: player.holdUsed,
    playerNext: player.bag.peek(5),
    playerPending: player.garbageQueue.pending,
    playerImminent: player.garbageQueue.pending > 0,
    cpuGrid: cpu.grid,
    cpuActive: cpu.active,
    cpuHold: cpu.hold,
    cpuHoldUsed: cpu.holdUsed,
    cpuPending: cpu.garbageQueue.pending,
    cpuImminent: cpu.garbageQueue.pending > 0,
    effects: gameState.effects,
  });

  rafId = requestAnimationFrame(loop);
}

// Input
window.addEventListener('keydown', e => {
  if (htpModal.classList.contains('visible')) {
    if (e.key === 'Escape') htpModal.classList.remove('visible');
    return;
  }
  if (onTitleScreen) {
    dismissTitleScreen();
    return;
  }
  // Prevent space/arrow scrolling
  if (['ArrowDown','ArrowLeft','ArrowRight','ArrowUp',' '].includes(e.key)) {
    e.preventDefault();
  }
  gameState = handleKeyDown(gameState, e);
});

window.addEventListener('keyup', e => {
  gameState = handleKeyUp(gameState, e);
});

// Overlay buttons
restartBtn.addEventListener('click', () => startGame());

changeDiffBtn.addEventListener('click', () => {
  diffRow.classList.toggle('visible');
  updateDiffButtons();
});

diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentDifficulty = btn.dataset.diff as Difficulty;
    updateDiffButtons();
  });
});

// How to play modal
htpOpenBtn.addEventListener('click', e => {
  e.stopPropagation();
  htpModal.classList.add('visible');
});
htpCloseBtn.addEventListener('click', () => {
  htpModal.classList.remove('visible');
});
htpModal.addEventListener('click', e => {
  if (e.target === htpModal) htpModal.classList.remove('visible');
});

// Title screen difficulty buttons
titleDiffBtns.forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    currentDifficulty = btn.dataset.diff as Difficulty;
    updateDiffButtons();
  });
});

// Click anywhere on title screen to start
titleScreen.addEventListener('click', () => {
  dismissTitleScreen();
});

// Resize
window.addEventListener('resize', () => {
  resizeCanvas();
});

resizeCanvas();
updateDiffButtons();

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function resume(): void {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  gainPeak: number,
  startDelay = 0
): void {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + startDelay);
  gain.gain.setValueAtTime(0, c.currentTime + startDelay);
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + startDelay + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startDelay + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime + startDelay);
  osc.stop(c.currentTime + startDelay + duration + 0.01);
}

export function playClear(lines: number): void {
  resume();
  // Single: low thud; Double: ascending two; Triple: ascending three; Tetris: fanfare
  if (lines === 1) {
    playTone(220, 'square', 0.12, 0.15);
  } else if (lines === 2) {
    playTone(260, 'square', 0.10, 0.15);
    playTone(330, 'square', 0.10, 0.15, 0.07);
  } else if (lines === 3) {
    playTone(280, 'square', 0.09, 0.14);
    playTone(360, 'square', 0.09, 0.14, 0.07);
    playTone(440, 'square', 0.09, 0.14, 0.14);
  } else {
    // Tetris / big clear: upward arpeggio
    playTone(330, 'sawtooth', 0.09, 0.18);
    playTone(440, 'sawtooth', 0.09, 0.18, 0.07);
    playTone(550, 'sawtooth', 0.09, 0.18, 0.14);
    playTone(660, 'sawtooth', 0.14, 0.22, 0.21);
  }
}

export function playLock(): void {
  resume();
  playTone(160, 'square', 0.05, 0.08);
}

export function playHold(): void {
  resume();
  playTone(300, 'sine', 0.06, 0.1);
}

export function playTopOut(): void {
  resume();
  playTone(110, 'sawtooth', 0.3, 0.25);
  playTone(90, 'sawtooth', 0.3, 0.20, 0.15);
}

export function playWin(): void {
  resume();
  playTone(440, 'sine', 0.12, 0.2);
  playTone(550, 'sine', 0.12, 0.2, 0.12);
  playTone(660, 'sine', 0.18, 0.25, 0.24);
}

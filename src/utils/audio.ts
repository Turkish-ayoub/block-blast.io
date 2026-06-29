let audioCtx: AudioContext | null = null;
let isMuted = false;

// Safe initializer for the AudioContext (lazy-loaded on first user interaction)
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard and vendor prefixed support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  // Resume if suspended (browser security policy)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('block_blast_muted', muted ? 'true' : 'false');
  }
}

export function getMuted(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('block_blast_muted');
    if (saved !== null) {
      isMuted = saved === 'true';
    }
  }
  return isMuted;
}

/**
 * Play a retro "pop" sound when grabbing a puzzle piece
 */
export function playGrabSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  // Rapid pitch sweep upwards
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);

  // Rapid volume decay
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

/**
 * Play a retro "thud" wood/brick impact sound when successfully locking a piece
 */
export function playDropSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  // Fast frequency decline for block landing
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

/**
 * Play a retro cascading sound when rows or columns are cleared.
 * Scale the pitch and speed according to the combo multiplier!
 */
export function playClearSound(comboCount: number = 1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const baseFrequency = 200 + (comboCount * 80); // higher base pitch for combos
  const steps = 4; // number of ascending notes in cascade
  const stepDuration = 0.07; // speed of notes

  for (let i = 0; i < steps; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Arpeggio step calculations
    const noteFrequency = baseFrequency * Math.pow(1.25, i); // major thirds/fourths
    const startTime = ctx.currentTime + (i * stepDuration);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(noteFrequency, startTime);
    
    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

    osc.start(startTime);
    osc.stop(startTime + 0.15);
  }
}

/**
 * Play a sad descending retro sweep when game over occurs
 */
export function playGameOverSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const duration = 0.8;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sawtooth';
  // Sad sweep down
  osc.frequency.setValueAtTime(250, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + duration);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/**
 * Play a triumphant arcade style fanfare chime
 */
export function playTriumphantSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 arpeggio
  const stepDuration = 0.12;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    const startTime = ctx.currentTime + (i * stepDuration);
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

    osc.start(startTime);
    osc.stop(startTime + 0.25);
  });
}

/**
 * Monetag Vignette/Interstitial Ad Injection Point
 * Pauses game reset flow, triggers the ad network, and resolves/callbacks to resume.
 */
export function triggerMonetagVignette(callback: () => void) {
  console.log("Monetag Vignette: Initializing ad break...");
  // Monetag Vignette/Interstitial Ad Injection Point
  // In a real production deployment, you would insert your Monetag script triggers here:
  // if (typeof window.showNetworkAd === 'function') { window.showNetworkAd().then(callback); } else { callback(); }
  
  // For safety and seamless UX, we simulate a brief, styled ad placeholder or trigger immediately
  setTimeout(() => {
    callback();
  }, 500); // Resume gameplay after ad finishes or falls back
}


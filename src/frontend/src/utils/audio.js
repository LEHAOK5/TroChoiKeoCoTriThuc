// =====================================================================
// KÉO CO TRI THỨC - WEB AUDIO SFX & SYNTHESIZED DYNAMIC BGM ENGINE
// 100% Offline, Zero-latency, Dynamic Tempo & Match-Point Acceleration
// =====================================================================

let audioCtx = null;
let masterGain = null;
let bgmGain = null;

// Persistent mute state
let isAudioMuted = false;
try {
  isAudioMuted = localStorage.getItem('keoco_audio_muted') === 'true';
} catch (e) {
  isAudioMuted = false;
}

const muteListeners = new Set();

export function isMuted() {
  return isAudioMuted;
}

export function setMuted(muted) {
  isAudioMuted = Boolean(muted);
  try {
    localStorage.setItem('keoco_audio_muted', isAudioMuted ? 'true' : 'false');
  } catch (e) {}

  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(isAudioMuted ? 0 : 1, audioCtx.currentTime);
  }

  if (registrationAudio) {
    registrationAudio.volume = isAudioMuted ? 0 : 0.28;
  }

  muteListeners.forEach(fn => {
    try { fn(isAudioMuted); } catch (e) {}
  });

  return isAudioMuted;
}

export function toggleMute() {
  return setMuted(!isAudioMuted);
}

export function subscribeMute(listener) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(isAudioMuted ? 0 : 1, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      bgmGain = audioCtx.createGain();
      bgmGain.gain.setValueAtTime(0.22, audioCtx.currentTime); // gentle BGM balance
      bgmGain.connect(masterGain);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Unlock audio on first user tap / gesture
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

function getMasterOutput() {
  getAudioContext();
  return masterGain || (audioCtx ? audioCtx.destination : null);
}

// =====================================================================
// PART 1: GAME EFFECT SOUNDS (SFX)
// =====================================================================

// 1. Buzzer Sound (Deep arcade buzzer)
export function playBuzzer() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

  osc.connect(gain);
  gain.connect(getMasterOutput());

  osc.start(now);
  osc.stop(now + 0.3);
}

// 2. Correct Answer (Joyful arpeggio C5-E5-G5-C6)
export function playCorrect() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    const now = ctx.currentTime + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(getMasterOutput());

    osc.start(now);
    osc.stop(now + 0.26);
  });
}

// 3. Wrong Answer (Low thud)
export function playWrong() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.linearRampToValueAtTime(90, now + 0.35);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

  osc.connect(gain);
  gain.connect(getMasterOutput());

  osc.start(now);
  osc.stop(now + 0.36);
}

// 4. Rope Pull (Whoosh tension)
export function playRopePull() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

  osc.connect(gain);
  gain.connect(getMasterOutput());

  osc.start(now);
  osc.stop(now + 0.36);
}

// 5. Countdown Beeps (3, 2, 1, BẮT ĐẦU)
export function playCountdown(count) {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const isGo = count === 0;
  osc.type = isGo ? 'sawtooth' : 'sine';
  osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + (isGo ? 0.45 : 0.18));

  osc.connect(gain);
  gain.connect(getMasterOutput());

  osc.start(now);
  osc.stop(now + (isGo ? 0.48 : 0.2));
}

// 6. Fanfare Victory
export function playVictory() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const melody = [
    { freq: 523.25, time: 0.0, dur: 0.15 },
    { freq: 523.25, time: 0.18, dur: 0.15 },
    { freq: 523.25, time: 0.36, dur: 0.15 },
    { freq: 659.25, time: 0.54, dur: 0.35 },
    { freq: 587.33, time: 0.92, dur: 0.18 },
    { freq: 659.25, time: 1.12, dur: 0.18 },
    { freq: 783.99, time: 1.32, dur: 0.5 }
  ];

  melody.forEach(item => {
    const now = ctx.currentTime + item.time;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(item.freq, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + item.dur);

    osc.connect(gain);
    gain.connect(getMasterOutput());

    osc.start(now);
    osc.stop(now + item.dur + 0.05);
  });
}

// 7. Match Point Tension Heartbeat
export function playMatchPoint() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [0, 0.22].forEach(offset => {
    const t = now + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.16);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(getMasterOutput());

    osc.start(t);
    osc.stop(t + 0.2);
  });
}

// 8. Rebound Whistle
export function playRebound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.linearRampToValueAtTime(950, now + 0.2);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

  osc.connect(gain);
  gain.connect(getMasterOutput());

  osc.start(now);
  osc.stop(now + 0.25);
}

// 9. Referee Whistle
export function playWhistle() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [0, 0.14].forEach(offset => {
    const t = now + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(1900, t + 0.1);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);

    osc.connect(gain);
    gain.connect(getMasterOutput());

    osc.start(t);
    osc.stop(t + 0.12);
  });
}

// 10. Crowd Murmur / Suspense Gasp (Khi bấm chuông - khán đài nín thở xì xào)
export function playCrowdMurmur() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const dur = 1.2;

  // Noise buffer for crowd rustle
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(450, now);
  filter.frequency.exponentialRampToValueAtTime(750, now + 0.4);
  filter.frequency.exponentialRampToValueAtTime(380, now + dur);
  filter.Q.setValueAtTime(2.2, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  whiteNoise.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterOutput());

  // Low rumble
  const rumble = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  rumble.type = 'sine';
  rumble.frequency.setValueAtTime(75, now);
  rumble.frequency.linearRampToValueAtTime(55, now + dur);
  rumbleGain.gain.setValueAtTime(0.12, now);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  rumble.connect(rumbleGain);
  rumbleGain.connect(getMasterOutput());

  whiteNoise.start(now);
  whiteNoise.stop(now + dur);
  rumble.start(now);
  rumble.stop(now + dur);
}

// 11. Crowd Cheer & Applause (Khi trả lời đúng - tiếng hô Yeahhh! 🎉 và vỗ tay rộn rã 👏)
export function playCrowdCheer() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const dur = 1.6;

  // Layer 1: Formant crowd vocal sweep (Yeahhhh!)
  const freqs = [380, 460, 580];
  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 1.8, now + 0.6);
    osc.frequency.exponentialRampToValueAtTime(f * 1.3, now + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.5);
    filter.frequency.exponentialRampToValueAtTime(600, now + dur);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMasterOutput());

    osc.start(now);
    osc.stop(now + dur);
  });

  // Layer 2: Rapid clapping burst
  const claps = 12;
  for (let i = 0; i < claps; i++) {
    const clapTime = now + 0.15 + (i * 0.09) + (Math.random() * 0.03);
    const clapOsc = ctx.createOscillator();
    const clapGain = ctx.createGain();
    clapOsc.type = 'triangle';
    clapOsc.frequency.setValueAtTime(800 + Math.random() * 400, clapTime);

    clapGain.gain.setValueAtTime(0.08, clapTime);
    clapGain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.05);

    clapOsc.connect(clapGain);
    clapGain.connect(getMasterOutput());

    clapOsc.start(clapTime);
    clapOsc.stop(clapTime + 0.06);
  }
}

// 12. Crowd Gasp & Sigh (Khi trả lời sai - tiếng thở dài tiếc nuối Oooooh! 😮)
export function playCrowdGasp() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const dur = 0.9;

  // Descending formant vocal resonance (Oooooh...)
  [480, 520].forEach(f => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 0.45, now + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.exponentialRampToValueAtTime(260, now + dur);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMasterOutput());

    osc.start(now);
    osc.stop(now + dur);
  });
}

// =====================================================================
// PART 2: DYNAMIC SYNTHESIZED BGM ENGINE
// Modes: 'OFF' | 'LOBBY' | 'COUNTDOWN' | 'BATTLE' | 'TENSION'
// =====================================================================

class BGMSequencer {
  constructor() {
    this.currentMode = 'OFF';
    this.intervalId = null;
    this.step = 0;
    this.bpm = 128;
    this.activeNodes = [];
  }

  // Pentatonic notes frequencies (Hz) for upbeat energetic game synth
  // C major / A minor pentatonic: C, D, E, G, A
  static NOTES = {
    C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
    C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
  };

  playDrum(type, time, vol = 0.3) {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.09);
      gain.gain.setValueAtTime(vol * 0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(bgmGain || getMasterOutput());
      osc.start(time);
      osc.stop(time + 0.14);
    } else if (type === 'snare') {
      // Noise / snappy snare
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, time);
      osc.frequency.linearRampToValueAtTime(110, time + 0.08);
      gain.gain.setValueAtTime(vol * 0.45, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(gain);
      gain.connect(bgmGain || getMasterOutput());
      osc.start(time);
      osc.stop(time + 0.11);
    } else if (type === 'hihat') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'highpass' in osc ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(6500, time);
      gain.gain.setValueAtTime(vol * 0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      osc.connect(gain);
      gain.connect(bgmGain || getMasterOutput());
      osc.start(time);
      osc.stop(time + 0.05);
    }
  }

  playBass(freq, time, dur = 0.14, vol = 0.28) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(bgmGain || getMasterOutput());
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  playArp(freq, time, dur = 0.1, vol = 0.15) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(bgmGain || getMasterOutput());
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  tick() {
    if (this.currentMode === 'OFF') return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const N = BGMSequencer.NOTES;
    const now = ctx.currentTime;
    const step = this.step % 16;

    if (this.currentMode === 'LOBBY') {
      // Upbeat welcoming march rhythm (118 BPM)
      if (step % 4 === 0) this.playDrum('kick', now, 0.25);
      if (step % 2 === 1) this.playDrum('hihat', now, 0.1);

      // Friendly bouncing chords
      const bassPattern = [N.C3, N.C3, N.G3, N.C3, N.A3, N.A3, N.E3, N.A3];
      const bassNote = bassPattern[Math.floor(step / 2) % bassPattern.length];
      if (step % 2 === 0) {
        this.playBass(bassNote, now, 0.15, 0.18);
      }
      if (step % 4 === 2) {
        this.playArp(N.E4, now, 0.1, 0.1);
        this.playArp(N.G4, now + 0.04, 0.1, 0.1);
      }
    } else if (this.currentMode === 'COUNTDOWN') {
      // Accelerating tension tick & sweep
      this.playDrum('hihat', now, 0.25);
      if (step % 2 === 0) {
        this.playDrum('kick', now, 0.35);
        this.playBass(N.A3, now, 0.12, 0.25);
      }
      const countdownArp = [N.A4, N.C5, N.E5, N.A5];
      this.playArp(countdownArp[step % 4], now, 0.08, 0.18);
    } else if (this.currentMode === 'BATTLE') {
      // High-energy 130 BPM Sports Arcade Groove
      // Four on the floor kick
      if (step % 4 === 0) this.playDrum('kick', now, 0.4);
      // Snare on 4 and 12
      if (step === 4 || step === 12) this.playDrum('snare', now, 0.35);
      // Continuous 16th hi-hat
      this.playDrum('hihat', now, step % 2 === 1 ? 0.14 : 0.08);

      // Funk driving bassline: A - A - C - D - E - G
      const battleBass = [
        N.A3, N.A3, N.C4, N.A3,
        N.D4, N.A3, N.E4, N.D4,
        N.A3, N.A3, N.G3, N.A3,
        N.C4, N.D4, N.E4, N.G4
      ];
      this.playBass(battleBass[step], now, 0.12, 0.24);

      // Rhythmic synth arpeggios
      if (step % 2 === 0) {
        const battleArp = [N.E5, N.A5, N.C5, N.D5, N.E5, N.G5, N.A5, N.C5];
        this.playArp(battleArp[Math.floor(step / 2) % battleArp.length], now, 0.09, 0.12);
      }
    } else if (this.currentMode === 'TENSION') {
      // 152 BPM Adrenaline Rush Match-Point Mode
      // Kick on every beat
      if (step % 2 === 0) {
        this.playDrum('kick', now, 0.5);
        // Deep heartbeat pulse
        this.playBass(45, now, 0.18, 0.4);
      }
      if (step % 4 === 2) this.playDrum('snare', now, 0.45);
      this.playDrum('hihat', now, 0.2);

      // Fast nervous bassline
      const tensionBass = [N.A3, N.C4, N.E4, N.G4, N.A4, N.G4, N.E4, N.C4];
      this.playBass(tensionBass[step % 8], now, 0.09, 0.3);

      // High siren arpeggio
      if (step % 2 === 1) {
        this.playArp(step % 4 === 1 ? 880 : 987.77, now, 0.07, 0.15);
      }
    }

    this.step++;
  }

  setMode(mode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (mode === 'OFF') {
      this.step = 0;
      return;
    }

    // Determine BPM by mode
    switch (mode) {
      case 'LOBBY':
        this.bpm = 118;
        break;
      case 'COUNTDOWN':
        this.bpm = 138;
        break;
      case 'BATTLE':
        this.bpm = 130;
        break;
      case 'TENSION':
        this.bpm = 152;
        break;
      default:
        this.bpm = 128;
    }

    // 16th note interval = (60 / bpm) / 4 * 1000 ms
    const intervalMs = Math.round((60000 / this.bpm) / 4);
    this.step = 0;

    // Trigger audio context wake-up
    getAudioContext();

    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  getMode() {
    return this.currentMode;
  }
}

// Global Sequencer instance
const bgmInstance = new BGMSequencer();

export function setBGMMode(mode) {
  bgmInstance.setMode(mode);
}

export function getBGMMode() {
  return bgmInstance.getMode();
}

export function stopBGM() {
  bgmInstance.setMode('OFF');
}

// =====================================================================
// PART 3: REGISTRATION THEME SONG: "ĐI GIỮA TRỜI RỰC RỠ" (Ngô Lan Hương)
// Phát nền ẩn hoàn toàn trong lúc sinh viên điền form đăng ký
// =====================================================================
let registrationAudio = null;
let fadeInterval = null;

export function playRegistrationTheme() {
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  if (!registrationAudio) {
    registrationAudio = new Audio('/audio/di_giua_troi_ruc_ro.mp3');
    registrationAudio.loop = true;
    registrationAudio.preload = 'auto';
  }

  registrationAudio.volume = isAudioMuted ? 0 : 0.28;

  const playPromise = registrationAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Browser autoplay policy will let it play on first tap/touch
    });
  }
}

export function stopRegistrationTheme(fade = true) {
  if (!registrationAudio) return;

  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  if (!fade || registrationAudio.paused) {
    registrationAudio.pause();
    registrationAudio.currentTime = 0;
    return;
  }

  // Fade out mượt mà trong ~800ms để chuyển sang nhạc sân đấu
  const step = 0.035;
  fadeInterval = setInterval(() => {
    if (registrationAudio.volume > step) {
      registrationAudio.volume -= step;
    } else {
      clearInterval(fadeInterval);
      fadeInterval = null;
      registrationAudio.pause();
      registrationAudio.currentTime = 0;
      registrationAudio.volume = isAudioMuted ? 0 : 0.28;
    }
  }, 100);
}


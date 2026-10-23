// js/audio.js - Web Audio API Procedural Synthesizer & Ambient Music Engine

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.isMuted = false;
    this.masterVolume = 0.8;
    this.musicVolume = 0.45;
    this.sfxVolume = 0.8;

    this.isMusicPlaying = false;
    this.musicTimer = null;
    this.ambientNodes = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;

      // Resume context if suspended
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Start ambient castle music
      this.startAmbientMusic();
    } catch (e) {
      console.warn("Web Audio not available:", e);
    }
  }

  ensureReady() {
    if (!this.initialized) {
      this.init();
    } else if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Helper to create synthetic white/pink noise buffer
  createNoiseBuffer(durationSeconds = 1.0) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * durationSeconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --- SOUND EFFECTS ---

  // Footstep tick (P1 lower, P2 higher)
  playFootstep(spirit = 'ember') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = spirit === 'ember' ? 320 : 480;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Wall bump dull thud
  playWallBump() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.095);
  }

  // Fire hazard crackle
  playHazardFire() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.25);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  // Water hazard bubbly splash
  playHazardWater() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = i * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350 + i * 120, now + delay);
      osc.frequency.exponentialRampToValueAtTime(650 + i * 200, now + delay + 0.08);

      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.09);
    }
  }

  // Electric hazard buzzing zap
  playHazardElectric() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.185);
  }

  // Arrow trap whoosh + thunk
  playHazardArrow() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Whoosh
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.12);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.12);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain1);
    gain1.connect(this.sfxGain);
    noise.start(now);

    // Thunk
    const osc = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

    gain2.gain.setValueAtTime(0.45, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain2);
    gain2.connect(this.sfxGain);
    osc.start(now + 0.08);
    osc.stop(now + 0.19);
  }

  // Heart lost descending blip
  playHeartLost() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  // Heart shatter crunchy pixel noise
  playHeartShatter() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.22);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  // Game over sad descending arpeggio
  playGameOver() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [392.00, 349.23, 311.13, 261.63, 196.00]; // G4, F4, Eb4, C4, G3

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.14;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  // Trapdoor creak (low wooden slide)
  playTrapDoor() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.18);
    osc.frequency.linearRampToValueAtTime(80, now + 0.35);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.39);
  }

  // Gate reveal magical shimmer chime
  playGateReveal() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.31);
    });
  }

  // Gate open rising chord
  playGateOpen() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = [329.63, 440.00, 523.25, 659.25]; // E4, A4, C5, E5

    freqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.8, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.62);
    });
  }

  // Turn switch soft two-note chime
  playTurnSwitch() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [659.25, 880.00]; // E5, A5

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  // Level 5 collision deep boom + glassy crash
  playCollision() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Deep boom
    const osc = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain1);
    gain1.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.46);

    // Glassy crash noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.35);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.5, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(gain2);
    gain2.connect(this.sfxGain);
    noise.start(now);
  }

  // Level win chiptune fanfare
  playLevelWin() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // C5, E5, G5, C6 arpeggio with triumph
    const notes = [
      { f: 523.25, d: 0.10 },
      { f: 659.25, d: 0.10 },
      { f: 783.99, d: 0.10 },
      { f: 1046.50, d: 0.35 }
    ];

    let t = now;
    notes.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + n.d + 0.02);

      t += n.d;
    });
  }

  // Star pop sound
  playStarPop(index = 1) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const pitches = [880, 1174.66, 1760]; // A5, D6, A6
    const freq = pitches[(index - 1) % pitches.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // UI button click
  playUiClick() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.055);
  }

  // UI button hover
  playUiHover() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // --- AMBIENT CASTLE MUSIC SYNTHESIZER ---
  // Slow dreamy pad chords + gentle arpeggio + filtered wind and cricket noise bed
  startAmbientMusic() {
    if (this.isMusicPlaying || !this.ctx) return;
    this.isMusicPlaying = true;

    // Chords in D minor / A minor twilight progression:
    // Dm9 -> Bbmaj7 -> Gm7 -> Asus4
    const chords = [
      [146.83, 220.00, 261.63, 329.63], // D3, A3, C4, E4
      [116.54, 174.61, 220.00, 293.66], // Bb2, F3, A3, D4
      [98.00,  146.83, 220.00, 261.63], // G2, D3, A3, C4
      [110.00, 164.81, 220.00, 293.66]  // A2, E3, A3, D4
    ];

    let chordIndex = 0;
    const stepDuration = 3.6; // Seconds per chord

    const playChordStep = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = chords[chordIndex % chords.length];
      chordIndex++;

      // Play soft pad oscillators
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);

        // Gentle swell envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 1.2);
        gain.gain.linearRampToValueAtTime(0.001, now + stepDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + stepDuration + 0.1);
      });

      // Play gentle arpeggio notes in between
      for (let step = 0; step < 4; step++) {
        const noteFreq = chord[(step + 1) % chord.length] * 2;
        const noteTime = now + step * (stepDuration / 4);

        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();

        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(noteFreq, noteTime);

        arpGain.gain.setValueAtTime(0.001, noteTime);
        arpGain.gain.linearRampToValueAtTime(0.04, noteTime + 0.08);
        arpGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.7);

        arpOsc.connect(arpGain);
        arpGain.connect(this.musicGain);

        arpOsc.start(noteTime);
        arpOsc.stop(noteTime + 0.75);
      }

      // Schedule next chord
      this.musicTimer = setTimeout(playChordStep, (stepDuration - 0.2) * 1000);
    };

    playChordStep();
  }

  stopAmbientMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const audio = new AudioManager();

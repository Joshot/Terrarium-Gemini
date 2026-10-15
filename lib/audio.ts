// ============================================================================
// RELAXING COZY FREQUENCY AUDIO SYNTHESIZER (Web Audio API)
// 100% programmatic generation with oscillators, biquad filters, pink noise,
// and low-frequency modulation (LFO). Zero external assets or 404 dependencies.
// ============================================================================

class RelaxingAudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Ambient sound synthesis nodes
  private isAmbienceRunning = false;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientLFO: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private bubbleTimer: number | null = null;

  // Volumes
  private masterVolume = 0.4;
  private ambienceVolume = 0.35;
  private sfxVolume = 0.45;
  private muted = false;
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Load saved sound preferences
      try {
        const saved = localStorage.getItem('aquaria_audio_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.master === 'number') this.masterVolume = parsed.master;
          if (typeof parsed.ambience === 'number') this.ambienceVolume = parsed.ambience;
          if (typeof parsed.sfx === 'number') this.sfxVolume = parsed.sfx;
          if (typeof parsed.muted === 'boolean') this.muted = parsed.muted;
        }
      } catch {
        // Ignore
      }

      // Pause ambient audio when tab is hidden to conserve CPU
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
          }
        } else {
          if (this.ctx && this.ctx.state === 'suspended' && !this.muted) {
            this.ctx.resume();
          }
        }
      });
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        'aquaria_audio_settings',
        JSON.stringify({
          master: this.masterVolume,
          ambience: this.ambienceVolume,
          sfx: this.sfxVolume,
          muted: this.muted,
        })
      );
    } catch {
      // Ignore
    }
  }

  private initAudio() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Ambience Bus
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch {
      // Audio context blocked or not supported
    }
  }

  // Generate 5-second seamless looping pink noise buffer for natural water filter flow
  private createPinkNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // Start continuous relaxing ambient drone and water stream
  public startAmbience() {
    this.initAudio();
    if (!this.ctx || !this.ambienceGain || this.isAmbienceRunning) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Warm sub-audible foundation sine around 130 Hz (C3)
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(130.81, now);

      // 2. Harmonically rich detuned sine at 196 Hz (G3 fifth)
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(195.8, now); // subtle 0.2Hz detune for organic acoustic chorus

      // 3. Slow LFO (0.12 Hz) for gentle breathing wave modulation
      this.ambientLFO = this.ctx.createOscillator();
      this.ambientLFO.frequency.setValueAtTime(0.12, now);

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(0.02, now);
      this.ambientLFO.connect(this.lfoGain.gain);

      const toneGain = this.ctx.createGain();
      toneGain.gain.setValueAtTime(0.04, now);

      this.ambientOsc1.connect(toneGain);
      this.ambientOsc2.connect(toneGain);
      toneGain.connect(this.ambienceGain);

      this.ambientOsc1.start(now);
      this.ambientOsc2.start(now);
      this.ambientLFO.start(now);

      // 4. Filtered pink noise for gentle aquarium water aeration & filter murmur
      const noiseBuffer = this.createPinkNoiseBuffer();
      if (noiseBuffer) {
        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = noiseBuffer;
        this.noiseNode.loop = true;

        this.noiseFilter = this.ctx.createBiquadFilter();
        this.noiseFilter.type = 'lowpass';
        this.noiseFilter.frequency.setValueAtTime(320, now); // Gentle lowpass filter keeps it soft

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.06, now);

        this.noiseNode.connect(this.noiseFilter);
        this.noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ambienceGain);

        this.noiseNode.start(now);
      }

      this.isAmbienceRunning = true;

      // 5. Periodic gentle water bubble popping
      if (!this.bubbleTimer) {
        this.bubbleTimer = window.setInterval(() => {
          if (!this.muted && Math.random() < 0.7) {
            this.playBubble();
          }
        }, 3200);
      }
    } catch {
      // Audio start blocked by browser until user gesture
    }
  }

  public stopAmbience() {
    if (this.bubbleTimer) {
      clearInterval(this.bubbleTimer);
      this.bubbleTimer = null;
    }
    if (this.ambientOsc1) {
      try { this.ambientOsc1.stop(); this.ambientOsc1.disconnect(); } catch {}
      this.ambientOsc1 = null;
    }
    if (this.ambientOsc2) {
      try { this.ambientOsc2.stop(); this.ambientOsc2.disconnect(); } catch {}
      this.ambientOsc2 = null;
    }
    if (this.ambientLFO) {
      try { this.ambientLFO.stop(); this.ambientLFO.disconnect(); } catch {}
      this.ambientLFO = null;
    }
    if (this.noiseNode) {
      try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch {}
      this.noiseNode = null;
    }
    this.isAmbienceRunning = false;
  }

  // Soft, organic water bubble sound
  public playBubble() {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = 340 + Math.random() * 220;
      const endFreq = startFreq + 280 + Math.random() * 160;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.1);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  // Soft clean UI click (minimal, non-harsh)
  public playClick() {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  // Gentle, pleasant coin chime
  public playCoin() {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // Gentle feeding splash
  public playFeed() {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.14);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {}
  }

  // Calm notification chime when breeding completes
  public playBreedingComplete() {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25]; // A4, C#5, E5
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.07, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch {}
  }

  // Peaceful discovery tone when a new hybrid species is created
  public playDiscovery() {
    this.initAudio();
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major triad chord)
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.42);
      });
    } catch {}
  }

  // Volume and Mute Controls
  public setVolume(vol: number) {
    this.setMasterVolume(vol);
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setAmbienceVolume(vol: number) {
    this.ambienceVolume = Math.max(0, Math.min(1, vol));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public getMasterVolume() { return this.masterVolume; }
  public getAmbienceVolume() { return this.ambienceVolume; }
  public getSfxVolume() { return this.sfxVolume; }
  public isMuted() { return this.muted; }
}

export const sound = new RelaxingAudioSystem();

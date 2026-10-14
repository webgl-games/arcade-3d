class AudioEngine {
  private ctx: AudioContext | null = null;
  private volumeNode: GainNode | null = null;
  private currentVolume = 0.5;
  private muted = false;

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.volumeNode = this.ctx.createGain();
      this.volumeNode.gain.setValueAtTime(this.muted ? 0 : this.currentVolume, this.ctx.currentTime);
      this.volumeNode.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }

  setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    this.init();
    if (this.volumeNode && this.ctx) {
      this.volumeNode.gain.setValueAtTime(this.muted ? 0 : this.currentVolume, this.ctx.currentTime);
    }
  }

  setMute(mute: boolean) {
    this.muted = mute;
    this.init();
    if (this.volumeNode && this.ctx) {
      this.volumeNode.gain.setValueAtTime(this.muted ? 0 : this.currentVolume, this.ctx.currentTime);
    }
  }

  getVolume() {
    return this.currentVolume;
  }

  isMuted() {
    return this.muted;
  }

  playJump() {
    this.init();
    if (!this.ctx || !this.volumeNode || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.15);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.volumeNode);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playPickup() {
    this.init();
    if (!this.ctx || !this.volumeNode || this.muted) return;

    const t = this.ctx.currentTime;
    // Play a dual note chime (coin sound effect)
    this.playTone(523.25, "sine", 0.08, 0.15, t); // C5
    this.playTone(659.25, "sine", 0.08, 0.25, t + 0.07); // E5
  }

  playDelivery() {
    this.init();
    if (!this.ctx || !this.volumeNode || this.muted) return;

    const t = this.ctx.currentTime;
    // Triumphant arpeggio
    this.playTone(523.25, "triangle", 0.1, 0.15, t); // C5
    this.playTone(659.25, "triangle", 0.1, 0.15, t + 0.1); // E5
    this.playTone(783.99, "triangle", 0.1, 0.15, t + 0.2); // G5
    this.playTone(1046.50, "sine", 0.15, 0.35, t + 0.3); // C6
  }

  playTalk() {
    this.init();
    if (!this.ctx || !this.volumeNode || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    // Adding slight variation for cartoon talk feel
    const freq = 180 + Math.random() * 80;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.04);

    osc.connect(gain);
    gain.connect(this.volumeNode);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  playAchievement() {
    this.init();
    if (!this.ctx || !this.volumeNode || this.muted) return;

    const t = this.ctx.currentTime;
    // Happy retro scale
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.playTone(freq, "square", 0.06, 0.12, t + idx * 0.06);
    });
  }

  private playTone(freq: number, type: OscillatorType, vol: number, duration: number, startTime: number) {
    if (!this.ctx || !this.volumeNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(this.volumeNode);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const audio = new AudioEngine();

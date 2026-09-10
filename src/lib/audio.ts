/**
 * The one and only midnight song. Wraps an <audio> element with a Web Audio
 * analyser so the UI (player bars, moon halo, star twinkle) can react to it.
 */
type Listener = (playing: boolean) => void;

class NightAudio {
  readonly el: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private bins: Uint8Array<ArrayBuffer> | null = null;
  private listeners = new Set<Listener>();
  playing = false;
  /** true when the browser refused an unprompted play() */
  blocked = false;

  constructor() {
    this.el = new Audio('/music/midnight-song.mp3');
    this.el.loop = true;
    this.el.preload = 'auto';
    this.el.volume = 0.6;
    this.el.addEventListener('play', () => this.set(true));
    this.el.addEventListener('pause', () => this.set(false));
  }

  private set(playing: boolean) {
    if (this.playing === playing) return;
    this.playing = playing;
    this.listeners.forEach((l) => l(playing));
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    l(this.playing);
    return () => {
      this.listeners.delete(l);
    };
  }

  async play() {
    try {
      await this.el.play();
      this.blocked = false;
      this.ensureGraph();
    } catch {
      this.blocked = true;
    }
  }

  pause() {
    this.el.pause();
  }

  toggle() {
    if (this.el.paused) void this.play();
    else this.pause();
  }

  private ensureGraph() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      const src = this.ctx.createMediaElementSource(this.el);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.82;
      src.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.bins = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    } catch {
      this.ctx = null;
    }
  }

  /** Normalised energy for N bars (low -> high) plus a bass value, all 0..1. */
  levels(bars: number): { bars: number[]; bass: number } {
    if (!this.analyser || !this.bins || !this.playing) {
      return { bars: new Array(bars).fill(0), bass: 0 };
    }
    this.analyser.getByteFrequencyData(this.bins);
    const n = this.bins.length; // 64
    const out: number[] = [];
    // log-spaced bands so the bars feel musical rather than all-bass
    for (let i = 0; i < bars; i++) {
      const from = Math.floor(Math.pow(n, i / bars));
      const to = Math.max(from + 1, Math.floor(Math.pow(n, (i + 1) / bars)));
      let sum = 0;
      for (let b = from; b < to && b < n; b++) sum += this.bins[b];
      out.push(Math.min(1, sum / ((to - from) * 255)));
    }
    let bass = 0;
    for (let b = 1; b < 6; b++) bass += this.bins[b];
    bass = Math.min(1, bass / (5 * 255));
    return { bars: out, bass };
  }
}

export const nightAudio = new NightAudio();

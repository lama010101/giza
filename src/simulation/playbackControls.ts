/**
 * Simulation playback controls per M10-T07.
 *
 * Provides playback state management for simulation visualization:
 * play, pause, resume, step forward, step backward, variable speed,
 * and timeline scrubbing.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'stepping' | 'finished';

export interface PlaybackControls {
  state: PlaybackState;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
}

export interface PlaybackOptions {
  duration: number;
  initialSpeed?: number;
  loop?: boolean;
}

// ─── Playback Controller ─────────────────────────────────────────────────────

export class SimulationPlaybackController {
  private state: PlaybackState = 'idle';
  private currentTime = 0;
  private duration: number;
  private speed: number;
  private loop: boolean;
  private listeners = new Set<(controls: PlaybackControls) => void>();
  private stepSize = 1;

  constructor(options: PlaybackOptions) {
    this.duration = options.duration;
    this.speed = options.initialSpeed ?? 1;
    this.loop = options.loop ?? false;
  }

  // ─── State queries ─────────────────────────────────────────────────────

  getControls(): PlaybackControls {
    return {
      state: this.state,
      currentTime: this.currentTime,
      duration: this.duration,
      speed: this.speed,
      loop: this.loop,
    };
  }

  get isPlaying(): boolean {
    return this.state === 'playing';
  }

  get isPaused(): boolean {
    return this.state === 'paused';
  }

  // ─── Playback controls ─────────────────────────────────────────────────

  play(): void {
    if (this.state === 'finished' && !this.loop) return;
    this.state = 'playing';
    this.notify();
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.notify();
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.play();
  }

  stop(): void {
    this.state = 'idle';
    this.currentTime = 0;
    this.notify();
  }

  /** Steps forward by one step unit. */
  stepForward(steps = 1): void {
    this.state = 'stepping';
    this.currentTime = Math.min(this.duration, this.currentTime + steps * this.stepSize);
    if (this.currentTime >= this.duration && !this.loop) {
      this.state = 'finished';
    } else {
      this.state = 'paused';
    }
    this.notify();
  }

  /** Steps backward by one step unit. */
  stepBackward(steps = 1): void {
    this.state = 'stepping';
    this.currentTime = Math.max(0, this.currentTime - steps * this.stepSize);
    this.state = 'paused';
    this.notify();
  }

  /** Seeks to a specific time. */
  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(this.duration, time));
    if (this.currentTime >= this.duration && !this.loop) {
      this.state = 'finished';
    }
    this.notify();
  }

  /** Sets the playback speed multiplier. */
  setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(10, speed));
    this.notify();
  }

  /** Sets the loop mode. */
  setLoop(loop: boolean): void {
    this.loop = loop;
    this.notify();
  }

  /** Sets the step size for step forward/backward. */
  setStepSize(size: number): void {
    this.stepSize = Math.max(0.1, size);
  }

  /** Advances time by delta (called each frame). */
  tick(deltaSeconds: number): void {
    if (this.state !== 'playing') return;
    this.currentTime += deltaSeconds * this.speed;
    if (this.currentTime >= this.duration) {
      if (this.loop) {
        this.currentTime = this.currentTime % this.duration;
      } else {
        this.currentTime = this.duration;
        this.state = 'finished';
      }
    }
    this.notify();
  }

  // ─── Subscription ──────────────────────────────────────────────────────

  subscribe(listener: (controls: PlaybackControls) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const controls = this.getControls();
    for (const listener of this.listeners) {
      listener(controls);
    }
  }

  // ─── Speed presets ─────────────────────────────────────────────────────

  static readonly SPEED_PRESETS = [0.25, 0.5, 1, 2, 4, 8] as const;

  /** Cycles to the next speed preset. */
  cycleSpeed(): void {
    const presets = SimulationPlaybackController.SPEED_PRESETS;
    const currentIndex = presets.findIndex((s) => s === this.speed);
    const nextIndex = (currentIndex + 1) % presets.length;
    this.setSpeed(presets[nextIndex]);
  }
}

/**
 * Async simulation API/queue per M10-T10.
 *
 * Provides an async job queue for running simulations without blocking
 * the UI. Jobs are processed sequentially (or with limited concurrency)
 * and report progress via callbacks. Results are cached by job ID.
 *
 * This is a client-side queue — in production, jobs would be dispatched
 * to a backend simulation service. The queue interface is designed to
 * be backend-agnostic.
 */

import type { SimulationMetadata, SimulationResult } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface SimulationJob {
  id: string;
  metadata: SimulationMetadata;
  status: JobStatus;
  progress: number; // 0-1
  result?: SimulationResult;
  error?: string;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  priority: number; // higher = more urgent
}

export type SimulationRunner = (
  metadata: SimulationMetadata,
  onProgress: (p: number) => void,
) => Promise<SimulationResult>;

export interface QueueOptions {
  maxConcurrent: number;
  retryLimit: number;
  retryDelayMs: number;
}

export interface QueueStats {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

// ─── Event types ─────────────────────────────────────────────────────────────

export type QueueEvent =
  | { type: 'job:queued'; job: SimulationJob }
  | { type: 'job:started'; job: SimulationJob }
  | { type: 'job:progress'; job: SimulationJob }
  | { type: 'job:completed'; job: SimulationJob }
  | { type: 'job:failed'; job: SimulationJob }
  | { type: 'job:cancelled'; job: SimulationJob };

export type QueueListener = (event: QueueEvent) => void;

// ─── Simulation Queue ────────────────────────────────────────────────────────

let jobCounter = 0;

function generateJobId(): string {
  jobCounter += 1;
  return `sim-job-${Date.now()}-${jobCounter}`;
}

export class SimulationQueue {
  private jobs = new Map<string, SimulationJob>();
  private queue: string[] = [];
  private running = new Set<string>();
  private listeners = new Set<QueueListener>();
  private runner: SimulationRunner | null = null;
  private options: QueueOptions;
  private retryCount = new Map<string, number>();

  constructor(options: Partial<QueueOptions> = {}) {
    this.options = {
      maxConcurrent: 1,
      retryLimit: 2,
      retryDelayMs: 1000,
      ...options,
    };
  }

  /** Sets the simulation runner function. */
  setRunner(runner: SimulationRunner): void {
    this.runner = runner;
  }

  /** Subscribes to queue events. Returns an unsubscribe function. */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: QueueEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /** Enqueues a simulation job. Returns the job ID. */
  enqueue(metadata: SimulationMetadata, priority = 0): string {
    const id = generateJobId();
    const job: SimulationJob = {
      id,
      metadata,
      status: 'queued',
      progress: 0,
      queuedAt: new Date().toISOString(),
      priority,
    };
    this.jobs.set(id, job);

    // Insert by priority (higher priority first)
    const insertIndex = this.queue.findIndex((jid) => {
      const j = this.jobs.get(jid);
      return j ? j.priority < priority : true;
    });
    if (insertIndex === -1) {
      this.queue.push(id);
    } else {
      this.queue.splice(insertIndex, 0, id);
    }

    this.emit({ type: 'job:queued', job });
    this.processQueue();
    return id;
  }

  /** Cancels a queued or running job. */
  cancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return false;
    }
    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();
    this.queue = this.queue.filter((id) => id !== jobId);
    this.running.delete(jobId);
    this.emit({ type: 'job:cancelled', job });
    this.processQueue();
    return true;
  }

  /** Gets a job by ID. */
  getJob(jobId: string): SimulationJob | undefined {
    return this.jobs.get(jobId);
  }

  /** Gets all jobs. */
  getAllJobs(): SimulationJob[] {
    return Array.from(this.jobs.values());
  }

  /** Gets queue statistics. */
  getStats(): QueueStats {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      queued: jobs.filter((j) => j.status === 'queued').length,
      running: jobs.filter((j) => j.status === 'running').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      cancelled: jobs.filter((j) => j.status === 'cancelled').length,
    };
  }

  /** Clears completed/failed/cancelled jobs from history. */
  clearHistory(): void {
    for (const [id, job] of this.jobs) {
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        this.jobs.delete(id);
        this.retryCount.delete(id);
      }
    }
  }

  /** Processes the queue, starting new jobs if capacity allows. */
  private processQueue(): void {
    while (this.running.size < this.options.maxConcurrent && this.queue.length > 0) {
      const jobId = this.queue.shift();
      if (!jobId) break;
      const job = this.jobs.get(jobId);
      if (!job || job.status !== 'queued') continue;
      void this.runJob(job);
    }
  }

  /** Runs a single job. */
  private async runJob(job: SimulationJob): Promise<void> {
    if (!this.runner) {
      // No runner set — fail the job
      job.status = 'failed';
      job.error = 'No runner set';
      job.completedAt = new Date().toISOString();
      this.emit({ type: 'job:failed', job });
      this.running.delete(job.id);
      return;
    }

    this.running.add(job.id);
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    this.emit({ type: 'job:started', job });

    try {
      const result = await this.runner(job.metadata, (progress) => {
        job.progress = Math.max(0, Math.min(1, progress));
        this.emit({ type: 'job:progress', job });
      });
      job.result = result;
      job.status = 'completed';
      job.progress = 1;
      job.completedAt = new Date().toISOString();
      this.emit({ type: 'job:completed', job });
    } catch (err) {
      const retries = this.retryCount.get(job.id) ?? 0;
      if (retries < this.options.retryLimit) {
        this.retryCount.set(job.id, retries + 1);
        job.status = 'queued';
        job.progress = 0;
        this.queue.unshift(job.id);
        setTimeout(() => this.processQueue(), this.options.retryDelayMs);
      } else {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : String(err);
        job.completedAt = new Date().toISOString();
        this.emit({ type: 'job:failed', job });
      }
    } finally {
      this.running.delete(job.id);
      this.processQueue();
    }
  }
}

// ─── Singleton queue ─────────────────────────────────────────────────────────

let globalQueue: SimulationQueue | null = null;

export function getSimulationQueue(): SimulationQueue {
  if (!globalQueue) {
    globalQueue = new SimulationQueue();
  }
  return globalQueue;
}

export function resetSimulationQueue(): void {
  globalQueue = null;
}

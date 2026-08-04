import { describe, it, expect, beforeEach } from 'vitest';
import {
  SimulationQueue,
  getSimulationQueue,
  resetSimulationQueue,
  type SimulationRunner,
  type QueueEvent,
} from './asyncSimulationQueue';
import type { SimulationMetadata, SimulationResult } from './types';

function makeMetadata(id = 'sim-001'): SimulationMetadata {
  return {
    id,
    softwareVersion: '1.0.0',
    date: new Date().toISOString(),
    parameters: { simulationType: 'Acoustic', version: 1, parameters: [] },
    author: 'test',
    geometryVersion: '1.0',
    theoryContext: 'test',
    randomSeed: 42,
  };
}

function makeResult(metadata: SimulationMetadata): SimulationResult {
  return {
    metadata,
    outputs: { value: 42 },
    validation: { passed: true, checks: [] },
  };
}

describe('Async Simulation Queue (M10-T10)', () => {
  let queue: SimulationQueue;

  beforeEach(() => {
    queue = new SimulationQueue({ maxConcurrent: 1, retryLimit: 1, retryDelayMs: 10 });
  });

  describe('enqueue', () => {
    it('enqueues a job and returns an ID', () => {
      // Set a slow runner so the job stays queued
      queue.setRunner(async () => new Promise(() => undefined)); // never resolves
      const id = queue.enqueue(makeMetadata());
      expect(id).toMatch(/^sim-job-/);
      const job = queue.getJob(id);
      expect(job).toBeDefined();
      expect(['queued', 'running']).toContain(job!.status);
    });

    it('emits a job:queued event', () => {
      const events: QueueEvent[] = [];
      queue.subscribe((e) => events.push(e));
      queue.setRunner(async () => new Promise(() => undefined)); // never resolves
      queue.enqueue(makeMetadata());
      expect(events.some((e) => e.type === 'job:queued')).toBe(true);
    });
  });

  describe('cancel', () => {
    it('cancels a queued job', () => {
      queue.setRunner(async () => new Promise(() => undefined)); // never resolves
      const id = queue.enqueue(makeMetadata());
      expect(queue.cancel(id)).toBe(true);
      expect(queue.getJob(id)!.status).toBe('cancelled');
    });

    it('returns false for unknown job', () => {
      expect(queue.cancel('unknown')).toBe(false);
    });
  });

  describe('runJob', () => {
    it('runs a job to completion', async () => {
      const runner: SimulationRunner = async (metadata) => Promise.resolve(makeResult(metadata));
      queue.setRunner(runner);
      const id = queue.enqueue(makeMetadata());
      await new Promise((r) => setTimeout(r, 50));
      const job = queue.getJob(id);
      expect(job!.status).toBe('completed');
      expect(job!.result).toBeDefined();
    });

    it('reports progress', async () => {
      const runner: SimulationRunner = async (_metadata, onProgress) => {
        onProgress(0.5);
        await new Promise((r) => setTimeout(r, 10));
        onProgress(1.0);
        return makeResult(_metadata);
      };
      queue.setRunner(runner);
      const events: QueueEvent[] = [];
      queue.subscribe((e) => events.push(e));
      const id = queue.enqueue(makeMetadata());
      await new Promise((r) => setTimeout(r, 50));
      expect(events.some((e) => e.type === 'job:progress')).toBe(true);
      expect(queue.getJob(id)!.progress).toBe(1);
    });

    it('fails when no runner is set', async () => {
      // Don't set a runner - the job should fail
      const id = queue.enqueue(makeMetadata());
      await new Promise((r) => setTimeout(r, 50));
      expect(queue.getJob(id)!.status).toBe('failed');
      expect(queue.getJob(id)!.error).toContain('No runner');
    });

    it('retries on failure', async () => {
      let attempts = 0;
      const runner: SimulationRunner = async (metadata) => {
        await Promise.resolve();
        attempts++;
        if (attempts < 2) throw new Error('transient');
        return makeResult(metadata);
      };
      queue.setRunner(runner);
      const id = queue.enqueue(makeMetadata());
      await new Promise((r) => setTimeout(r, 100));
      expect(queue.getJob(id)!.status).toBe('completed');
      expect(attempts).toBe(2);
    });

    it('fails after retry limit', async () => {
      const runner: SimulationRunner = async () => {
        await Promise.resolve();
        throw new Error('permanent');
      };
      queue.setRunner(runner);
      const id = queue.enqueue(makeMetadata());
      await new Promise((r) => setTimeout(r, 100));
      expect(queue.getJob(id)!.status).toBe('failed');
      expect(queue.getJob(id)!.error).toBe('permanent');
    });
  });

  describe('priority', () => {
    it('processes higher priority jobs first', () => {
      queue.setRunner(async () => new Promise(() => undefined)); // never resolves
      // Enqueue low priority first
      queue.enqueue(makeMetadata('low'), 0);
      queue.enqueue(makeMetadata('high'), 10);
      const stats = queue.getStats();
      expect(stats.total).toBe(2);
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', () => {
      queue.setRunner(async () => new Promise(() => undefined)); // never resolves
      queue.enqueue(makeMetadata('a'));
      queue.enqueue(makeMetadata('b'));
      const stats = queue.getStats();
      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(0);
    });
  });

  describe('clearHistory', () => {
    it('removes completed jobs', async () => {
      const runner: SimulationRunner = async (m) => Promise.resolve(makeResult(m));
      queue.setRunner(runner);
      const id = queue.enqueue(makeMetadata());
      await new Promise((r) => setTimeout(r, 50));
      expect(queue.getStats().completed).toBe(1);
      queue.clearHistory();
      expect(queue.getJob(id)).toBeUndefined();
    });
  });

  describe('singleton', () => {
    it('getSimulationQueue returns same instance', () => {
      resetSimulationQueue();
      const q1 = getSimulationQueue();
      const q2 = getSimulationQueue();
      expect(q1).toBe(q2);
    });

    it('resetSimulationQueue clears singleton', () => {
      const q1 = getSimulationQueue();
      resetSimulationQueue();
      const q2 = getSimulationQueue();
      expect(q1).not.toBe(q2);
    });
  });
});

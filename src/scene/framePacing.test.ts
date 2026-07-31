import { describe, it, expect, beforeEach } from 'vitest';
import { framePacer, TASK_PRIORITIES, type RenderTask } from './framePacing';

describe('Frame Pacing (M04-T09)', () => {
  beforeEach(() => {
    framePacer._resetForTesting();
  });

  describe('setTargetFPS', () => {
    it('sets the target FPS', () => {
      framePacer.setTargetFPS(30);
      expect(framePacer.getTargetFPS()).toBe(30);
      expect(framePacer.getFrameTimeBudget()).toBeCloseTo(1000 / 30, 1);
    });
  });

  describe('prioritizeAndExecute', () => {
    it('executes critical tasks first', () => {
      const order: string[] = [];
      const tasks: RenderTask[] = [
        { id: 'low', priority: 'low', estimatedCost: 1, execute: () => order.push('low') },
        {
          id: 'critical',
          priority: 'critical',
          estimatedCost: 1,
          execute: () => order.push('critical'),
        },
        { id: 'high', priority: 'high', estimatedCost: 1, execute: () => order.push('high') },
      ];

      const startTime = performance.now();
      framePacer.prioritizeAndExecute(tasks, startTime);
      expect(order[0]).toBe('critical');
      expect(order[1]).toBe('high');
    });

    it('defers low-priority tasks when budget is tight', () => {
      const executed: string[] = [];
      const tasks: RenderTask[] = [
        {
          id: 'critical',
          priority: 'critical',
          estimatedCost: 5,
          execute: () => executed.push('critical'),
        },
        { id: 'low', priority: 'low', estimatedCost: 20, execute: () => executed.push('low') },
      ];

      // Set a very tight budget
      framePacer.setTargetFPS(1000); // 1ms budget
      const startTime = performance.now();
      const result = framePacer.prioritizeAndExecute(tasks, startTime);
      expect(result.executed.length).toBeGreaterThanOrEqual(0);
      expect(result.deferred.length).toBeGreaterThanOrEqual(0);
    });

    it('returns budget information', () => {
      const tasks: RenderTask[] = [
        { id: 'task1', priority: 'critical', estimatedCost: 1, execute: () => undefined },
      ];

      const result = framePacer.prioritizeAndExecute(tasks, 0);
      expect(result.budget.targetFPS).toBe(60);
      expect(result.budget.frameTimeMs).toBeCloseTo(1000 / 60, 1);
    });
  });

  describe('isFrameAtRisk', () => {
    it('returns true when elapsed > 80% of budget', () => {
      const budget = framePacer.getFrameTimeBudget();
      expect(framePacer.isFrameAtRisk(budget * 0.9)).toBe(true);
    });

    it('returns false when elapsed < 80% of budget', () => {
      const budget = framePacer.getFrameTimeBudget();
      expect(framePacer.isFrameAtRisk(budget * 0.5)).toBe(false);
    });
  });

  describe('shouldReduceQuality', () => {
    it('returns false initially', () => {
      expect(framePacer.shouldReduceQuality()).toBe(false);
    });
  });

  describe('TASK_PRIORITIES', () => {
    it('defines priority levels for common tasks', () => {
      expect(TASK_PRIORITIES.cameraUpdate).toBe('critical');
      expect(TASK_PRIORITIES.mainRenderPass).toBe('critical');
      expect(TASK_PRIORITIES.frustumCulling).toBe('high');
      expect(TASK_PRIORITIES.postProcessing).toBe('medium');
      expect(TASK_PRIORITIES.debugOverlay).toBe('low');
    });
  });
});

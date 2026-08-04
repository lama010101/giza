/**
 * Frame pacing prioritization per M04-T09.
 *
 * Maintains consistent frame timing by prioritizing render work.
 * If a frame is at risk of exceeding the budget, lower-priority
 * work is deferred to the next frame.
 */

export type RenderPriority = 'critical' | 'high' | 'medium' | 'low';

export interface RenderTask {
  id: string;
  priority: RenderPriority;
  estimatedCost: number; // milliseconds
  execute: () => void;
}

export interface FrameBudget {
  targetFPS: number;
  frameTimeMs: number;
  usedTimeMs: number;
  remainingTimeMs: number;
}

export interface FramePacingResult {
  executed: RenderTask[];
  deferred: RenderTask[];
  budget: FrameBudget;
  droppedFrames: number;
}

class FramePacer {
  private targetFPS = 60;
  private frameTimeBudget = 1000 / 60; // ms
  private currentFrameTime = 0;
  private droppedFrames = 0;
  private consecutiveDroppedFrames = 0;

  /**
   * Sets the target FPS.
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameTimeBudget = 1000 / fps;
  }

  getTargetFPS(): number {
    return this.targetFPS;
  }

  getFrameTimeBudget(): number {
    return this.frameTimeBudget;
  }

  /**
   * Prioritizes and executes render tasks within the frame budget.
   * Tasks are sorted by priority (critical > high > medium > low).
   * Lower-priority tasks are deferred if the budget is exceeded.
   */
  prioritizeAndExecute(tasks: RenderTask[], frameStartTime: number): FramePacingResult {
    const now = performance.now();
    const elapsed = now - frameStartTime;

    // Sort by priority
    const priorityOrder: Record<RenderPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const sorted = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const executed: RenderTask[] = [];
    const deferred: RenderTask[] = [];
    let usedTime = elapsed;

    for (const task of sorted) {
      if (usedTime + task.estimatedCost <= this.frameTimeBudget) {
        const taskStart = performance.now();
        task.execute();
        const taskTime = performance.now() - taskStart;
        usedTime += taskTime;
        executed.push(task);
      } else {
        deferred.push(task);
      }
    }

    // Track dropped frames
    if (usedTime > this.frameTimeBudget) {
      this.droppedFrames++;
      this.consecutiveDroppedFrames++;
    } else {
      this.consecutiveDroppedFrames = 0;
    }

    this.currentFrameTime = usedTime;

    return {
      executed,
      deferred,
      budget: {
        targetFPS: this.targetFPS,
        frameTimeMs: this.frameTimeBudget,
        usedTimeMs: usedTime,
        remainingTimeMs: Math.max(0, this.frameTimeBudget - usedTime),
      },
      droppedFrames: this.droppedFrames,
    };
  }

  /**
   * Returns true if the frame is at risk of exceeding the budget.
   */
  isFrameAtRisk(elapsedTime: number): boolean {
    return elapsedTime > this.frameTimeBudget * 0.8;
  }

  /**
   * Returns the current frame time.
   */
  getCurrentFrameTime(): number {
    return this.currentFrameTime;
  }

  /**
   * Returns the total dropped frames count.
   */
  getDroppedFrames(): number {
    return this.droppedFrames;
  }

  /**
   * Returns true if quality should be reduced (sustained frame drops).
   */
  shouldReduceQuality(): boolean {
    return this.consecutiveDroppedFrames >= 10;
  }

  /**
   * Resets the frame pacer. Intended for testing.
   */
  _resetForTesting(): void {
    this.targetFPS = 60;
    this.frameTimeBudget = 1000 / 60;
    this.currentFrameTime = 0;
    this.droppedFrames = 0;
    this.consecutiveDroppedFrames = 0;
  }
}

export const framePacer = new FramePacer();

/**
 * Priority levels for common render tasks.
 */
export const TASK_PRIORITIES = {
  cameraUpdate: 'critical' as RenderPriority,
  sceneGraphUpdate: 'critical' as RenderPriority,
  frustumCulling: 'high' as RenderPriority,
  lodSelection: 'high' as RenderPriority,
  shadowMapUpdate: 'high' as RenderPriority,
  mainRenderPass: 'critical' as RenderPriority,
  postProcessing: 'medium' as RenderPriority,
  debugOverlay: 'low' as RenderPriority,
  statsUpdate: 'low' as RenderPriority,
};

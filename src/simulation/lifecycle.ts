import { LIFECYCLE_ORDER, type SimulationLifecycleState } from './types';

export class SimulationLifecycle {
  private state: SimulationLifecycleState = 'Idle';
  private stateHistory: { state: SimulationLifecycleState; timestamp: number }[] = [];

  getState(): SimulationLifecycleState {
    return this.state;
  }

  getStateHistory(): { state: SimulationLifecycleState; timestamp: number }[] {
    return [...this.stateHistory];
  }

  transition(next: SimulationLifecycleState): void {
    const currentIdx = LIFECYCLE_ORDER.indexOf(this.state);
    const nextIdx = LIFECYCLE_ORDER.indexOf(next);

    if (nextIdx < 0) {
      throw new Error(`Unknown lifecycle state: ${next}`);
    }

    if (nextIdx !== currentIdx + 1 && next !== 'Idle') {
      throw new Error(
        `Invalid transition from ${this.state} to ${next}. Expected next state or reset to Idle.`,
      );
    }

    this.state = next;
    this.stateHistory.push({ state: next, timestamp: Date.now() });
  }

  reset(): void {
    this.state = 'Idle';
    this.stateHistory.push({ state: 'Idle', timestamp: Date.now() });
  }

  canTransitionTo(next: SimulationLifecycleState): boolean {
    const currentIdx = LIFECYCLE_ORDER.indexOf(this.state);
    const nextIdx = LIFECYCLE_ORDER.indexOf(next);
    return nextIdx === currentIdx + 1 || next === 'Idle';
  }
}

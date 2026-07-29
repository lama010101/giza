import { useAppStore } from '@/store/app';
import { useSimulationStore } from '@/store/simulation';

export function SimulationPanel(): JSX.Element | null {
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const hydraulicActive = activeHypothesisIds.includes('THEORY-OSIRIS-001');

  const running = useSimulationStore((s) => s.running);
  const waterLevel = useSimulationStore((s) => s.waterLevel);
  const inflowRate = useSimulationStore((s) => s.inflowRate);
  const outflowRate = useSimulationStore((s) => s.outflowRate);
  const channelWidth = useSimulationStore((s) => s.channelWidth);
  const elapsedTime = useSimulationStore((s) => s.elapsedTime);
  const stable = useSimulationStore((s) => s.stable);

  const setRunning = useSimulationStore((s) => s.setRunning);
  const setWaterLevel = useSimulationStore((s) => s.setWaterLevel);
  const setInflowRate = useSimulationStore((s) => s.setInflowRate);
  const setOutflowRate = useSimulationStore((s) => s.setOutflowRate);
  const setChannelWidth = useSimulationStore((s) => s.setChannelWidth);
  const reset = useSimulationStore((s) => s.reset);

  if (!hydraulicActive) {
    return (
      <div className="sim-panel" data-testid="sim-panel">
        <p className="sim-empty">
          Activate the Hydraulic Functionality hypothesis to enable simulation controls.
        </p>
      </div>
    );
  }

  return (
    <div className="sim-panel" data-testid="sim-panel">
      <h3>Hydraulic Simulation</h3>

      <label>
        Water Level
        <input
          type="range"
          min="0"
          max="3"
          step="0.05"
          value={waterLevel}
          onChange={(e) => setWaterLevel(parseFloat(e.target.value))}
        />
        <span className="sim-value">{waterLevel.toFixed(2)} m</span>
      </label>

      <label>
        Inflow Rate
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={inflowRate}
          onChange={(e) => setInflowRate(parseFloat(e.target.value))}
        />
        <span className="sim-value">{inflowRate.toFixed(2)} m/s</span>
      </label>

      <label>
        Outflow Rate
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={outflowRate}
          onChange={(e) => setOutflowRate(parseFloat(e.target.value))}
        />
        <span className="sim-value">{outflowRate.toFixed(2)} m/s</span>
      </label>

      <label>
        Channel Width
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.05"
          value={channelWidth}
          onChange={(e) => setChannelWidth(parseFloat(e.target.value))}
        />
        <span className="sim-value">{channelWidth.toFixed(2)} m</span>
      </label>

      <div className="sim-buttons">
        <button
          type="button"
          className={running ? 'active' : ''}
          aria-pressed={running}
          onClick={() => setRunning(!running)}
        >
          {running ? 'Pause' : 'Run'}
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>

      <div className="sim-status">
        {running ? (
          stable ? (
            <span>Stable — water level equilibrium reached</span>
          ) : (
            <span>Simulating… {elapsedTime.toFixed(1)}s elapsed</span>
          )
        ) : (
          <span>Paused</span>
        )}
      </div>
    </div>
  );
}

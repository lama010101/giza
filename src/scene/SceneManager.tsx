/**
 * Scene Manager component per M04-T01.
 *
 * Manages scene lifecycle: mounting/unmounting scenes, switching between
 * scenes (Great Pyramid, Osiris Shaft, Benchmark), and coordinating the
 * render pipeline. Supports scene preloading and transitions.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GreatPyramidScene } from './GreatPyramidScene';
import { OsirisScene } from './OsirisScene';
import { BenchmarkScene } from './BenchmarkScene';

export type SceneId = 'great-pyramid' | 'osiris' | 'benchmark';

export type SceneLoadState = 'unloaded' | 'loading' | 'loaded' | 'error';

export interface SceneStatus {
  sceneId: SceneId;
  state: SceneLoadState;
  error?: string;
}

export interface SceneManagerAPI {
  currentScene: SceneId;
  status: SceneStatus;
  preloadScene: (id: SceneId) => void;
  switchScene: (id: SceneId) => void;
}

// ─── Scene registry ──────────────────────────────────────────────────────────

const SCENE_COMPONENTS: Record<SceneId, () => JSX.Element> = {
  'great-pyramid': GreatPyramidScene,
  osiris: OsirisScene,
  benchmark: BenchmarkScene,
};

const SCENE_LABELS: Record<SceneId, string> = {
  'great-pyramid': 'Great Pyramid',
  osiris: 'Osiris Shaft',
  benchmark: 'Benchmark',
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface SceneManagerProps {
  sceneId: SceneId;
  /** Transition duration in ms (default 300). */
  transitionDuration?: number;
  /** Called when the active scene changes. */
  onSceneChange?: (id: SceneId) => void;
  /** Called when a scene reports an error. */
  onError?: (sceneId: SceneId, error: string) => void;
  /** Children to render alongside the scene (e.g. overlays). */
  children?: React.ReactNode;
}

export function SceneManager({
  sceneId,
  transitionDuration = 300,
  onSceneChange,
  onError,
  children,
}: SceneManagerProps): JSX.Element {
  const [currentScene, setCurrentScene] = useState<SceneId>(sceneId);
  const [status, setStatus] = useState<SceneStatus>({ sceneId, state: 'loading' });
  const [transitioning, setTransitioning] = useState(false);
  const preloadedRef = useRef<Set<SceneId>>(new Set([sceneId]));
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle scene switches
  const switchScene = useCallback(
    (id: SceneId) => {
      if (id === currentScene) return;
      setTransitioning(true);
      setStatus({ sceneId: id, state: 'loading' });

      // Fade out → swap → fade in
      transitionTimer.current = setTimeout(() => {
        setCurrentScene(id);
        setStatus({ sceneId: id, state: 'loaded' });
        setTransitioning(false);
        onSceneChange?.(id);
      }, transitionDuration);
    },
    [currentScene, transitionDuration, onSceneChange],
  );

  // Preload a scene (mark as preloaded so it can switch instantly)
  const preloadScene = useCallback((id: SceneId) => {
    preloadedRef.current.add(id);
  }, []);

  // React to external sceneId changes
  useEffect(() => {
    preloadScene(sceneId);
    if (sceneId !== currentScene) {
      switchScene(sceneId);
    }
  }, [sceneId, currentScene, switchScene, preloadScene]);

  // Mark loaded after first mount
  useEffect(() => {
    if (status.state === 'loading') {
      const t = setTimeout(() => setStatus((s) => ({ ...s, state: 'loaded' })), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status.state]);

  // Error boundary handler
  const handleError = useCallback(
    (error: Error) => {
      const msg = error.message;
      setStatus({ sceneId: currentScene, state: 'error', error: msg });
      onError?.(currentScene, msg);
    },
    [currentScene, onError],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  const SceneComponent = SCENE_COMPONENTS[currentScene] ?? SCENE_COMPONENTS.osiris;

  return (
    <div
      className="scene-manager"
      data-testid="scene-manager"
      data-scene={currentScene}
      data-state={status.state}
      style={{
        opacity: transitioning ? 0 : 1,
        transition: `opacity ${transitionDuration}ms ease-in-out`,
      }}
    >
      {status.state === 'error' ? (
        <div className="scene-error" data-testid="scene-error">
          Failed to load {SCENE_LABELS[currentScene]}: {status.error}
        </div>
      ) : (
        <ErrorBoundaryWrapper onError={handleError}>
          <SceneComponent />
        </ErrorBoundaryWrapper>
      )}
      {children}
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useSceneManager(initialScene: SceneId = 'osiris'): SceneManagerAPI & {
  element: JSX.Element;
} {
  const [currentScene, setCurrentScene] = useState<SceneId>(initialScene);
  const [status, setStatus] = useState<SceneStatus>({ sceneId: initialScene, state: 'loaded' });

  const preloadScene = useCallback((id: SceneId) => {
    // Preloading is a no-op in this synchronous implementation
    void id;
  }, []);

  const switchScene = useCallback((id: SceneId) => {
    setCurrentScene(id);
    setStatus({ sceneId: id, state: 'loaded' });
  }, []);

  return {
    currentScene,
    status,
    preloadScene,
    switchScene,
    element: <SceneManager sceneId={currentScene} onSceneChange={switchScene} />,
  };
}

// ─── Error boundary wrapper ──────────────────────────────────────────────────

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundaryWrapper extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    this.props.onError(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <div data-testid="scene-error-boundary">Scene error</div>;
    }
    return this.props.children;
  }
}

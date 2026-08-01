import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SceneManager, useSceneManager } from './SceneManager';

// Mock R3F Canvas used by child scenes
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useThree: () => ({
    scene: { fog: null },
    gl: { domElement: document.createElement('canvas') },
    camera: { position: { x: 0, y: 0, z: 0 } },
  }),
  useFrame: () => undefined,
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Text: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock child scenes to keep tests lightweight
vi.mock('./GreatPyramidScene', () => ({
  GreatPyramidScene: () => <div data-testid="gp-scene" />,
}));
vi.mock('./OsirisScene', () => ({
  OsirisScene: () => <div data-testid="osiris-scene" />,
}));
vi.mock('./BenchmarkScene', () => ({
  BenchmarkScene: () => <div data-testid="benchmark-scene" />,
}));

describe('SceneManager (M04-T01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Osiris scene by default', () => {
    render(<SceneManager sceneId="osiris" />);
    expect(screen.getByTestId('osiris-scene')).toBeInTheDocument();
  });

  it('renders the Great Pyramid scene when selected', () => {
    render(<SceneManager sceneId="great-pyramid" />);
    expect(screen.getByTestId('gp-scene')).toBeInTheDocument();
  });

  it('renders the Benchmark scene when selected', () => {
    render(<SceneManager sceneId="benchmark" />);
    expect(screen.getByTestId('benchmark-scene')).toBeInTheDocument();
  });

  it('exposes the current scene via data-scene attribute', () => {
    render(<SceneManager sceneId="great-pyramid" />);
    const mgr = screen.getByTestId('scene-manager');
    expect(mgr.getAttribute('data-scene')).toBe('great-pyramid');
  });

  it('calls onSceneChange when the scene switches', async () => {
    const onSceneChange = vi.fn();
    const { rerender } = render(
      <SceneManager sceneId="osiris" onSceneChange={onSceneChange} transitionDuration={10} />,
    );
    rerender(
      <SceneManager
        sceneId="great-pyramid"
        onSceneChange={onSceneChange}
        transitionDuration={10}
      />,
    );
    // Wait for transition timer
    await new Promise((r) => setTimeout(r, 50));
    expect(onSceneChange).toHaveBeenCalledWith('great-pyramid');
  });

  it('useSceneManager hook provides API', () => {
    function TestHarness() {
      const api = useSceneManager('osiris');
      return (
        <div>
          <span data-testid="current-scene">{api.currentScene}</span>
          {api.element}
        </div>
      );
    }
    render(<TestHarness />);
    expect(screen.getByTestId('current-scene').textContent).toBe('osiris');
    expect(screen.getByTestId('osiris-scene')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BenchmarkScene } from './BenchmarkScene';

// Mock R3F with all hooks used by the benchmark scene
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

describe('BenchmarkScene (M08.5)', () => {
  it('renders the benchmark canvas', () => {
    render(<BenchmarkScene />);
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('renders the layered lighting system (M08.5-T02)', () => {
    render(<BenchmarkScene />);
    expect(screen.getByTestId('layered-lighting')).toBeInTheDocument();
  });

  it('renders the material sample row with 5 materials (M08.5-T03)', () => {
    render(<BenchmarkScene />);
    expect(screen.getByTestId('material-sample-row')).toBeInTheDocument();
    expect(screen.getByTestId('material-block-MAT_TuraLimestone')).toBeInTheDocument();
    expect(screen.getByTestId('material-block-MAT_LocalLimestone')).toBeInTheDocument();
    expect(screen.getByTestId('material-block-MAT_AswanGranite')).toBeInTheDocument();
    expect(screen.getByTestId('material-block-MAT_Basalt')).toBeInTheDocument();
    expect(screen.getByTestId('material-block-MAT_Water')).toBeInTheDocument();
  });

  it('renders the water mesh (M08.5-T04)', () => {
    render(<BenchmarkScene />);
    expect(screen.getByTestId('water-mesh')).toBeInTheDocument();
  });

  it('renders stairs for physics testing (M08.5-T06)', () => {
    render(<BenchmarkScene />);
    expect(screen.getByTestId('benchmark-stairs')).toBeInTheDocument();
  });

  it('renders a shaft for physics testing (M08.5-T06)', () => {
    render(<BenchmarkScene />);
    expect(screen.getByTestId('benchmark-shaft')).toBeInTheDocument();
  });

  it('renders the reference floor', () => {
    render(<BenchmarkScene />);
    expect(screen.getByTestId('benchmark-floor')).toBeInTheDocument();
  });

  it('renders test primitives (cube and sphere)', () => {
    render(<BenchmarkScene />);
    expect(screen.getByTestId('benchmark-cube')).toBeInTheDocument();
    expect(screen.getByTestId('benchmark-sphere')).toBeInTheDocument();
  });
});

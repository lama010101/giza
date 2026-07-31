import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Level0Surface } from './Level0Surface';

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    scene: { fog: null },
    gl: { domElement: document.createElement('canvas') },
    camera: { position: { x: 0, y: 0, z: 0 } },
  }),
  useFrame: () => undefined,
}));

describe('Level0Surface (M09-T03, GIZA-03 §2.8)', () => {
  it('renders the surface group', () => {
    render(<Level0Surface />);
    expect(screen.getByTestId('level-0-surface')).toBeInTheDocument();
  });

  it('renders limestone bedrock', () => {
    render(<Level0Surface />);
    expect(screen.getByTestId('surface-bedrock')).toBeInTheDocument();
  });

  it('renders desert surface with terrain undulations', () => {
    render(<Level0Surface />);
    expect(screen.getByTestId('surface-desert')).toBeInTheDocument();
  });

  it('renders excavation perimeter', () => {
    render(<Level0Surface />);
    expect(screen.getByTestId('surface-excavation-perimeter')).toBeInTheDocument();
  });

  it('renders entrance opening', () => {
    render(<Level0Surface />);
    expect(screen.getByTestId('surface-entrance')).toBeInTheDocument();
  });

  it('renders modern protective fencing by default', () => {
    render(<Level0Surface />);
    expect(screen.getByTestId('surface-fencing')).toBeInTheDocument();
    expect(screen.getByTestId('fence-segment-0')).toBeInTheDocument();
    expect(screen.getByTestId('fence-segment-1')).toBeInTheDocument();
    expect(screen.getByTestId('fence-segment-2')).toBeInTheDocument();
    expect(screen.getByTestId('fence-segment-3')).toBeInTheDocument();
  });

  it('hides fencing when showFencing is false', () => {
    render(<Level0Surface showFencing={false} />);
    expect(screen.queryByTestId('surface-fencing')).not.toBeInTheDocument();
  });

  it('renders visitor paths', () => {
    render(<Level0Surface />);
    expect(screen.getByTestId('surface-visitor-path-n')).toBeInTheDocument();
    expect(screen.getByTestId('surface-visitor-path-e')).toBeInTheDocument();
  });

  it('renders reference markers', () => {
    render(<Level0Surface />);
    expect(screen.getByTestId('surface-reference-marker-1')).toBeInTheDocument();
    expect(screen.getByTestId('surface-reference-marker-2')).toBeInTheDocument();
  });

  it('renders all 8 required surface elements per spec', () => {
    render(<Level0Surface />);
    // GIZA-03 §2.8: limestone bedrock, desert surface, excavation perimeter,
    // entrance opening, modern fencing, visitor paths, terrain undulations,
    // reference markers
    const required = [
      'surface-bedrock',
      'surface-desert',
      'surface-excavation-perimeter',
      'surface-entrance',
      'surface-fencing',
      'surface-visitor-path-n',
      'surface-visitor-path-e',
      'surface-reference-marker-1',
      'surface-reference-marker-2',
    ];
    for (const id of required) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });
});

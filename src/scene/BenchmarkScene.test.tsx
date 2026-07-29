import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BenchmarkScene } from './BenchmarkScene';

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="r3f-canvas" />,
}));

describe('BenchmarkScene', () => {
  it('renders the benchmark canvas', () => {
    render(<BenchmarkScene />);
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });
});

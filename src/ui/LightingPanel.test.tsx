import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLightingStore } from '@/store/lighting';
import { LightingPanel } from './LightingPanel';

describe('LightingPanel', () => {
  beforeEach(() => {
    useLightingStore.getState().reset();
  });

  it('renders the lighting panel with controls visible', () => {
    render(<LightingPanel />);
    expect(screen.getByTestId('lighting-panel')).toBeInTheDocument();
    expect(screen.getByText('Ambient')).toBeInTheDocument();
    expect(screen.getByText('Directional')).toBeInTheDocument();
    expect(screen.getByText('Azimuth')).toBeInTheDocument();
    expect(screen.getByText('Elevation')).toBeInTheDocument();
    expect(screen.getByText('Background')).toBeInTheDocument();
  });

  it('updates ambient intensity via slider', () => {
    render(<LightingPanel />);

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '2.0' } });

    expect(useLightingStore.getState().ambientIntensity).toBeCloseTo(2.0, 5);
  });

  it('resets to defaults on reset button click', () => {
    useLightingStore.getState().setAmbientIntensity(3);
    useLightingStore.getState().setDirectionalIntensity(5);

    render(<LightingPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(useLightingStore.getState().ambientIntensity).toBe(0.7);
    expect(useLightingStore.getState().directionalIntensity).toBe(1.2);
  });
});

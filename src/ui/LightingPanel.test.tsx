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
    // "Ambient" appears in both the layer toggle and the slider label
    expect(screen.getAllByText('Ambient').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Directional').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Azimuth')).toBeInTheDocument();
    expect(screen.getByText('Elevation')).toBeInTheDocument();
    expect(screen.getByText('Background')).toBeInTheDocument();
  });

  it('renders all 5 light layer toggles', () => {
    render(<LightingPanel />);
    // Each layer name appears in toggle and possibly slider label
    expect(screen.getAllByText('Ambient').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Directional').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Local').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Bounce').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Volumetric').length).toBeGreaterThanOrEqual(1);
  });

  it('renders light mode selector with 3 modes', () => {
    render(<LightingPanel />);
    const select = screen.getByDisplayValue('Exploration');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Documentary')).toBeInTheDocument();
    expect(screen.getByText('Scientific Inspection')).toBeInTheDocument();
  });

  it('updates ambient intensity via slider', () => {
    render(<LightingPanel />);

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '2.0' } });

    expect(useLightingStore.getState().ambientIntensity).toBeCloseTo(2.0, 5);
  });

  it('toggles bounce layer via checkbox', () => {
    render(<LightingPanel />);
    const bounceCheckbox = screen
      .getAllByRole('checkbox')
      .find((cb) => cb.parentElement?.textContent?.includes('Bounce'));
    expect(bounceCheckbox).toBeDefined();
    expect(useLightingStore.getState().bounceEnabled).toBe(false);
    fireEvent.click(bounceCheckbox!);
    expect(useLightingStore.getState().bounceEnabled).toBe(true);
  });

  it('switches light mode via select', () => {
    render(<LightingPanel />);
    const select = screen.getByDisplayValue('Exploration');
    fireEvent.change(select, { target: { value: 'Documentary' } });
    expect(useLightingStore.getState().lightMode).toBe('Documentary');
    expect(useLightingStore.getState().volumetricEnabled).toBe(true);
  });

  it('resets to defaults on reset button click', () => {
    useLightingStore.getState().setAmbientIntensity(3);
    useLightingStore.getState().setDirectionalIntensity(5);

    render(<LightingPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(useLightingStore.getState().ambientIntensity).toBe(4);
    expect(useLightingStore.getState().directionalIntensity).toBe(1.2);
  });
});

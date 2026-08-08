/**
 * Smoke test for the Osiris scene canvas mount and debug overlay toggles.
 *
 * This test verifies that:
 *   1. The Osiris scene canvas mounts without runtime errors.
 *   2. The debug overlay can be enabled and toggled.
 *   3. Stats can be updated and rendered as text lines.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { OsirisScene } from './OsirisScene';
import { debugOverlay } from './debugOverlay';
import { useLightingStore } from '@/store/lighting';
import { useSimulationStore } from '@/store/simulation';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'r3f-canvas' }, children),
  useThree: () => ({
    scene: { fog: null },
    gl: { domElement: document.createElement('canvas') },
    camera: { position: { x: 0, y: 0, z: 0 } },
  }),
  useFrame: () => undefined,
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => React.createElement('div', { 'data-testid': 'orbit-controls' }),
  Text: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

describe('OsirisScene smoke test', () => {
  beforeEach(() => {
    debugOverlay._resetForTesting();
    useLightingStore.getState().reset();
    useSimulationStore.getState().reset();
  });

  it('mounts the Osiris scene canvas', () => {
    render(React.createElement(OsirisScene));
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('toggles individual debug displays', () => {
    expect(debugOverlay.isEnabled()).toBe(false);
    expect(debugOverlay.getActiveDisplays()).toEqual([]);

    debugOverlay.setEnabled(true);
    debugOverlay.toggleDisplay('fps');
    expect(debugOverlay.getActiveDisplays()).toContain('fps');

    debugOverlay.toggleDisplay('fps');
    expect(debugOverlay.getActiveDisplays()).not.toContain('fps');
  });

  it('enables and disables all debug displays', () => {
    debugOverlay.setEnabled(true);
    debugOverlay.enableAll();
    expect(debugOverlay.getActiveDisplays().length).toBeGreaterThan(0);

    debugOverlay.disableAll();
    expect(debugOverlay.getActiveDisplays()).toEqual([]);
  });

  it('updates stats and renders non-empty overlay lines', () => {
    debugOverlay.setEnabled(true);
    debugOverlay.enableAll();
    debugOverlay.updateStats({
      fps: 60,
      frameTime: 16.6,
      drawCalls: 128,
      triangles: 42_000,
      sceneNodes: 24,
      visibleNodes: 18,
      evidenceCoverage: 95,
    });
    debugOverlay.recordFrame(16.6);

    const lines = debugOverlay.renderOverlay();
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((line) => line.includes('FPS:'))).toBe(true);
    expect(lines.some((line) => line.includes('Evidence Coverage:'))).toBe(true);
  });
});

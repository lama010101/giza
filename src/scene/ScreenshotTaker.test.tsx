import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { useAppStore } from '@/store/app';
import { ScreenshotTaker } from './ScreenshotTaker';
import { composeScreenshot } from './screenshot';

vi.mock('@react-three/fiber', () => ({
  useThree: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      gl: createFakeGl(),
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(),
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('./screenshot', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./screenshot')>();
  return {
    ...actual,
    composeScreenshot: vi.fn(() => Promise.resolve('data:image/png;base64,test')),
    getCitationText: vi.fn(() => 'GIZA v0.1.0'),
  };
});

function createFakeGl() {
  const canvas = document.createElement('canvas');
  return {
    domElement: canvas,
    render: vi.fn(),
    setDrawingBufferSize: vi.fn(),
    getPixelRatio: vi.fn(() => 1),
    setClearColor: vi.fn(),
    getClearColor: vi.fn((target: THREE.Color) => target.set(0, 0, 0)),
    setClearAlpha: vi.fn(),
    getClearAlpha: vi.fn(() => 1),
  };
}

const DEFAULT_OPTIONS = {
  hideUi: true,
  transparentBg: false,
  highRes: false,
  orthographic: false,
  scaleBar: true,
  northArrow: true,
  citationWatermark: true,
  format: 'png' as const,
};

describe('ScreenshotTaker', () => {
  beforeEach(() => {
    useAppStore.setState({
      screenshotRequest: null,
      screenshotOptions: DEFAULT_OPTIONS,
      activeMonument: 'great-pyramid',
      selectedObjectId: null,
      selectedEvidenceId: null,
    });
    document.body.classList.remove('screenshot-mode');
    vi.clearAllMocks();
  });

  it('renders nothing', () => {
    const { container } = render(<ScreenshotTaker />);
    expect(container.firstChild).toBeNull();
  });

  it('hides UI, composes a screenshot, and clears the request', async () => {
    useAppStore.setState({ screenshotRequest: 123 });

    render(<ScreenshotTaker />);

    expect(document.body.classList.contains('screenshot-mode')).toBe(true);

    await waitFor(() => expect(useAppStore.getState().screenshotRequest).toBeNull());

    expect(composeScreenshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(THREE.Scene),
      expect.any(THREE.PerspectiveCamera),
      DEFAULT_OPTIONS,
      expect.any(THREE.Vector3),
      'GIZA v0.1.0',
    );
    expect(document.body.classList.contains('screenshot-mode')).toBe(false);
  });
});

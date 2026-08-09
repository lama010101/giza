import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/store/app';
import { ResearchTools } from './ResearchTools';

describe('ResearchTools', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    useAppStore.setState({
      mode: 'Research',
      activeMonument: 'great-pyramid',
      activeHypothesisIds: [],
      selectedObjectId: null,
      hoveredNodeId: null,
      crossSection: { enabled: false, axis: 'y', offset: 0 },
      isolatedLayer: null,
      hiddenLayers: [],
    });
  });

  afterEach(() => {
    clickSpy?.mockRestore();
  });

  it('renders research tool sections', () => {
    render(<ResearchTools />);
    expect(screen.getByRole('heading', { name: /Cross-Section/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Layer Isolation/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Metadata Browser/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Confidence$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Geometry Stats/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Screenshot Export/i })).toBeInTheDocument();
  });

  it('toggles cross-section state', async () => {
    render(<ResearchTools />);
    const checkbox = screen.getByRole('checkbox', { name: /Enable clipping plane/i });
    await userEvent.click(checkbox);
    expect(useAppStore.getState().crossSection.enabled).toBe(true);
  });

  it('changes cross-section axis and offset', async () => {
    useAppStore.setState({ crossSection: { enabled: true, axis: 'y', offset: 0 } });
    render(<ResearchTools />);
    await userEvent.click(screen.getByRole('button', { name: 'X' }));
    expect(useAppStore.getState().crossSection.axis).toBe('x');

    const slider = screen.getByRole('slider', { name: /Offset/i });
    fireEvent.change(slider, { target: { value: '5' } });
    expect(useAppStore.getState().crossSection.offset).toBe(5);
  });

  it('isolates a layer and updates hidden layers', async () => {
    render(<ResearchTools />);
    const select = screen.getByRole('combobox', { name: /Isolate layer/i });
    await userEvent.selectOptions(select, 'exterior');
    expect(useAppStore.getState().isolatedLayer).toBe('exterior');
    expect(useAppStore.getState().hiddenLayers).not.toContain('exterior');
    expect(useAppStore.getState().hiddenLayers.length).toBeGreaterThan(0);
  });

  it('shows metadata and geometry stats for a hovered node', () => {
    useAppStore.setState({ hoveredNodeId: 'pyramid-exterior' });
    render(<ResearchTools />);
    expect(screen.getByTestId('metadata-browser')).toHaveTextContent(/Pyramid Exterior/i);
    expect(screen.getByTestId('geometry-stats')).toHaveTextContent(/Dimensions/i);
  });

  it('triggers a screenshot export', async () => {
    const toDataURL = vi.fn().mockReturnValue('data:image/png;base64,MOCK');
    const canvas = document.createElement('canvas');
    canvas.className = 'viewport-canvas';
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL });

    const container = document.createElement('div');
    container.className = 'viewport';
    container.appendChild(canvas);
    document.body.appendChild(container);

    render(<ResearchTools />);
    await userEvent.click(screen.getByRole('button', { name: /Export PNG/i }));
    expect(toDataURL).toHaveBeenCalled();

    document.body.removeChild(container);
  });
});

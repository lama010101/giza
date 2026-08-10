import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { LeftPanel } from './LeftPanel';
import { useAppStore } from '@/store/app';

describe('LeftPanel (M07-T01)', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeMonument: 'osiris',
      lod: 'LOD0',
      bookmarks: [],
      bookmarkedObjectIds: ['OBJ-0001'],
      activeLocationId: null,
      selectedObjectId: null,
    });
  });

  it('renders the scene hierarchy, bookmarks, and navigation sections', () => {
    render(<LeftPanel />);
    expect(screen.getByText('Explorer')).toBeInTheDocument();
    expect(screen.getByText('Scene Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('lists scene nodes from the active monument', () => {
    render(<LeftPanel />);
    const hierarchy = screen.getByText('Scene Hierarchy').closest('section');
    expect(hierarchy).toBeTruthy();
    if (!hierarchy) throw new Error('Missing hierarchy section');
    expect(within(hierarchy).getByText('Osiris Shaft')).toBeInTheDocument();
    expect(within(hierarchy).getByText('Shaft A')).toBeInTheDocument();
  });

  it('lists saved bookmarks and restores a bookmark', () => {
    useAppStore.setState({
      bookmarks: [
        {
          id: 'bm-001',
          name: 'Shaft A View',
          createdAt: '2026-08-08T12:00:00.000Z',
          camera: {
            position: { x: 0, y: 0, z: 10 },
            target: { x: 0, y: 0, z: 0 },
            mode: 'orbit',
          },
          visibleLayers: ['shafts'],
          hiddenLayers: [],
          activeHypothesisIds: [],
          hiddenVisibilityLayers: [],
          notes: '',
        },
      ],
    });
    render(<LeftPanel />);
    const bookmarks = screen.getByText('Bookmarks').closest('section');
    expect(bookmarks).toBeTruthy();
    if (!bookmarks) throw new Error('Missing bookmarks section');
    expect(within(bookmarks).getByText('Shaft A View')).toBeInTheDocument();
  });

  it('shares a bookmark link on click', () => {
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    useAppStore.setState({
      bookmarks: [
        {
          id: 'bm-002',
          name: 'Shaft A View',
          createdAt: '2026-08-08T12:00:00.000Z',
          camera: {
            position: { x: 0, y: 0, z: 10 },
            target: { x: 0, y: 0, z: 0 },
            mode: 'orbit',
          },
          visibleLayers: ['shafts'],
          hiddenLayers: [],
          activeHypothesisIds: [],
          hiddenVisibilityLayers: [],
          notes: '',
        },
      ],
    });
    render(<LeftPanel />);
    const shareBtn = screen.getByLabelText('Share Shaft A View');
    fireEvent.click(shareBtn);
    expect(writeText).toHaveBeenCalledTimes(1);
    const written = writeText.mock.calls[0][0] as string;
    expect(written).toContain('bm=');
  });

  it('lists navigation locations', () => {
    render(<LeftPanel />);
    const navigation = screen.getByText('Navigation').closest('section');
    expect(navigation).toBeTruthy();
    if (!navigation) throw new Error('Missing navigation section');
    expect(within(navigation).getByText('Osiris Shaft')).toBeInTheDocument();
  });
});

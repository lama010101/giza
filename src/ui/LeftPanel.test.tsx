import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { LeftPanel } from './LeftPanel';
import { useAppStore } from '@/store/app';

describe('LeftPanel (M07-T01)', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeMonument: 'osiris',
      lod: 'LOD0',
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

  it('lists the bookmarked object by name', () => {
    render(<LeftPanel />);
    const bookmarks = screen.getByText('Bookmarks').closest('section');
    expect(bookmarks).toBeTruthy();
    if (!bookmarks) throw new Error('Missing bookmarks section');
    expect(within(bookmarks).getByText('Shaft A')).toBeInTheDocument();
  });

  it('lists navigation locations', () => {
    render(<LeftPanel />);
    const navigation = screen.getByText('Navigation').closest('section');
    expect(navigation).toBeTruthy();
    if (!navigation) throw new Error('Missing navigation section');
    expect(within(navigation).getByText('Osiris Shaft')).toBeInTheDocument();
  });
});

import { useEffect } from 'react';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import { useAppStore } from '@/store/app';
import { VirtualControls } from '@/ui/VirtualControls';
import { MuseumOverlay } from '@/ui/MuseumOverlay';
import { OsirisScene } from './OsirisScene';
import { GreatPyramidScene } from './GreatPyramidScene';

export function Viewport(): JSX.Element {
  const hoveredNodeId = useAppStore((s) => s.hoveredNodeId);
  const activeMonument = useAppStore((s) => s.activeMonument);
  const setActiveMonument = useAppStore((s) => s.setActiveMonument);

  useEffect(() => {
    // Re-apply monument defaults so camera coordinates are always in world
    // space after a coordinate-system or migration change.
    setActiveMonument(activeMonument);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hoveredName = hoveredNodeId
    ? activeMonument === 'great-pyramid'
      ? greatPyramidBlockout.nodes.find((n) => n.id === hoveredNodeId)?.name
      : osirisBlockout.nodes.find((n) => n.id === hoveredNodeId)?.name
    : undefined;

  return (
    <div className="viewport">
      {activeMonument === 'great-pyramid' ? <GreatPyramidScene /> : <OsirisScene />}
      {hoveredName && <div className="viewport-overlay">{hoveredName}</div>}
      <VirtualControls />
      <MuseumOverlay />
    </div>
  );
}

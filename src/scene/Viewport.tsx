import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import { useAppStore } from '@/store/app';
import { VirtualControls } from '@/ui/VirtualControls';
import { OsirisScene } from './OsirisScene';
import { GreatPyramidScene } from './GreatPyramidScene';

export function Viewport(): JSX.Element {
  const hoveredNodeId = useAppStore((s) => s.hoveredNodeId);
  const activeMonument = useAppStore((s) => s.activeMonument);

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
    </div>
  );
}

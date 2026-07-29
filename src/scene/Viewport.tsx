import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { useAppStore } from '@/store/app';
import { OsirisScene } from './OsirisScene';

export function Viewport(): JSX.Element {
  const hoveredNodeId = useAppStore((s) => s.hoveredNodeId);
  const hoveredName = hoveredNodeId
    ? osirisBlockout.nodes.find((n) => n.id === hoveredNodeId)?.name
    : undefined;

  return (
    <div className="viewport">
      <OsirisScene />
      {hoveredName && <div className="viewport-overlay">{hoveredName}</div>}
    </div>
  );
}

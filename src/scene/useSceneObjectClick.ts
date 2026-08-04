import type { ThreeEvent } from '@react-three/fiber';
import { useAppStore } from '@/store/app';
import { extractRaycastHit, shouldOpenEvidenceView, shouldOpenTheoryView } from './interaction';
import type { SceneNodeWithWorld } from './sceneGraph';

/**
 * Provides pointer-event handlers for a scene object.
 *
 * Clicking an object with evidence opens the Evidence panel and selects the
 * first linked evidence record. Clicking an object with an active hypothesis
 * opens the Hypothesis (theory) panel for that object. Both ids are stored so
 * the user can switch between the two tabs without losing context.
 */
export function useSceneObjectClick(node: SceneNodeWithWorld) {
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const setSelectedObjectId = useAppStore((s) => s.setSelectedObjectId);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);
  const setHoveredNodeId = useAppStore((s) => s.setHoveredNodeId);
  const measurementMode = useAppStore((s) => s.measurementMode);
  const addMeasurementPoint = useAppStore((s) => s.addMeasurementPoint);
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const hovered = useAppStore((s) => s.hoveredNodeId === node.id);

  const handleClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (measurementMode) {
      addMeasurementPoint({ x: event.point.x, y: event.point.y, z: event.point.z });
      return;
    }

    const hit = extractRaycastHit(event, node.id, node.metadata);
    const openEvidence = shouldOpenEvidenceView(hit);
    const openTheory = shouldOpenTheoryView(hit, activeHypothesisIds.length > 0);

    if (openEvidence) {
      setSelectedEvidenceId(hit.evidenceIds![0]);
    }
    if (openTheory && hit.objectId) {
      setSelectedObjectId(hit.objectId);
    }

    if (openEvidence) {
      setSidePanelTab('evidence');
      setEvidencePanelOpen(true);
    } else if (openTheory && hit.objectId) {
      setSidePanelTab('hypothesis');
      setEvidencePanelOpen(true);
    }
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    setHoveredNodeId(node.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (): void => {
    setHoveredNodeId(null);
    document.body.style.cursor = 'auto';
  };

  return { hovered, handleClick, handlePointerOver, handlePointerOut };
}

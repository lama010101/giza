import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Mesh } from 'three';
import type { Hotspot } from '@/evidence/hotspot';
import { getOverlayColor } from '@/evidence/evidenceOverlay';
import { getEvidenceById } from '@/evidence/repository';
import { useAppStore } from '@/store/app';
import { testId } from '@/utils/testId';

export interface EvidenceHotspotsProps {
  hotspots: Hotspot[];
  visible?: boolean;
}

/**
 * Renders evidence hotspots as pulsing halos in the 3D scene.
 * Per GIZA - 04 §6.16: clicking a hotspot never pauses rendering.
 * Per GIZA - 04 §6.20: halo colors follow the evidence overlay system.
 */
export function EvidenceHotspots({ hotspots, visible = true }: EvidenceHotspotsProps): JSX.Element {
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);

  const handleClick = (hotspot: Hotspot, event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    const evidenceId = hotspot.evidenceIds[0];
    if (evidenceId) {
      setSelectedEvidenceId(evidenceId);
      setSidePanelTab('evidence');
      setEvidencePanelOpen(true);
    }
  };

  if (!visible || hotspots.length === 0) {
    return <group />;
  }

  return (
    <group {...testId('evidence-hotspots')}>
      {hotspots.map((hotspot) => (
        <HotspotHalo key={hotspot.id} hotspot={hotspot} onClick={handleClick} />
      ))}
    </group>
  );
}

interface HotspotHaloProps {
  hotspot: Hotspot;
  onClick: (hotspot: Hotspot, event: ThreeEvent<MouseEvent>) => void;
}

function HotspotHalo({ hotspot, onClick }: HotspotHaloProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const innerRef = useRef<Mesh>(null);
  const hovered = useAppStore((s) => s.hoveredNodeId === hotspot.id);
  const setHoveredNodeId = useAppStore((s) => s.setHoveredNodeId);

  const evidence = useMemo(() => {
    const ev = getEvidenceById(hotspot.evidenceIds[0]);
    return ev;
  }, [hotspot.evidenceIds]);

  const color = evidence ? getOverlayColor(evidence) : '#3b82f6';

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = 1 + Math.sin(t * 2) * 0.15;
      meshRef.current.scale.setScalar(pulse);
      const mat = meshRef.current.material as { opacity: number };
      mat.opacity = 0.3 + Math.sin(t * 2) * 0.1;
    }
    if (innerRef.current && hovered) {
      innerRef.current.scale.setScalar(1.3);
    } else if (innerRef.current) {
      innerRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={[hotspot.position.x, hotspot.position.y, hotspot.position.z]}>
      {/* Outer pulsing halo */}
      <mesh
        ref={meshRef}
        onClick={(e) => onClick(hotspot, e)}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredNodeId(hotspot.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredNodeId(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[hotspot.radius, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      {/* Inner solid core */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[hotspot.radius * 0.3, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  );
}

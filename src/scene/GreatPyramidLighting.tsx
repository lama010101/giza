import { useMemo } from 'react';
import * as THREE from 'three';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import { useLightingStore } from '@/store/lighting';
import { testId } from '@/utils/testId';
import { LayeredLighting } from './LayeredLighting';

/**
 * Pyramid-specific lighting for M11-T22.
 *
 * - Bounce light in the Grand Gallery and King's Chamber to reveal corbelling
 *   and granite grain.
 * - Subterranean Chamber remains dark by default; an ambient lift is provided
 *   only in Scientific Inspection Mode.
 * - Shaft interiors are not lit by dedicated chamber lights (they rely on user
 *   inspection lights if enabled).
 */
export function GreatPyramidLighting(): JSX.Element {
  const lightMode = useLightingStore((s) => s.lightMode);
  const localEnabled = useLightingStore((s) => s.localEnabled);
  const bounceEnabled = useLightingStore((s) => s.bounceEnabled);
  const localIntensity = useLightingStore((s) => s.localIntensity);
  const bounceIntensity = useLightingStore((s) => s.bounceIntensity);

  const chamberNodes = useMemo(
    () =>
      greatPyramidBlockout.nodes.filter((n) =>
        ['subterranean', 'gallery', 'kings-complex', 'queens-complex'].includes(n.layer),
      ),
    [],
  );

  return (
    <>
      <LayeredLighting skipLocal />
      {chamberNodes.map((node) => {
        const layer = node.layer;
        const pos: [number, number, number] = [
          node.position.x,
          node.position.y + node.size.y / 2 + 1,
          node.position.z,
        ];

        // Subterranean Chamber remains dark by default; lift only in Scientific Inspection Mode.
        if (layer === 'subterranean' && lightMode !== 'Scientific Inspection') {
          return null;
        }

        const needsBounce = (layer === 'gallery' || layer === 'kings-complex') && bounceEnabled;
        const skyColor = layer === 'kings-complex' ? '#c8d0d8' : '#e8dcc8';
        const groundColor = '#3a2a1a';

        return (
          <group key={`gp-light-group-${node.id}`}>
            {localEnabled && (
              <pointLight
                position={pos}
                intensity={localIntensity}
                distance={20}
                decay={1.5}
                color="#ffe4b5"
                {...testId(`light-local-${node.id}`)}
              />
            )}
            {needsBounce && (
              <hemisphereLight
                position={pos}
                args={[new THREE.Color(skyColor), new THREE.Color(groundColor), bounceIntensity]}
                {...testId(`light-bounce-${node.id}`)}
              />
            )}
          </group>
        );
      })}
    </>
  );
}

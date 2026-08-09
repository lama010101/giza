import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/app';

const ROTATION_SENSITIVITY = 0.003;
const PAN_SENSITIVITY = 0.005;
const FOV_SENSITIVITY = 0.05;
const MIN_FOV = 20;
const MAX_FOV = 120;

interface StoredTouch {
  id: number;
  x: number;
  y: number;
}

export function TouchControls(): JSX.Element | null {
  const { camera, gl } = useThree();
  const cameraMode = useAppStore((s) => s.cameraMode);
  const fov = useAppStore((s) => s.cameraFov);
  const setCameraFov = useAppStore((s) => s.setCameraFov);
  const touchesRef = useRef<StoredTouch[]>([]);

  const readTouches = useCallback((list: TouchList): StoredTouch[] => {
    const result: StoredTouch[] = [];
    for (let i = 0; i < list.length; i++) {
      const t = list.item(i);
      if (t) result.push({ id: t.identifier, x: t.clientX, y: t.clientY });
    }
    return result;
  }, []);

  const touchDistance = useCallback((a: StoredTouch, b: StoredTouch): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  useEffect(() => {
    if (cameraMode === 'orbit' || cameraMode === 'teleport') return;
    const dom = gl.domElement;

    const handleStart = (e: TouchEvent): void => {
      e.preventDefault();
      touchesRef.current = readTouches(e.touches);
    };

    const handleMove = (e: TouchEvent): void => {
      e.preventDefault();
      const previous = touchesRef.current;
      const current = readTouches(e.touches);

      if (previous.length === 0 || current.length === 0) {
        touchesRef.current = current;
        return;
      }

      if (previous.length === 1 && current.length === 1) {
        const dx = current[0].x - previous[0].x;
        const dy = current[0].y - previous[0].y;
        camera.rotation.y -= dx * ROTATION_SENSITIVITY;
        camera.rotation.x -= dy * ROTATION_SENSITIVITY;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
      } else if (previous.length >= 2 && current.length >= 2) {
        const prevD = touchDistance(previous[0], previous[1]);
        const currD = touchDistance(current[0], current[1]);
        const delta = currD - prevD;

        if (Math.abs(delta) > 1) {
          const newFov = Math.max(MIN_FOV, Math.min(MAX_FOV, fov - delta * FOV_SENSITIVITY));
          setCameraFov(newFov);
        } else {
          const dx = (current[0].x + current[1].x - previous[0].x - previous[1].x) / 2;
          const dy = (current[0].y + current[1].y - previous[0].y - previous[1].y) / 2;
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
          camera.position.addScaledVector(right, -dx * PAN_SENSITIVITY);
          camera.position.addScaledVector(up, dy * PAN_SENSITIVITY);
        }
      }

      touchesRef.current = current;
    };

    const handleEnd = (e: TouchEvent): void => {
      e.preventDefault();
      touchesRef.current = readTouches(e.touches);
    };

    dom.addEventListener('touchstart', handleStart, { passive: false });
    dom.addEventListener('touchmove', handleMove, { passive: false });
    dom.addEventListener('touchend', handleEnd);
    return () => {
      dom.removeEventListener('touchstart', handleStart);
      dom.removeEventListener('touchmove', handleMove);
      dom.removeEventListener('touchend', handleEnd);
    };
  }, [camera, cameraMode, fov, readTouches, touchDistance, gl.domElement, setCameraFov]);

  return null;
}

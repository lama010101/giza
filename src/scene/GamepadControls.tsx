import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore, type CameraMode } from '@/store/app';
import { getActiveGamepad } from './cameraRigLogic';

const MOVE_SPEED = 5; // m/s
const LOOK_SENSITIVITY = 0.05;
const CAMERA_MODES: CameraMode[] = ['orbit', 'walk', 'fly', 'teleport'];

export function GamepadControls(): JSX.Element | null {
  const { camera } = useThree();
  const cameraMode = useAppStore((s) => s.cameraMode);
  const setCameraMode = useAppStore((s) => s.setCameraMode);

  const lastSwitchRef = useRef(false);

  useFrame((_, delta) => {
    const gamepad = getActiveGamepad();
    if (!gamepad) return;

    const lookX = gamepad.axes[2] ?? gamepad.axes[0] ?? 0;
    const lookY = gamepad.axes[3] ?? gamepad.axes[1] ?? 0;

    if (cameraMode === 'walk' || cameraMode === 'fly') {
      camera.rotation.y -= lookX * LOOK_SENSITIVITY;
      camera.rotation.x -= lookY * LOOK_SENSITIVITY;
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }

    if (cameraMode === 'walk' || cameraMode === 'fly') {
      const moveX = gamepad.axes[0] ?? 0;
      const moveY = gamepad.axes[1] ?? 0;

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      if (cameraMode === 'walk') forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      if (cameraMode === 'walk') right.y = 0;
      right.normalize();

      const move = new THREE.Vector3()
        .addScaledVector(forward, -moveY)
        .addScaledVector(right, moveX);

      if (cameraMode === 'fly') {
        const ascend = (gamepad.buttons[7]?.value ?? 0) - (gamepad.buttons[6]?.value ?? 0);
        move.y += ascend;
      }

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(MOVE_SPEED * delta);
        camera.position.add(move);
      }
    }

    const switchPressed = gamepad.buttons[0]?.pressed ?? false;
    if (switchPressed && !lastSwitchRef.current) {
      const nextMode = CAMERA_MODES[(CAMERA_MODES.indexOf(cameraMode) + 1) % CAMERA_MODES.length];
      setCameraMode(nextMode);
    }
    lastSwitchRef.current = switchPressed;
  });

  return null;
}

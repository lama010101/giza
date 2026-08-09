import { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/app';
import type { Vector3 } from '@/schemas/location';
import { applyAcceleration, applyDeceleration } from './cameraConstraints';
import {
  buildCameraObstacles,
  getMovementConstraints,
  applyCameraMovement,
  rejectSteepVelocity,
  getWorldMovementDirection,
} from './cameraRigLogic';
import { TouchControls } from './TouchControls';
import { GamepadControls } from './GamepadControls';

const KEY_MAP: Record<string, string> = {
  KeyW: 'forward',
  KeyA: 'left',
  KeyS: 'back',
  KeyD: 'right',
  Space: 'up',
  ShiftLeft: 'down',
};

function useKeyboardMovement(): Record<string, boolean> {
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const action = KEY_MAP[e.code];
      if (action) keys.current[action] = true;
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      const action = KEY_MAP[e.code];
      if (action) keys.current[action] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return keys.current;
}

function useCameraSettings(): void {
  const camera = useThree((state) => state.camera);
  const fov = useAppStore((s) => s.cameraFov);
  const near = useAppStore((s) => s.cameraNear);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    if (camera.fov !== fov || camera.near !== near) {
      camera.fov = fov;
      camera.near = near;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov, near]);
}

function WalkFlyControls({ mode }: { mode: 'walk' | 'fly' }): JSX.Element {
  const { camera } = useThree();
  const appMode = useAppStore((s) => s.mode);
  const activeMonument = useAppStore((s) => s.activeMonument);
  const lod = useAppStore((s) => s.lod);
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const keys = useKeyboardMovement();

  const velocity = useRef(new THREE.Vector3());
  const constraints = useMemo(() => getMovementConstraints(mode, appMode), [mode, appMode]);
  const obstacles = useMemo(
    () => buildCameraObstacles(activeMonument, lod, hiddenLayers),
    [activeMonument, lod, hiddenLayers],
  );

  useFrame((_, delta) => {
    const input = {
      forward: (keys.forward ? 1 : 0) - (keys.back ? 1 : 0),
      right: (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
      up: (keys.up ? 1 : 0) - (keys.down ? 1 : 0),
    };

    const targetDir = getWorldMovementDirection(input, camera.quaternion, mode);
    if (targetDir.lengthSq() > 0) {
      velocity.current = applyAcceleration(velocity.current, targetDir, constraints, delta);
    } else {
      velocity.current = applyDeceleration(velocity.current, constraints, delta);
    }

    const result = applyCameraMovement(
      camera.position,
      velocity.current,
      delta,
      constraints.collisionRadius,
      obstacles,
      constraints,
      mode,
    );

    camera.position.copy(result.position);
    velocity.current = rejectSteepVelocity(result.velocity, result.collisions, constraints);
  });

  return <PointerLockControls makeDefault />;
}

function TeleportControls(): JSX.Element {
  const { camera, gl } = useThree();
  const setCameraMode = useAppStore((s) => s.setCameraMode);
  const cameraTarget = useAppStore((s) => s.cameraTarget);

  useEffect(() => {
    const handleDoubleClick = (event: MouseEvent): void => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const target: Vector3 = {
        x: camera.position.x + raycaster.ray.direction.x * 8,
        y: camera.position.y + raycaster.ray.direction.y * 8,
        z: camera.position.z + raycaster.ray.direction.z * 8,
      };

      camera.position.set(target.x, target.y, target.z);
      setCameraMode('orbit');
    };

    const dom = gl.domElement;
    dom.addEventListener('dblclick', handleDoubleClick);
    return () => {
      dom.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [camera, gl, setCameraMode]);

  return <OrbitControls makeDefault target={[cameraTarget.x, cameraTarget.y, cameraTarget.z]} />;
}

export function CameraRig(): JSX.Element {
  const cameraMode = useAppStore((s) => s.cameraMode);
  const cameraTarget = useAppStore((s) => s.cameraTarget);
  useCameraSettings();

  return (
    <>
      {cameraMode === 'walk' && <WalkFlyControls mode="walk" />}
      {cameraMode === 'fly' && <WalkFlyControls mode="fly" />}
      {cameraMode === 'teleport' && <TeleportControls />}
      {cameraMode === 'orbit' && (
        <OrbitControls makeDefault target={[cameraTarget.x, cameraTarget.y, cameraTarget.z]} />
      )}
      <TouchControls />
      <GamepadControls />
    </>
  );
}

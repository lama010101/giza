import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/app';
import type { Vector3 } from '@/schemas/location';

const WALK_SPEED = 5;
const FLY_SPEED = 12;
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

function WalkControls(): JSX.Element {
  const { camera } = useThree();
  const keys = useKeyboardMovement();
  const direction = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const speed = WALK_SPEED * delta;
    direction.current.set(0, 0, 0);

    if (keys.forward) direction.current.z -= 1;
    if (keys.back) direction.current.z += 1;
    if (keys.left) direction.current.x -= 1;
    if (keys.right) direction.current.x += 1;

    direction.current.normalize().multiplyScalar(speed);
    camera.getWorldDirection(velocity.current);
    velocity.current.y = 0;
    velocity.current.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(velocity.current, camera.up).normalize();

    velocity.current.multiplyScalar(direction.current.z);
    right.multiplyScalar(direction.current.x);

    camera.position.add(velocity.current);
    camera.position.add(right);
    camera.position.y = Math.max(camera.position.y, -30.65);
  });

  return <PointerLockControls makeDefault />;
}

function FlyControls(): JSX.Element {
  const { camera } = useThree();
  const keys = useKeyboardMovement();
  const direction = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const speed = FLY_SPEED * delta;
    direction.current.set(0, 0, 0);

    if (keys.forward) direction.current.z -= 1;
    if (keys.back) direction.current.z += 1;
    if (keys.left) direction.current.x -= 1;
    if (keys.right) direction.current.x += 1;
    if (keys.up) direction.current.y += 1;
    if (keys.down) direction.current.y -= 1;

    direction.current.normalize().multiplyScalar(speed);
    camera.getWorldDirection(velocity.current);
    velocity.current.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(velocity.current, camera.up).normalize();

    velocity.current.multiplyScalar(direction.current.z);
    right.multiplyScalar(direction.current.x);

    camera.position.add(velocity.current);
    camera.position.add(right);
    camera.position.y += direction.current.y;
  });

  return <PointerLockControls makeDefault />;
}

function TeleportControls(): JSX.Element {
  const { camera, gl } = useThree();
  const setCameraMode = useAppStore((s) => s.setCameraMode);

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

  return <OrbitControls makeDefault target={[0, -15, 2]} />;
}

export function CameraRig(): JSX.Element {
  const cameraMode = useAppStore((s) => s.cameraMode);

  if (cameraMode === 'walk') return <WalkControls />;
  if (cameraMode === 'fly') return <FlyControls />;
  if (cameraMode === 'teleport') return <TeleportControls />;

  return <OrbitControls makeDefault target={[0, -15, 2]} />;
}

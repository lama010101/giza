import { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/app';
import type { Vector3 } from '@/schemas/location';
import {
  DEFAULT_CONSTRAINTS,
  RESEARCH_CONSTRAINTS,
  FLY_CONSTRAINTS,
  applyAcceleration,
  applyDeceleration,
  clampCameraPosition,
  isSlopeAllowed,
  slopeFromNormal,
  applyCameraSettings,
  type CameraConstraints,
} from './cameraConstraints';
import {
  DEFAULT_GAMEPAD_STATE,
  readGamepadState,
  applyGamepadLook,
  combinedMovementInput,
} from './gamepad';
import { TOUCH_STATE, useTouchLook } from './touchControls';

const KEY_MAP: Record<string, string> = {
  KeyW: 'forward',
  KeyA: 'left',
  KeyS: 'back',
  KeyD: 'right',
  Space: 'up',
  ShiftLeft: 'down',
};

function getConstraints(mode: string, cameraMode: string): CameraConstraints {
  if (cameraMode === 'fly') return FLY_CONSTRAINTS;
  if (mode === 'Research') return RESEARCH_CONSTRAINTS;
  return DEFAULT_CONSTRAINTS;
}

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

function inputDirection(keys: Record<string, boolean>, isFlying: boolean): THREE.Vector3 {
  const direction = new THREE.Vector3();
  if (keys.forward) direction.z -= 1;
  if (keys.back) direction.z += 1;
  if (keys.left) direction.x -= 1;
  if (keys.right) direction.x += 1;
  if (isFlying && keys.up) direction.y += 1;
  if (isFlying && keys.down) direction.y -= 1;
  return direction;
}

function worldDirectionFromCamera(
  camera: THREE.Camera,
  local: THREE.Vector3,
  isFlying: boolean,
): THREE.Vector3 {
  const m = camera.matrixWorld.elements;
  const forward = new THREE.Vector3(-m[8], -m[9], -m[10]).normalize();
  const right = new THREE.Vector3(m[0], m[1], m[2]).normalize();

  const world = new THREE.Vector3()
    .addScaledVector(forward, -local.z)
    .addScaledVector(right, local.x);

  if (isFlying) {
    const up = new THREE.Vector3(m[4], m[5], m[6]).normalize();
    world.addScaledVector(up, local.y);
  } else {
    world.y = 0;
  }

  // Preserve analog input magnitude (e.g., virtual joystick depth) while
  // capping the maximum movement speed to 1.
  if (world.lengthSq() > 0) world.clampLength(0, 1);
  return world;
}

function WalkControls(): JSX.Element {
  const { camera, scene } = useThree();
  const keys = useKeyboardMovement();
  const velocity = useRef(new THREE.Vector3());
  const constraints = useRef(DEFAULT_CONSTRAINTS);
  const appMode = useAppStore((s) => s.mode);
  const cameraMode = useAppStore((s) => s.cameraMode);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  const gamepad = useRef(DEFAULT_GAMEPAD_STATE);

  useEffect(() => {
    constraints.current = getConstraints(appMode, cameraMode);
    applyCameraSettings(camera as THREE.PerspectiveCamera, constraints.current);
  }, [appMode, cameraMode, camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    gamepad.current = readGamepadState(false);

    const touchLookX = TOUCH_STATE.lookX;
    const touchLookY = TOUCH_STATE.lookY;
    TOUCH_STATE.lookX = 0;
    TOUCH_STATE.lookY = 0;
    applyGamepadLook(
      camera,
      {
        lookX: gamepad.current.lookX + touchLookX,
        lookY: gamepad.current.lookY + touchLookY,
      },
      dt,
    );

    const input = combinedMovementInput(keys, gamepad.current, false, TOUCH_STATE);
    const local = inputDirection(input, false);
    if (TOUCH_STATE.moveActive) {
      local.x += TOUCH_STATE.moveX;
      local.z += TOUCH_STATE.moveY;
      local.clampLength(0, 1);
    }
    const moving = local.lengthSq() > 0;
    const target = worldDirectionFromCamera(camera, local, false);

    if (moving) {
      velocity.current = applyAcceleration(velocity.current, target, constraints.current, dt);
    } else {
      velocity.current = applyDeceleration(velocity.current, constraints.current, dt);
    }

    if (velocity.current.lengthSq() === 0) return;

    const step = velocity.current.clone().multiplyScalar(dt);
    const nextPosition = camera.position.clone().add(step);

    // Height / ground clamping with slope check.
    raycaster.set(nextPosition.clone().add(new THREE.Vector3(0, 2, 0)), down);
    raycaster.far = 100;
    const groundHits = raycaster.intersectObjects(scene.children, true);
    const ground = groundHits.find((h) => h.face?.normal);

    if (ground) {
      const normal = ground
        .face!.normal.clone()
        .transformDirection(ground.object.matrixWorld)
        .normalize();
      const slope = slopeFromNormal(normal);
      if (isSlopeAllowed(slope, constraints.current)) {
        nextPosition.y = Math.max(
          nextPosition.y,
          ground.point.y + constraints.current.collisionRadius,
        );
      } else {
        // Prevent moving up steep slopes by removing the vertical component.
        step.y = Math.min(step.y, 0);
        nextPosition.copy(camera.position).add(step);
      }
    }

    // Simple wall collision: ray from current position toward next position.
    const moveDir = nextPosition.clone().sub(camera.position);
    if (moveDir.lengthSq() > 0) {
      raycaster.set(camera.position, moveDir.clone().normalize());
      raycaster.far = moveDir.length() + constraints.current.collisionRadius;
      const hits = raycaster.intersectObjects(scene.children, true);
      const hit = hits.find((h) => h.distance <= moveDir.length());
      if (hit?.face) {
        const safeDistance = Math.max(0, hit.distance - constraints.current.collisionRadius);
        moveDir.normalize().multiplyScalar(safeDistance);
        nextPosition.copy(camera.position).add(moveDir);
      }
    }

    nextPosition.copy(clampCameraPosition(nextPosition, constraints.current));
    camera.position.copy(nextPosition);
  });

  return <PointerLockControls makeDefault />;
}

function FlyControls(): JSX.Element {
  const { camera } = useThree();
  const keys = useKeyboardMovement();
  const velocity = useRef(new THREE.Vector3());
  const constraints = useRef(FLY_CONSTRAINTS);
  const appMode = useAppStore((s) => s.mode);
  const cameraMode = useAppStore((s) => s.cameraMode);
  const gamepad = useRef(DEFAULT_GAMEPAD_STATE);

  useEffect(() => {
    constraints.current = getConstraints(appMode, cameraMode);
    applyCameraSettings(camera as THREE.PerspectiveCamera, constraints.current);
  }, [appMode, cameraMode, camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    gamepad.current = readGamepadState(true);

    const touchLookX = TOUCH_STATE.lookX;
    const touchLookY = TOUCH_STATE.lookY;
    TOUCH_STATE.lookX = 0;
    TOUCH_STATE.lookY = 0;
    applyGamepadLook(
      camera,
      {
        lookX: gamepad.current.lookX + touchLookX,
        lookY: gamepad.current.lookY + touchLookY,
      },
      dt,
    );

    const input = combinedMovementInput(keys, gamepad.current, true, TOUCH_STATE);
    const local = inputDirection(input, true);
    if (TOUCH_STATE.moveActive) {
      local.x += TOUCH_STATE.moveX;
      local.z += TOUCH_STATE.moveY;
      local.clampLength(0, 1);
    }
    const moving = local.lengthSq() > 0;
    const target = worldDirectionFromCamera(camera, local, true);

    if (moving) {
      velocity.current = applyAcceleration(velocity.current, target, constraints.current, dt);
    } else {
      velocity.current = applyDeceleration(velocity.current, constraints.current, dt);
    }

    if (velocity.current.lengthSq() === 0) return;

    const step = velocity.current.clone().multiplyScalar(dt);
    const nextPosition = camera.position.clone().add(step);
    camera.position.copy(clampCameraPosition(nextPosition, constraints.current));
  });

  return <PointerLockControls makeDefault />;
}

function TeleportControls(): JSX.Element {
  const { camera, gl } = useThree();
  const setCameraMode = useAppStore((s) => s.setCameraMode);
  const cameraTarget = useAppStore((s) => s.cameraTarget);

  useEffect(() => {
    applyCameraSettings(camera as THREE.PerspectiveCamera, DEFAULT_CONSTRAINTS);
  }, [camera]);

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

function CameraPositionSync(): null {
  const { camera } = useThree();
  const cameraPosition = useAppStore((s) => s.cameraPosition);
  const setCameraPosition = useAppStore((s) => s.setCameraPosition);

  useEffect(() => {
    if (typeof camera.position.set === 'function') {
      camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    } else {
      camera.position.x = cameraPosition.x;
      camera.position.y = cameraPosition.y;
      camera.position.z = cameraPosition.z;
    }
  }, [camera, cameraPosition]);

  useFrame(() => {
    const { x, y, z } = camera.position;
    const dx = x - cameraPosition.x;
    const dy = y - cameraPosition.y;
    const dz = z - cameraPosition.z;
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) > 0.001) {
      setCameraPosition({ x, y, z });
    }
  });

  return null;
}

export function CameraRig(): JSX.Element {
  const cameraMode = useAppStore((s) => s.cameraMode);
  const cameraTarget = useAppStore((s) => s.cameraTarget);
  const { gl } = useThree();

  useTouchLook(cameraMode, gl.domElement);

  return (
    <>
      <CameraPositionSync />
      {cameraMode === 'walk' && <WalkControls />}
      {cameraMode === 'fly' && <FlyControls />}
      {cameraMode === 'teleport' && <TeleportControls />}
      {cameraMode === 'orbit' && (
        <OrbitControls makeDefault target={[cameraTarget.x, cameraTarget.y, cameraTarget.z]} />
      )}
    </>
  );
}

import { useEffect, useRef } from 'react';

/**
 * Shared mutable state for on-screen virtual touch controls.
 *
 * The UI overlay and the camera render loop both read/write this state. It is a
 * module-level singleton because input events fire outside the React render cycle
 * and must be consumed by `useFrame` without re-rendering the UI.
 */

export interface TouchInputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  /** Normalised X axis of the movement joystick (-1 left to 1 right). */
  moveX: number;
  /** Normalised Y axis of the movement joystick (-1 forward to 1 back). */
  moveY: number;
  /** Accumulated yaw input from a right-half drag, consumed each frame. */
  lookX: number;
  /** Accumulated pitch input from a right-half drag, consumed each frame. */
  lookY: number;
  /** Whether the look pointer is currently active. */
  lookActive: boolean;
  /** Whether the movement joystick is currently active. */
  moveActive: boolean;
}

export const DEFAULT_TOUCH_INPUT: TouchInputState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  up: false,
  down: false,
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  lookActive: false,
  moveActive: false,
};

export const TOUCH_STATE: TouchInputState = { ...DEFAULT_TOUCH_INPUT };

const DEADZONE = 0.15;
const LOOK_SENSITIVITY = 0.005;

export function resetTouchState(): void {
  Object.assign(TOUCH_STATE, DEFAULT_TOUCH_INPUT);
}

export function setTouchMove(x: number, y: number, active: boolean): void {
  TOUCH_STATE.moveX = active ? x : 0;
  TOUCH_STATE.moveY = active ? y : 0;
  TOUCH_STATE.moveActive = active;
  TOUCH_STATE.forward = active && y < -DEADZONE;
  TOUCH_STATE.back = active && y > DEADZONE;
  TOUCH_STATE.left = active && x < -DEADZONE;
  TOUCH_STATE.right = active && x > DEADZONE;
}

export function setTouchLookDelta(dx: number, dy: number): void {
  TOUCH_STATE.lookX += dx * LOOK_SENSITIVITY;
  TOUCH_STATE.lookY += dy * LOOK_SENSITIVITY;
  TOUCH_STATE.lookActive = true;
}

export function clearTouchLook(): void {
  TOUCH_STATE.lookX = 0;
  TOUCH_STATE.lookY = 0;
  TOUCH_STATE.lookActive = false;
}

/**
 * Attaches right-half drag-to-look pointer handlers to the 3D canvas.
 *
 * Only active in walk/fly camera modes and only for `pointerType === 'touch'`
 * so desktop mouse interactions continue to use pointer-lock and orbit controls.
 */
export function useTouchLook(
  cameraMode: 'walk' | 'fly' | 'orbit' | 'teleport',
  domElement: HTMLElement,
): void {
  const activePointer = useRef<number | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (cameraMode !== 'walk' && cameraMode !== 'fly') {
      clearTouchLook();
      return;
    }

    function isRightHalf(event: PointerEvent): boolean {
      const rect = domElement.getBoundingClientRect();
      return event.clientX > rect.left + rect.width / 2;
    }

    const onPointerDown = (event: PointerEvent): void => {
      if (event.pointerType !== 'touch' || !isRightHalf(event)) return;
      activePointer.current = event.pointerId;
      lastPos.current = { x: event.clientX, y: event.clientY };
      try {
        domElement.setPointerCapture(event.pointerId);
      } catch {
        // setPointerCapture can fail on some touch targets; ignore.
      }
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (activePointer.current !== event.pointerId || !lastPos.current) return;
      const dx = event.clientX - lastPos.current.x;
      const dy = event.clientY - lastPos.current.y;
      lastPos.current = { x: event.clientX, y: event.clientY };
      setTouchLookDelta(dx, dy);
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (activePointer.current !== event.pointerId) return;
      activePointer.current = null;
      lastPos.current = null;
      clearTouchLook();
      try {
        domElement.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore release errors.
      }
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointercancel', onPointerUp);

    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointercancel', onPointerUp);
      clearTouchLook();
    };
  }, [cameraMode, domElement]);
}

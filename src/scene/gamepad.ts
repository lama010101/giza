import type { TouchInputState } from './touchControls';

const DEADZONE = 0.15;
const LOOK_SENSITIVITY = 2.5;

export interface GamepadState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  lookX: number;
  lookY: number;
}

export const DEFAULT_GAMEPAD_STATE: GamepadState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  up: false,
  down: false,
  lookX: 0,
  lookY: 0,
};

function axisValue(value: number): number {
  return Math.abs(value) > DEADZONE ? value : 0;
}

function buttonPressed(gamepad: Gamepad, index: number): boolean {
  const button = gamepad.buttons[index];
  return button ? (typeof button === 'object' ? button.pressed : Boolean(button)) : false;
}

/**
 * Reads the first connected gamepad and returns a normalized movement/look state.
 *
 * Left stick controls forward/back/left/right movement. Right stick X controls
 * yaw and right stick Y controls pitch. In fly mode the right stick Y is reused
 * for vertical movement, so look pitch is not available while flying.
 */
export function readGamepadState(isFlying: boolean): GamepadState {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gamepad = pads[0];
  if (!gamepad) return DEFAULT_GAMEPAD_STATE;

  const forward = axisValue(gamepad.axes[1]) < 0;
  const back = axisValue(gamepad.axes[1]) > 0;
  const left = axisValue(gamepad.axes[0]) < 0;
  const right = axisValue(gamepad.axes[0]) > 0;

  const lookX = axisValue(gamepad.axes[2]);
  const lookY = isFlying ? 0 : axisValue(gamepad.axes[3]);

  // D-pad up/down (buttons 12/13) for vertical movement in fly mode.
  const up = isFlying ? buttonPressed(gamepad, 12) : false;
  const down = isFlying ? buttonPressed(gamepad, 13) : false;

  return {
    forward,
    back,
    left,
    right,
    up: up || (isFlying && axisValue(gamepad.axes[3]) < 0),
    down: down || (isFlying && axisValue(gamepad.axes[3]) > 0),
    lookX,
    lookY,
  };
}

interface LookInput {
  lookX: number;
  lookY: number;
}

/**
 * Applies yaw and pitch to a camera using the look axes.
 *
 * Accepts any object with `lookX` and `lookY`, so gamepad, touch, or merged
 * input can be passed without constructing a full GamepadState.
 */
export function applyGamepadLook(
  camera: { rotation: { x: number; y: number } },
  state: LookInput,
  dt: number,
): void {
  if (state.lookX === 0 && state.lookY === 0) return;

  camera.rotation.y -= state.lookX * LOOK_SENSITIVITY * dt;
  camera.rotation.x -= state.lookY * LOOK_SENSITIVITY * dt;

  // Keep pitch within a safe range to prevent flipping.
  const maxPitch = Math.PI / 2 - 0.1;
  camera.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, camera.rotation.x));
}

/**
 * Merges keyboard, gamepad, and virtual touch movement inputs.
 */
export function combinedMovementInput(
  keys: Record<string, boolean>,
  gamepad: GamepadState,
  isFlying: boolean,
  touch?: TouchInputState,
): Record<string, boolean> {
  return {
    forward: keys.forward || gamepad.forward || !!touch?.forward,
    back: keys.back || gamepad.back || !!touch?.back,
    left: keys.left || gamepad.left || !!touch?.left,
    right: keys.right || gamepad.right || !!touch?.right,
    up: (isFlying && (keys.up || gamepad.up || !!touch?.up)) || false,
    down: (isFlying && (keys.down || gamepad.down || !!touch?.down)) || false,
  };
}

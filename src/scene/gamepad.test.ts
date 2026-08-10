import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  readGamepadState,
  applyGamepadLook,
  combinedMovementInput,
  DEFAULT_GAMEPAD_STATE,
} from './gamepad';

describe('readGamepadState', () => {
  let originalGetGamepads: typeof navigator.getGamepads | undefined;

  beforeEach(() => {
    originalGetGamepads = navigator.getGamepads?.bind(navigator);
  });

  afterEach(() => {
    if (originalGetGamepads) {
      Object.defineProperty(navigator, 'getGamepads', {
        value: originalGetGamepads,
        configurable: true,
      });
    }
  });

  function setGamepads(gamepads: (Gamepad | null)[]): void {
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => gamepads,
      configurable: true,
    });
  }

  it('returns default state when no gamepad is connected', () => {
    setGamepads([]);
    expect(readGamepadState(false)).toEqual(DEFAULT_GAMEPAD_STATE);
  });

  it('maps left stick to forward/back/left/right', () => {
    setGamepads([
      {
        axes: [-0.9, 0.9, 0, 0],
        buttons: [],
      } as unknown as Gamepad,
    ]);
    const state = readGamepadState(false);
    expect(state.left).toBe(true);
    expect(state.back).toBe(true);
    expect(state.forward).toBe(false);
    expect(state.right).toBe(false);
  });

  it('ignores axes inside the deadzone', () => {
    setGamepads([
      {
        axes: [0.05, -0.05, 0, 0],
        buttons: [],
      } as unknown as Gamepad,
    ]);
    const state = readGamepadState(false);
    expect(state.left).toBe(false);
    expect(state.right).toBe(false);
    expect(state.forward).toBe(false);
    expect(state.back).toBe(false);
  });

  it('maps right stick to look in non-fly mode', () => {
    setGamepads([
      {
        axes: [0, 0, -0.5, 0.5],
        buttons: [],
      } as unknown as Gamepad,
    ]);
    const state = readGamepadState(false);
    expect(state.lookX).toBeCloseTo(-0.5);
    expect(state.lookY).toBeCloseTo(0.5);
    expect(state.up).toBe(false);
    expect(state.down).toBe(false);
  });

  it('maps right stick Y and D-pad to up/down in fly mode', () => {
    setGamepads([
      {
        axes: [0, 0, 0, -0.6],
        buttons: [
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: false },
          { pressed: true },
          { pressed: true },
        ] as unknown as GamepadButton[],
      } as unknown as Gamepad,
    ]);
    const state = readGamepadState(true);
    expect(state.up).toBe(true);
    expect(state.down).toBe(true);
    expect(state.lookY).toBe(0);
  });
});

describe('applyGamepadLook', () => {
  it('applies yaw and pitch', () => {
    const camera = { rotation: { x: 0, y: 0 } };
    applyGamepadLook(camera, { ...DEFAULT_GAMEPAD_STATE, lookX: 0.5, lookY: 0.3 }, 0.1);
    expect(camera.rotation.y).toBeCloseTo(-0.125);
    expect(camera.rotation.x).toBeCloseTo(-0.075);
  });

  it('clamps pitch to avoid flipping', () => {
    const camera = { rotation: { x: 0, y: 0 } };
    applyGamepadLook(camera, { ...DEFAULT_GAMEPAD_STATE, lookY: 100 }, 0.1);
    expect(camera.rotation.x).toBeLessThan(Math.PI / 2);
    expect(camera.rotation.x).toBeGreaterThan(-Math.PI / 2);
  });
});

describe('combinedMovementInput', () => {
  it('merges keyboard and gamepad inputs', () => {
    const keys = { forward: true, back: false, left: false, right: true, up: false, down: false };
    const gamepad = { ...DEFAULT_GAMEPAD_STATE, left: true, up: true };
    const merged = combinedMovementInput(keys, gamepad, true);
    expect(merged).toEqual({
      forward: true,
      back: false,
      left: true,
      right: true,
      up: true,
      down: false,
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TOUCH_STATE,
  resetTouchState,
  setTouchMove,
  setTouchLookDelta,
  clearTouchLook,
  DEFAULT_TOUCH_INPUT,
} from './touchControls';
import { combinedMovementInput, DEFAULT_GAMEPAD_STATE } from './gamepad';

describe('touchControls', () => {
  beforeEach(() => {
    resetTouchState();
  });

  it('starts from the default state', () => {
    expect(TOUCH_STATE).toEqual(DEFAULT_TOUCH_INPUT);
  });

  it('maps joystick movement to directional booleans using a deadzone', () => {
    setTouchMove(0, -0.5, true);
    expect(TOUCH_STATE.forward).toBe(true);
    expect(TOUCH_STATE.back).toBe(false);
    expect(TOUCH_STATE.left).toBe(false);
    expect(TOUCH_STATE.right).toBe(false);
    expect(TOUCH_STATE.moveX).toBe(0);
    expect(TOUCH_STATE.moveY).toBe(-0.5);

    setTouchMove(-0.5, 0.5, true);
    expect(TOUCH_STATE.left).toBe(true);
    expect(TOUCH_STATE.back).toBe(true);
    expect(TOUCH_STATE.forward).toBe(false);
  });

  it('ignores small movements inside the deadzone', () => {
    setTouchMove(0.05, -0.05, true);
    expect(TOUCH_STATE.forward).toBe(false);
    expect(TOUCH_STATE.back).toBe(false);
    expect(TOUCH_STATE.left).toBe(false);
    expect(TOUCH_STATE.right).toBe(false);
  });

  it('resets movement state when inactive', () => {
    setTouchMove(0.5, 0.5, true);
    setTouchMove(0, 0, false);
    expect(TOUCH_STATE.forward).toBe(false);
    expect(TOUCH_STATE.back).toBe(false);
    expect(TOUCH_STATE.left).toBe(false);
    expect(TOUCH_STATE.right).toBe(false);
    expect(TOUCH_STATE.moveActive).toBe(false);
    expect(TOUCH_STATE.moveX).toBe(0);
    expect(TOUCH_STATE.moveY).toBe(0);
  });

  it('accumulates and clears look deltas', () => {
    setTouchLookDelta(100, 50);
    setTouchLookDelta(-20, 10);
    expect(TOUCH_STATE.lookX).toBeCloseTo(0.4); // (100 - 20) * 0.005
    expect(TOUCH_STATE.lookY).toBeCloseTo(0.3); // (50 + 10) * 0.005
    expect(TOUCH_STATE.lookActive).toBe(true);

    clearTouchLook();
    expect(TOUCH_STATE.lookX).toBe(0);
    expect(TOUCH_STATE.lookY).toBe(0);
    expect(TOUCH_STATE.lookActive).toBe(false);
  });

  it('merges touch movement with keyboard and gamepad input', () => {
    const keys = { forward: true, back: false, left: false, right: false, up: false, down: false };
    const gamepad = { ...DEFAULT_GAMEPAD_STATE, right: true };
    setTouchMove(0, 0.8, true);

    const merged = combinedMovementInput(keys, gamepad, false, TOUCH_STATE);
    expect(merged.forward).toBe(true);
    expect(merged.back).toBe(true);
    expect(merged.right).toBe(true);
    expect(merged.left).toBe(false);
  });
});

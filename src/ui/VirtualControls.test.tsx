import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '@/store/app';
import { resetTouchState, TOUCH_STATE } from '@/scene/touchControls';
import { VirtualControls } from './VirtualControls';

describe('VirtualControls', () => {
  beforeEach(() => {
    resetTouchState();
    useAppStore.setState({ cameraMode: 'walk' });
  });

  it('does not render in orbit mode', () => {
    useAppStore.setState({ cameraMode: 'orbit' });
    const { container } = render(<VirtualControls />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a movement joystick in walk mode', () => {
    render(<VirtualControls />);
    expect(screen.getByRole('slider', { name: /move/i })).toBeInTheDocument();
  });

  it('updates touch state when the joystick is dragged', () => {
    render(<VirtualControls />);
    const joystick = screen.getByRole('slider', { name: /move/i });

    fireEvent.pointerDown(joystick, {
      pointerId: 1,
      clientX: 50,
      clientY: 50,
      pointerType: 'touch',
    });

    expect(TOUCH_STATE.moveActive).toBe(true);
    fireEvent.pointerUp(joystick, { pointerId: 1, pointerType: 'touch' });
    expect(TOUCH_STATE.moveActive).toBe(false);
  });

  it('shows vertical controls in fly mode and sets up/down flags', () => {
    useAppStore.setState({ cameraMode: 'fly' });
    render(<VirtualControls />);

    const upButton = screen.getByRole('button', { name: /fly up/i });
    const downButton = screen.getByRole('button', { name: /fly down/i });

    fireEvent.pointerDown(upButton);
    expect(TOUCH_STATE.up).toBe(true);
    fireEvent.pointerUp(upButton);
    expect(TOUCH_STATE.up).toBe(false);

    fireEvent.pointerDown(downButton);
    expect(TOUCH_STATE.down).toBe(true);
    fireEvent.pointerUp(downButton);
    expect(TOUCH_STATE.down).toBe(false);
  });
});

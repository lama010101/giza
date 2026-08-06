import { useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app';
import { setTouchMove, TOUCH_STATE } from '@/scene/touchControls';

const JOYSTICK_SIZE = 96;
const KNOB_SIZE = 40;
const MAX_OFFSET = JOYSTICK_SIZE / 2 - KNOB_SIZE / 2;

function Joystick(): JSX.Element {
  const baseRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = useCallback((clientX: number, clientY: number): void => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > MAX_OFFSET) {
      dx = (dx / distance) * MAX_OFFSET;
      dy = (dy / distance) * MAX_OFFSET;
    }
    setKnob({ x: dx, y: dy });
    const normX = dx / MAX_OFFSET;
    const normY = dy / MAX_OFFSET;
    setTouchMove(normX, normY, true);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    const el = baseRef.current;
    if (el) {
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    setActive(true);
    update(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!active) return;
    event.preventDefault();
    event.stopPropagation();
    update(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    const el = baseRef.current;
    if (el) {
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    setActive(false);
    setKnob({ x: 0, y: 0 });
    setTouchMove(0, 0, false);
  };

  return (
    <div
      ref={baseRef}
      className="virtual-joystick-base"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="slider"
      aria-label="Move"
      aria-valuenow={Number((knob.x / MAX_OFFSET).toFixed(2))}
      aria-valuemin={-1}
      aria-valuemax={1}
    >
      <div
        className="virtual-joystick-knob"
        style={{
          transform: `translate(${knob.x}px, ${knob.y}px)`,
        }}
      />
    </div>
  );
}

function VerticalButton({ direction }: { direction: 'up' | 'down' }): JSX.Element {
  const isUp = direction === 'up';

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (isUp) {
      TOUCH_STATE.up = true;
    } else {
      TOUCH_STATE.down = true;
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (isUp) {
      TOUCH_STATE.up = false;
    } else {
      TOUCH_STATE.down = false;
    }
  };

  return (
    <button
      type="button"
      className="virtual-button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      aria-label={isUp ? 'Fly up' : 'Fly down'}
    >
      {isUp ? '▲' : '▼'}
    </button>
  );
}

export function VirtualControls(): JSX.Element | null {
  const cameraMode = useAppStore((s) => s.cameraMode);

  if (cameraMode !== 'walk' && cameraMode !== 'fly') {
    return null;
  }

  return (
    <div className="virtual-controls" aria-label="On-screen touch controls">
      <Joystick />
      {cameraMode === 'fly' && (
        <div className="virtual-vertical-controls">
          <VerticalButton direction="up" />
          <VerticalButton direction="down" />
        </div>
      )}
    </div>
  );
}

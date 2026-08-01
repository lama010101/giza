import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationPlaybackController } from './playbackControls';

describe('Simulation Playback Controls (M10-T07)', () => {
  let controller: SimulationPlaybackController;

  beforeEach(() => {
    controller = new SimulationPlaybackController({ duration: 100, initialSpeed: 1 });
  });

  describe('initial state', () => {
    it('starts idle', () => {
      expect(controller.getControls().state).toBe('idle');
      expect(controller.getControls().currentTime).toBe(0);
    });
  });

  describe('play/pause/resume', () => {
    it('transitions to playing', () => {
      controller.play();
      expect(controller.isPlaying).toBe(true);
    });

    it('pauses', () => {
      controller.play();
      controller.pause();
      expect(controller.isPaused).toBe(true);
    });

    it('resumes from paused', () => {
      controller.play();
      controller.pause();
      controller.resume();
      expect(controller.isPlaying).toBe(true);
    });
  });

  describe('stepForward', () => {
    it('steps forward by default step', () => {
      controller.stepForward();
      expect(controller.getControls().currentTime).toBe(1);
      expect(controller.isPaused).toBe(true);
    });

    it('steps forward by N steps', () => {
      controller.stepForward(5);
      expect(controller.getControls().currentTime).toBe(5);
    });

    it('clamps to duration', () => {
      controller.stepForward(200);
      expect(controller.getControls().currentTime).toBe(100);
      expect(controller.getControls().state).toBe('finished');
    });
  });

  describe('stepBackward', () => {
    it('steps backward', () => {
      controller.stepForward(10);
      controller.stepBackward(3);
      expect(controller.getControls().currentTime).toBe(7);
    });

    it('clamps to 0', () => {
      controller.stepForward(5);
      controller.stepBackward(10);
      expect(controller.getControls().currentTime).toBe(0);
    });
  });

  describe('seek', () => {
    it('seeks to a specific time', () => {
      controller.seek(50);
      expect(controller.getControls().currentTime).toBe(50);
    });

    it('clamps to valid range', () => {
      controller.seek(-10);
      expect(controller.getControls().currentTime).toBe(0);
      controller.seek(200);
      expect(controller.getControls().currentTime).toBe(100);
    });
  });

  describe('setSpeed', () => {
    it('sets the speed', () => {
      controller.setSpeed(2);
      expect(controller.getControls().speed).toBe(2);
    });

    it('clamps to valid range', () => {
      controller.setSpeed(0);
      expect(controller.getControls().speed).toBe(0.1);
      controller.setSpeed(100);
      expect(controller.getControls().speed).toBe(10);
    });
  });

  describe('tick', () => {
    it('advances time when playing', () => {
      controller.play();
      controller.tick(1);
      expect(controller.getControls().currentTime).toBe(1);
    });

    it('does not advance when paused', () => {
      controller.pause();
      controller.tick(1);
      expect(controller.getControls().currentTime).toBe(0);
    });

    it('respects speed multiplier', () => {
      controller.setSpeed(2);
      controller.play();
      controller.tick(1);
      expect(controller.getControls().currentTime).toBe(2);
    });

    it('loops when loop is enabled', () => {
      controller.setLoop(true);
      controller.play();
      controller.tick(100);
      expect(controller.getControls().currentTime).toBe(0);
      expect(controller.isPlaying).toBe(true);
    });

    it('finishes without loop', () => {
      controller.play();
      controller.tick(100);
      expect(controller.getControls().state).toBe('finished');
    });
  });

  describe('subscribe', () => {
    it('notifies on state change', () => {
      let lastState = '';
      controller.subscribe((c) => (lastState = c.state));
      controller.play();
      expect(lastState).toBe('playing');
    });
  });

  describe('cycleSpeed', () => {
    it('cycles through speed presets', () => {
      expect(controller.getControls().speed).toBe(1);
      controller.cycleSpeed();
      expect(controller.getControls().speed).toBe(2);
      controller.cycleSpeed();
      expect(controller.getControls().speed).toBe(4);
    });
  });

  describe('stop', () => {
    it('resets to idle', () => {
      controller.play();
      controller.tick(50);
      controller.stop();
      expect(controller.getControls().state).toBe('idle');
      expect(controller.getControls().currentTime).toBe(0);
    });
  });
});

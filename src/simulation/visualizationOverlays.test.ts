import { describe, it, expect } from 'vitest';
import {
  PRESSURE_COLOR_SCALE,
  VELOCITY_COLOR_SCALE,
  WAVE_COLOR_SCALE,
  STRESS_COLOR_SCALE,
  TEMPERATURE_COLOR_SCALE,
  mapColor,
  generatePressureMap,
  generateVelocityField,
  generateWaveFronts,
  generateStressField,
  generateTemperatureGradient,
  createOverlayLayer,
  createComposite,
  getVisibleLayers,
  effectiveOpacity,
  advanceOverlayAnimation,
  setOverlayOpacity,
  toggleOverlayVisibility,
  generateOverlayComposite,
  defaultControl,
  type Vector3,
} from './visualizationOverlays';

function makePressureField(): { position: Vector3; normal: Vector3; pressure: number }[] {
  return [
    { position: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 }, pressure: 100000 },
    { position: { x: 1, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 }, pressure: 90000 },
    { position: { x: 2, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 }, pressure: 80000 },
  ];
}

function makeVelocityField(): { position: Vector3; velocity: Vector3 }[] {
  return [
    { position: { x: 0, y: 0, z: 0 }, velocity: { x: 1, y: 0, z: 0 } },
    { position: { x: 1, y: 0, z: 0 }, velocity: { x: 2, y: 0, z: 0 } },
    { position: { x: 0, y: 1, z: 0 }, velocity: { x: 0, y: 1, z: 0 } },
  ];
}

function makeStressField(): { position: Vector3; normal: Vector3; stress: number }[] {
  return [
    { position: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, stress: 10e6 },
    { position: { x: 1, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, stress: 20e6 },
    { position: { x: 2, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, stress: 30e6 },
  ];
}

function makeTemperatureField(): { position: Vector3; temperature: number }[] {
  return [
    { position: { x: 0, y: 0, z: 0 }, temperature: 20 },
    { position: { x: 1, y: 0, z: 0 }, temperature: 25 },
    { position: { x: 2, y: 0, z: 0 }, temperature: 30 },
  ];
}

describe('Visualization Overlays (M11.5-T11)', () => {
  describe('colour scales', () => {
    it('all scales have at least 2 stops', () => {
      expect(PRESSURE_COLOR_SCALE.stops.length).toBeGreaterThanOrEqual(2);
      expect(VELOCITY_COLOR_SCALE.stops.length).toBeGreaterThanOrEqual(2);
      expect(WAVE_COLOR_SCALE.stops.length).toBeGreaterThanOrEqual(2);
      expect(STRESS_COLOR_SCALE.stops.length).toBeGreaterThanOrEqual(2);
      expect(TEMPERATURE_COLOR_SCALE.stops.length).toBeGreaterThanOrEqual(2);
    });

    it('mapColor returns first stop at 0 and last stop at 1', () => {
      expect(mapColor(PRESSURE_COLOR_SCALE, 0)).toBe(PRESSURE_COLOR_SCALE.stops[0]);
      expect(mapColor(PRESSURE_COLOR_SCALE, 1)).toBe(PRESSURE_COLOR_SCALE.stops[4]);
    });

    it('mapColor interpolates between stops', () => {
      const mid = mapColor(PRESSURE_COLOR_SCALE, 0.5);
      expect(mid).not.toBe(PRESSURE_COLOR_SCALE.stops[0]);
      expect(mid).not.toBe(PRESSURE_COLOR_SCALE.stops[4]);
      expect(mid).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('defaultControl', () => {
    it('creates a control with sensible defaults', () => {
      const ctrl = defaultControl(PRESSURE_COLOR_SCALE);
      expect(ctrl.opacity).toBeGreaterThan(0);
      expect(ctrl.opacity).toBeLessThanOrEqual(1);
      expect(ctrl.visible).toBe(true);
      expect(ctrl.animation.enabled).toBe(false);
      expect(ctrl.colorScale).toBe(PRESSURE_COLOR_SCALE);
    });
  });

  describe('generatePressureMap', () => {
    it('normalizes pressure values to 0-1', () => {
      const data = generatePressureMap(makePressureField());
      expect(data.type).toBe('pressure-map');
      expect(data.cells).toHaveLength(3);
      expect(data.cells[0].normalized).toBeCloseTo(1, 5);
      expect(data.cells[2].normalized).toBeCloseTo(0, 5);
      expect(data.unit).toBe('Pa');
    });

    it('computes range from pressure field', () => {
      const data = generatePressureMap(makePressureField());
      expect(data.range.min).toBe(80000);
      expect(data.range.max).toBe(100000);
    });
  });

  describe('generateVelocityField', () => {
    it('generates arrows with normalised directions', () => {
      const data = generateVelocityField(makeVelocityField());
      expect(data.type).toBe('velocity-field');
      expect(data.arrows).toHaveLength(3);
      const len = Math.sqrt(
        data.arrows[0].direction.x ** 2 +
          data.arrows[0].direction.y ** 2 +
          data.arrows[0].direction.z ** 2,
      );
      expect(len).toBeCloseTo(1, 5);
    });

    it('generates particles from arrows', () => {
      const data = generateVelocityField(makeVelocityField(), 2);
      expect(data.particles.length).toBeLessThanOrEqual(2);
      expect(data.particles[0].velocity).toBeDefined();
    });
  });

  describe('generateWaveFronts', () => {
    it('creates expanding wave fronts', () => {
      const source: Vector3 = { x: 0, y: 0, z: 0 };
      const data = generateWaveFronts(source, 343, 0.1, 5);
      expect(data.type).toBe('wave-front');
      expect(data.fronts).toHaveLength(5);
      expect(data.fronts[0].radius).toBeLessThan(data.fronts[4].radius);
      expect(data.fronts[0].amplitude).toBeGreaterThan(data.fronts[4].amplitude);
    });
  });

  describe('generateStressField', () => {
    it('normalizes stress values to 0-1', () => {
      const data = generateStressField(makeStressField());
      expect(data.type).toBe('stress-field');
      expect(data.cells).toHaveLength(3);
      expect(data.cells[0].normalized).toBeCloseTo(0, 5);
      expect(data.cells[2].normalized).toBeCloseTo(1, 5);
      expect(data.unit).toBe('Pa');
    });
  });

  describe('generateTemperatureGradient', () => {
    it('normalizes temperature values to 0-1', () => {
      const data = generateTemperatureGradient(makeTemperatureField());
      expect(data.type).toBe('temperature-gradient');
      expect(data.cells).toHaveLength(3);
      expect(data.cells[0].normalized).toBeCloseTo(0, 5);
      expect(data.cells[2].normalized).toBeCloseTo(1, 5);
      expect(data.unit).toBe('°C');
    });
  });

  describe('overlay compositing', () => {
    it('createOverlayLayer wraps data with default control', () => {
      const data = generatePressureMap(makePressureField());
      const layer = createOverlayLayer('pressure-map', data);
      expect(layer.type).toBe('pressure-map');
      expect(layer.control.visible).toBe(true);
      expect(layer.data).toBe(data);
    });

    it('createComposite holds multiple layers', () => {
      const pressure = createOverlayLayer('pressure-map', generatePressureMap(makePressureField()));
      const velocity = createOverlayLayer(
        'velocity-field',
        generateVelocityField(makeVelocityField()),
      );
      const composite = createComposite([pressure, velocity], 0.9);
      expect(composite.layers).toHaveLength(2);
      expect(composite.masterOpacity).toBe(0.9);
    });

    it('getVisibleLayers filters out hidden layers', () => {
      const pressure = createOverlayLayer('pressure-map', generatePressureMap(makePressureField()));
      const velocity = createOverlayLayer(
        'velocity-field',
        generateVelocityField(makeVelocityField()),
      );
      let composite = createComposite([pressure, velocity]);
      composite = toggleOverlayVisibility(composite, 'pressure-map');
      const visible = getVisibleLayers(composite);
      expect(visible).toHaveLength(1);
      expect(visible[0].type).toBe('velocity-field');
    });

    it('effectiveOpacity multiplies layer and master opacity', () => {
      const pressure = createOverlayLayer('pressure-map', generatePressureMap(makePressureField()));
      const composite = createComposite([pressure], 0.5);
      expect(effectiveOpacity(composite, pressure)).toBeCloseTo(0.8 * 0.5, 5);
    });

    it('setOverlayOpacity updates only the target layer', () => {
      const pressure = createOverlayLayer('pressure-map', generatePressureMap(makePressureField()));
      const velocity = createOverlayLayer(
        'velocity-field',
        generateVelocityField(makeVelocityField()),
      );
      let composite = createComposite([pressure, velocity]);
      composite = setOverlayOpacity(composite, 'pressure-map', 0.3);
      const pressureLayer = composite.layers.find((l) => l.type === 'pressure-map');
      const velocityLayer = composite.layers.find((l) => l.type === 'velocity-field');
      expect(pressureLayer?.control.opacity).toBe(0.3);
      expect(velocityLayer?.control.opacity).toBe(0.8);
    });
  });

  describe('animation controls', () => {
    it('advanceOverlayAnimation updates time for enabled layers only', () => {
      const pressure = createOverlayLayer('pressure-map', generatePressureMap(makePressureField()));
      const velocity = createOverlayLayer(
        'velocity-field',
        generateVelocityField(makeVelocityField()),
      );
      let composite = createComposite([pressure, velocity]);
      // Enable animation on velocity layer
      composite.layers[1].control.animation.enabled = true;
      composite = advanceOverlayAnimation(composite, 0.5);
      expect(composite.layers[0].control.animation.time).toBe(0);
      expect(composite.layers[1].control.animation.time).toBeCloseTo(0.5, 5);
    });
  });

  describe('generateOverlayComposite', () => {
    it('generates composite from all available simulation data', () => {
      const composite = generateOverlayComposite({
        pressureField: makePressureField(),
        velocityField: makeVelocityField(),
        acousticSource: { x: 0, y: 0, z: 0 },
        speedOfSound: 343,
        stressField: makeStressField(),
        temperatureField: makeTemperatureField(),
      });
      expect(composite.layers).toHaveLength(5);
      const types = composite.layers.map((l) => l.type);
      expect(types).toContain('pressure-map');
      expect(types).toContain('velocity-field');
      expect(types).toContain('wave-front');
      expect(types).toContain('stress-field');
      expect(types).toContain('temperature-gradient');
    });

    it('generates composite from partial data', () => {
      const composite = generateOverlayComposite({
        pressureField: makePressureField(),
      });
      expect(composite.layers).toHaveLength(1);
      expect(composite.layers[0].type).toBe('pressure-map');
    });

    it('generates empty composite when no data', () => {
      const composite = generateOverlayComposite({});
      expect(composite.layers).toHaveLength(0);
    });
  });
});

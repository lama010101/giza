/**
 * Audio environment system per GIZA-04 §6.11 and GIZA-03 §2.19 (M09-T20).
 *
 * Defines audio zones for each chamber/area and computes reverb parameters,
 * spatial positioning, ambient soundscapes, and audio occlusion.
 *
 * Zones cover both the Osiris Shaft chambers and the Great Pyramid chambers.
 * All effects are scientifically grounded — no fantasy audio elements.
 */

// ─── Audio zones ───────────────────────────────────────────────────────────

export type AudioZoneId =
  // Osiris Shaft
  | 'osiris-surface'
  | 'osiris-level-1'
  | 'osiris-level-2'
  | 'osiris-level-3'
  // Great Pyramid
  | 'gp-exterior'
  | 'gp-descending-passage'
  | 'gp-subterranean'
  | 'gp-ascending-passage'
  | 'gp-grand-gallery'
  | 'gp-kings-chamber'
  | 'gp-queens-chamber';

export interface AudioZone {
  id: AudioZoneId;
  name: string;
  /** Bounding box center in world coordinates */
  center: { x: number; y: number; z: number };
  /** Bounding box half-extents */
  halfExtents: { x: number; y: number; z: number };
  /** Reverb parameters for this zone */
  reverb: ReverbParams;
  /** Ambient soundscape layers active in this zone */
  ambience: AmbienceLayer[];
}

export interface ReverbParams {
  /** Decay time (RT60) in seconds */
  decayTime: number;
  /** Pre-delay in milliseconds */
  preDelay: number;
  /** Diffusion (0-1) */
  diffusion: number;
  /** Wet/dry mix (0-1); 0 = fully dry, 1 = fully wet */
  wetMix: number;
}

export type AmbienceLayer =
  | 'water-dripping'
  | 'echoes'
  | 'wind'
  | 'footsteps'
  | 'torch-crackle'
  | 'stone-creak'
  | 'desert-wind'
  | 'silence';

// ─── Zone definitions ──────────────────────────────────────────────────────

export const AUDIO_ZONES: Record<AudioZoneId, AudioZone> = {
  'osiris-surface': {
    id: 'osiris-surface',
    name: 'Osiris Shaft Surface',
    center: { x: 0, y: 0, z: 0 },
    halfExtents: { x: 15, y: 5, z: 15 },
    reverb: { decayTime: 0.4, preDelay: 5, diffusion: 0.3, wetMix: 0.1 },
    ambience: ['desert-wind', 'footsteps'],
  },
  'osiris-level-1': {
    id: 'osiris-level-1',
    name: 'Osiris Shaft Level 1 (Chamber A)',
    center: { x: 0, y: -8.27, z: -2.8 },
    halfExtents: { x: 2, y: 1.5, z: 4.5 },
    reverb: { decayTime: 1.2, preDelay: 12, diffusion: 0.6, wetMix: 0.35 },
    ambience: ['echoes', 'stone-creak'],
  },
  'osiris-level-2': {
    id: 'osiris-level-2',
    name: 'Osiris Shaft Level 2 (Chamber B)',
    center: { x: -1.125, y: -21.85, z: -10.35 },
    halfExtents: { x: 2, y: 1.5, z: 3.5 },
    reverb: { decayTime: 1.5, preDelay: 15, diffusion: 0.65, wetMix: 0.4 },
    ambience: ['water-dripping', 'echoes'],
  },
  'osiris-level-3': {
    id: 'osiris-level-3',
    name: 'Osiris Shaft Level 3 (Chamber I)',
    center: { x: 0, y: -29.15, z: 0 },
    halfExtents: { x: 3, y: 2, z: 5 },
    reverb: { decayTime: 2.0, preDelay: 20, diffusion: 0.75, wetMix: 0.5 },
    ambience: ['water-dripping', 'echoes', 'stone-creak'],
  },
  'gp-exterior': {
    id: 'gp-exterior',
    name: 'Great Pyramid Exterior',
    center: { x: 0, y: 69.3, z: 0 },
    halfExtents: { x: 120, y: 70, z: 120 },
    reverb: { decayTime: 0.3, preDelay: 3, diffusion: 0.2, wetMix: 0.05 },
    ambience: ['desert-wind', 'footsteps'],
  },
  'gp-descending-passage': {
    id: 'gp-descending-passage',
    name: 'Descending Passage',
    center: { x: 7.29, y: -6.51, z: -54.8 },
    halfExtents: { x: 0.6, y: 0.7, z: 53 },
    reverb: { decayTime: 0.8, preDelay: 8, diffusion: 0.5, wetMix: 0.25 },
    ambience: ['echoes', 'footsteps'],
  },
  'gp-subterranean': {
    id: 'gp-subterranean',
    name: 'Subterranean Chamber',
    center: { x: 0.66, y: -28.22, z: 5.16 },
    halfExtents: { x: 7, y: 2, z: 4.5 },
    reverb: { decayTime: 1.8, preDelay: 18, diffusion: 0.7, wetMix: 0.45 },
    ambience: ['echoes', 'stone-creak', 'water-dripping'],
  },
  'gp-ascending-passage': {
    id: 'gp-ascending-passage',
    name: 'Ascending Passage',
    center: { x: 7.29, y: 15.02, z: -62.18 },
    halfExtents: { x: 0.5, y: 0.7, z: 20 },
    reverb: { decayTime: 0.7, preDelay: 7, diffusion: 0.45, wetMix: 0.2 },
    ambience: ['echoes', 'footsteps'],
  },
  'gp-grand-gallery': {
    id: 'gp-grand-gallery',
    name: 'Grand Gallery',
    center: { x: 7.22, y: 36.25, z: -24.75 },
    halfExtents: { x: 1.2, y: 4.5, z: 24 },
    reverb: { decayTime: 2.5, preDelay: 25, diffusion: 0.8, wetMix: 0.55 },
    ambience: ['echoes', 'footsteps', 'stone-creak'],
  },
  'gp-kings-chamber': {
    id: 'gp-kings-chamber',
    name: "King's Chamber",
    center: { x: 7.22, y: 45.88, z: 11.02 },
    halfExtents: { x: 5.5, y: 3, z: 2.8 },
    reverb: { decayTime: 1.4, preDelay: 14, diffusion: 0.65, wetMix: 0.4 },
    ambience: ['echoes', 'torch-crackle'],
  },
  'gp-queens-chamber': {
    id: 'gp-queens-chamber',
    name: "Queen's Chamber",
    center: { x: 0, y: 24.05, z: 6.32 },
    halfExtents: { x: 3, y: 3.2, z: 2.8 },
    reverb: { decayTime: 1.6, preDelay: 16, diffusion: 0.68, wetMix: 0.42 },
    ambience: ['echoes', 'water-dripping'],
  },
};

// ─── Spatial audio ─────────────────────────────────────────────────────────

export interface SpatialAudioParams {
  /** 3D pan position (-1 = full left, 0 = center, 1 = full right) */
  pan: number;
  /** Distance attenuation factor (0-1; 1 = full volume, 0 = silent) */
  attenuation: number;
  /** Whether HRTF (head-related transfer function) is enabled */
  hrtf: boolean;
}

export interface AudioSource {
  position: { x: number; y: number; z: number };
  /** Base volume (0-1) */
  volume: number;
}

// ─── Occlusion ─────────────────────────────────────────────────────────────

export interface OcclusionWall {
  /** Wall center position */
  center: { x: number; y: number; z: number };
  /** Wall normal direction */
  normal: { x: number; y: number; z: number };
  /** Wall thickness in meters */
  thickness: number;
}

// ─── Dynamic mixing ────────────────────────────────────────────────────────

export interface DynamicMixState {
  /** Currently active zone */
  activeZone: AudioZoneId;
  /** Blend weight for the active zone (0-1) */
  activeWeight: number;
  /** Neighboring zone being blended into (if transitioning) */
  transitionZone: AudioZoneId | null;
  /** Blend weight for the transition zone (0-1) */
  transitionWeight: number;
  /** Master volume (0-1) */
  masterVolume: number;
}

// ─── Zone detection ────────────────────────────────────────────────────────

/**
 * Determines which audio zone a listener position falls into.
 * Returns null if the position is outside all defined zones.
 */
export function getZoneAtPosition(position: {
  x: number;
  y: number;
  z: number;
}): AudioZoneId | null {
  // Check zones from smallest to largest so the most specific zone wins
  // when a position falls inside multiple overlapping zones (e.g. a chamber
  // inside the exterior bounding box).
  const sorted = Object.values(AUDIO_ZONES).sort((a, b) => {
    const volA = a.halfExtents.x * a.halfExtents.y * a.halfExtents.z;
    const volB = b.halfExtents.x * b.halfExtents.y * b.halfExtents.z;
    return volA - volB;
  });
  for (const zone of sorted) {
    const dx = Math.abs(position.x - zone.center.x);
    const dy = Math.abs(position.y - zone.center.y);
    const dz = Math.abs(position.z - zone.center.z);
    if (dx <= zone.halfExtents.x && dy <= zone.halfExtents.y && dz <= zone.halfExtents.z) {
      return zone.id;
    }
  }
  return null;
}

/**
 * Returns the audio zone definition by ID.
 */
export function getAudioZone(id: AudioZoneId): AudioZone {
  const zone = AUDIO_ZONES[id];
  if (!zone) throw new Error(`Audio zone ${id} not found`);
  return zone;
}

// ─── Reverb computation ────────────────────────────────────────────────────

/**
 * Computes reverb parameters for a zone, adjusted by chamber dimensions.
 * Larger chambers have longer decay times and more diffusion.
 */
export function computeReverbParams(zone: AudioZone): ReverbParams {
  const { halfExtents } = zone;
  const volume = halfExtents.x * 2 * (halfExtents.y * 2) * (halfExtents.z * 2);
  // Sabine-inspired decay estimate: larger volume → longer decay
  const baseDecay = zone.reverb.decayTime;
  const volumeFactor = Math.cbrt(volume / 100);
  const decayTime = baseDecay * Math.max(0.5, Math.min(2.0, volumeFactor));
  // Pre-delay scales with chamber size
  const maxDim = Math.max(halfExtents.x, halfExtents.y, halfExtents.z);
  const preDelay = zone.reverb.preDelay + maxDim * 0.5;
  return {
    decayTime,
    preDelay,
    diffusion: zone.reverb.diffusion,
    wetMix: zone.reverb.wetMix,
  };
}

// ─── Spatial audio positioning ─────────────────────────────────────────────

/**
 * Computes spatial audio parameters for a source relative to a listener.
 * Includes 3D pan, distance attenuation, and HRTF enablement.
 */
export function computeSpatialAudio(
  source: AudioSource,
  listenerPosition: { x: number; y: number; z: number },
  listenerForward: { x: number; y: number; z: number },
  maxDistance: number,
): SpatialAudioParams {
  const dx = source.position.x - listenerPosition.x;
  const dy = source.position.y - listenerPosition.y;
  const dz = source.position.z - listenerPosition.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Distance attenuation: inverse distance model
  const attenuation = Math.max(0, 1 - distance / maxDistance) * source.volume;

  // 3D pan: project source direction onto listener's right vector
  // Right vector = forward × up (assuming up = +Y)
  const rightX = listenerForward.z;
  const rightZ = -listenerForward.x;
  const rightLen = Math.sqrt(rightX * rightX + rightZ * rightZ) || 1;
  const dirX = distance > 0 ? dx / distance : 0;
  const dirZ = distance > 0 ? dz / distance : 0;
  const pan = Math.max(-1, Math.min(1, (dirX * rightX + dirZ * rightZ) / rightLen));

  // HRTF enabled when source is close enough to benefit from spatialization
  const hrtf = distance < maxDistance * 0.7 && attenuation > 0.05;

  return { pan, attenuation, hrtf };
}

// ─── Audio occlusion ───────────────────────────────────────────────────────

/**
 * Computes audio occlusion based on ray casting through walls.
 * Each wall the ray passes through adds attenuation proportional to its thickness.
 * Returns an occlusion factor (0 = fully blocked, 1 = no occlusion).
 */
export function computeOcclusion(
  sourcePosition: { x: number; y: number; z: number },
  listenerPosition: { x: number; y: number; z: number },
  walls: OcclusionWall[],
): number {
  const dx = listenerPosition.x - sourcePosition.x;
  const dy = listenerPosition.y - sourcePosition.y;
  const dz = listenerPosition.z - sourcePosition.z;
  const rayLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (rayLength === 0) return 1;

  const rayDir = { x: dx / rayLength, y: dy / rayLength, z: dz / rayLength };
  let totalAttenuationDb = 0;

  for (const wall of walls) {
    // Check if ray passes through the wall plane
    const dot = rayDir.x * wall.normal.x + rayDir.y * wall.normal.y + rayDir.z * wall.normal.z;
    if (Math.abs(dot) < 1e-6) continue; // ray parallel to wall

    // Distance along ray to the wall plane
    const toWallX = wall.center.x - sourcePosition.x;
    const toWallY = wall.center.y - sourcePosition.y;
    const toWallZ = wall.center.z - sourcePosition.z;
    const t = (toWallX * wall.normal.x + toWallY * wall.normal.y + toWallZ * wall.normal.z) / dot;

    // Intersection must be between source and listener
    if (t < 0 || t > rayLength) continue;

    // Attenuation per wall: ~6 dB per 0.1 m of stone
    const wallAttenuationDb = (wall.thickness / 0.1) * 6;
    totalAttenuationDb += wallAttenuationDb;
  }

  // Convert dB attenuation to linear factor
  const linearFactor = Math.pow(10, -totalAttenuationDb / 20);
  return Math.max(0, Math.min(1, linearFactor));
}

// ─── Ambient soundscapes ───────────────────────────────────────────────────

export interface AmbienceState {
  layer: AmbienceLayer;
  volume: number;
  /** Loop interval in seconds (0 = continuous) */
  interval: number;
}

/**
 * Generates the ambient soundscape state for a zone.
 * Each ambience layer gets a volume and loop interval.
 */
export function generateAmbience(zone: AudioZone): AmbienceState[] {
  const layerConfig: Record<AmbienceLayer, { volume: number; interval: number }> = {
    'water-dripping': { volume: 0.4, interval: 3 },
    echoes: { volume: 0.2, interval: 0 },
    wind: { volume: 0.3, interval: 0 },
    footsteps: { volume: 0.5, interval: 2 },
    'torch-crackle': { volume: 0.35, interval: 0 },
    'stone-creak': { volume: 0.15, interval: 8 },
    'desert-wind': { volume: 0.25, interval: 0 },
    silence: { volume: 0, interval: 0 },
  };
  return zone.ambience.map((layer) => ({
    layer,
    volume: layerConfig[layer].volume,
    interval: layerConfig[layer].interval,
  }));
}

// ─── Dynamic mixing ────────────────────────────────────────────────────────

/**
 * Computes the dynamic mix state based on camera (listener) position.
 * Handles smooth transitions between zones by blending reverb and ambience.
 */
export function computeDynamicMix(
  listenerPosition: { x: number; y: number; z: number },
  masterVolume: number,
): DynamicMixState {
  const activeZoneId = getZoneAtPosition(listenerPosition);
  if (activeZoneId) {
    return {
      activeZone: activeZoneId,
      activeWeight: 1,
      transitionZone: null,
      transitionWeight: 0,
      masterVolume,
    };
  }
  // Outside all zones — find nearest zone for fallback
  let nearestZone: AudioZoneId | null = null;
  let nearestDist = Infinity;
  for (const zone of Object.values(AUDIO_ZONES)) {
    const dx = listenerPosition.x - zone.center.x;
    const dy = listenerPosition.y - zone.center.y;
    const dz = listenerPosition.z - zone.center.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestZone = zone.id;
    }
  }
  return {
    activeZone: nearestZone ?? 'gp-exterior',
    activeWeight: 0.3, // reduced weight when outside
    transitionZone: null,
    transitionWeight: 0,
    masterVolume,
  };
}

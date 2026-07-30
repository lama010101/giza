/**
 * Great Pyramid measurement constants.
 *
 * Sources:
 * - Petrie, W.M.F. (1883) *The Pyramids and Temples of Gizeh*
 * - Cole, J.H. (1925) *Determination of the Exact Size and Orientation of the Great Pyramid*
 * - Gantenbrink, R. (1999) Upuaut shaft surveys
 * - Piazzi Smyth, C. (1867) *Life and Work at the Great Pyramid*
 *
 * All values in metres unless otherwise noted.
 * Coordinate system: X=east, Y=up, Z=south, origin at pyramid centre at pavement level.
 */

export const GP_EXTERNAL = {
  /** Cole 1925 mean base length (m) */
  baseMean: 230.364,
  /** Current height (m) — estimated from remaining courses */
  currentHeight: 138.5,
  /** Original height including casing (m) — 280 royal cubits */
  originalHeight: 146.6,
  /** Casing angle (degrees) — 51°50'40" per Petrie */
  casingAngleDeg: 51.84,
} as const;

export const GP_ENTRANCE = {
  /** Entrance height above pavement (m) — Petrie 668.2 B" */
  heightAboveBase: 16.97,
  /** Entrance X offset east of centre (m) — Petrie 286.45 B" */
  xOffset: 7.29,
} as const;

export const GP_DESCENDING_PASSAGE = {
  /** 26°31' (degrees) */
  angleDeg: 26.52,
  /** Total sloped length (m) — Petrie 4141.4 B" */
  totalLength: 105.16,
  /** Passage width (m) — 41.42 in */
  width: 1.05,
  /** Passage height (m) — 47.24 in */
  height: 1.19,
} as const;

export const GP_ASCENDING_PASSAGE = {
  /** 26°2'16" (degrees) */
  angleDeg: 26.04,
  /** Sloped length (m) — Petrie 1546.5 B" */
  length: 39.29,
  /** Passage width (m) — 38.2 in */
  width: 0.97,
  /** Passage height (m) — 47.24 in */
  height: 1.2,
} as const;

export const GP_GRAND_GALLERY = {
  /** 26°17' (degrees) */
  angleDeg: 26.28,
  /** Sloping floor length N wall to S wall (m) — Petrie 1883.6 B" */
  floorLength: 47.85,
  /** Ceiling length N wall to S wall (m) — Petrie 1838.6 B" */
  ceilingLength: 46.7,
  /** Total length including step (m) — Petrie 1884.4 B" */
  totalLength: 47.84,
  /** Perpendicular height floor to ceiling (m) — Petrie 344.0 B" */
  height: 8.74,
  /** Max height per Piazzi Smyth (m) — 346 B" (avg of 15 measurements) */
  heightSmyth: 8.79,
  /** Width at floor (m) — 82.42 in */
  floorWidth: 2.09,
  /** Width at top between highest corbels (m) — 41.24 in */
  topWidth: 1.05,
  /** Side ramp width (m) — derived: (floorWidth - centralFloorWidth) / 2 = (2.09 - 1.04) / 2 */
  rampWidth: 0.525,
  /** Side ramp height (m) — inferred from reference images, ~2 royal cubits */
  rampHeight: 1.0,
  /** Central floor width between ramps (m) — 40.6 in */
  centralFloorWidth: 1.04,
  /** Corbel projection per course (m) — derived: (floorWidth - topWidth) / (2 * corbelCourses) = (2.09 - 1.05) / 14 */
  corbelProjection: 0.0743,
  /** Number of corbelled courses */
  corbelCourses: 7,
  /** Number of roof tiles on ceiling */
  roofTileCount: 36,
  /** Gallery center offset east of pyramid center (m) */
  xOffset: 7.22,
  /** Floor lower end Y (m above base) — AP/GG junction elevation (~980 B") */
  floorLowY: 24.9,
  /** North wall floor Y (m above base) — derived: floorHighY - floorLength * sin(angle) = 1689.0 - 1883.6 * sin(26.28°) */
  floorNorthY: 21.74,
  /** Floor upper end Y at south wall (m above base) — Petrie 1689.0 ± 0.5 B" */
  floorHighY: 42.92,
} as const;

export const GP_KINGS_CHAMBER = {
  /** Width (m) — Petrie 206.29 in */
  width: 5.24,
  /** Height (m) — Petrie 230.09 in */
  height: 5.97,
  /** Depth (m) — Petrie 412.53 in */
  depth: 10.47,
  /** Floor Y (m above pavement) — Petrie 1692.0 B" */
  floorY: 42.96,
  /** Ceiling height above pavement (m) — floorY + height */
  ceilingHeightAbovePavement: 48.93,
} as const;

export const GP_RELIEVING = {
  /** Total height of relieving chambers (m) — Vyse */
  totalHeight: 21.11,
} as const;

export const GP_QUEENS_CHAMBER = {
  /** Floor Y (m above pavement) — Petrie 834.4 B" */
  floorY: 21.19,
  /** Width (m) */
  width: 5.23,
  /** Height (m) */
  height: 6.23,
  /** Depth (m) */
  depth: 5.75,
} as const;

export const GP_KC_SHAFTS = {
  north: {
    /** Gantenbrink 32.6° */
    angleDeg: 32.6,
    /** Diameter (m) */
    diameter: 0.205,
  },
  south: {
    /** Gantenbrink 45.0° */
    angleDeg: 45.0,
    /** Diameter (m) */
    diameter: 0.205,
  },
} as const;

export const GP_QC_SHAFTS = {
  north: {
    /** Gantenbrink 39.7° */
    angleDeg: 39.0,
    /** Diameter (m) */
    diameter: 0.21,
  },
  south: {
    /** Gantenbrink 39.6° */
    angleDeg: 39.6,
    /** Diameter (m) */
    diameter: 0.21,
  },
} as const;

export const GP_WELL_SHAFT = {
  /** Width (m) — Petrie 30.75 in */
  width: 0.78,
} as const;

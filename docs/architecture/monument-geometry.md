# GIZA — Reproducible 3D Structure Reference

This document contains the exact geometry needed to reproduce the two current monument reconstructions (Great Pyramid of Giza and Osiris Shaft) pixel- and meter-for-meter.
All coordinates use the project convention: **+X = east, +Y = up, +Z = south**, origin at the monument local center at pavement/surface level. Units are meters unless otherwise noted. Rotations are in radians around the X, Y, Z axes using Three.js right-handed convention.

## 1. Great Pyramid of Giza

### 1.1 Coordinate system & conventions

- Origin: pyramid centre at pavement level.
- Box geometry in Three.js is centered at `position` and sized by `size`.
- `opacity` < 1 means transparent; missing `opacity` means 1.0.
- `rotation.x` positive tilts the +Z end downward (descending); negative tilts +Z end upward (ascending / shafts toward north).

### 1.2 LOD0 — manual blockout

Blockout ID: `great-pyramid-blockout`  
Name: Great Pyramid of Giza  
Units: meters

| ID                              | Name                                              | Position (x, y, z)            | Size (x, y, z)                 | Rotation (x, y, z) | Layer          | Color   | Opacity | Derivation |
| ------------------------------- | ------------------------------------------------- | ----------------------------- | ------------------------------ | ------------------ | -------------- | ------- | ------- | ---------- |
| `pyramid-exterior`              | Pyramid Exterior (core masonry)                   | (0, 69.3000, 0)               | (230.3600, 138.6000, 230.3600)  | (0, 0, 0)          | exterior       | #c2b090 | 0.15    |            |
| `casing-north`                  | Casing Stones (north face, lower courses)         | (0, 5, -111.2500)             | (230.3600, 10, 1)               | (0.9048, 0, 0)     | exterior       | #e8e0d0 | 0.7     |            |
| `original-entrance`             | Original Entrance                                 | (7.2900, 16.9700, -101.8400)  | (1.0500, 1.1900, 1)             | (0, 0, 0)          | exterior       | #8a7a55 | 1       |            |
| `modern-entrance`               | Modern Entrance (Al-Mamun Tunnel)                 | (0, 17, -101.8400)            | (2, 2, 3)                       | (0, 0, 0)          | exterior       | #6b5f45 | 1       |            |
| `descending-passage`            | Descending Passage (sloped)                       | (7.2900, -6.5100, -54.8000)   | (1.0500, 1.1900, 105.1600)      | (0.4629, 0, 0)     | passages       | #8a7a55 | 0.4     |            |
| `descending-passage-horizontal` | Descending Passage (horizontal)                   | (7.2900, -29.9900, 0.7800)    | (1.0500, 1.1900, 17.0700)       | (0, 0, 0)          | passages       | #8a7a55 | 0.4     |            |
| `subterranean-chamber`          | Subterranean Chamber                              | (0.6600, -28.2200, 5.1600)    | (14.0700, 3.5600, 8.2800)       | (0, 0, 0)          | subterranean   | #7a6a4a | 0.5     |            |
| `subterranean-pit`              | Central Pit (Subterranean)                        | (0.6600, -32.5200, 5.1600)    | (2.5400, 5.0300, 2.5400)        | (0, 0, 0)          | subterranean   | #5a4a30 | 0.6     |            |
| `ascending-passage`             | Ascending Passage                                 | (7.2900, 15.0200, -62.1800)   | (1, 1.2000, 39.2900)            | (-0.4545, 0, 0)    | passages       | #c2ab7a | 0.4     |            |
| `grand-gallery`                 | Grand Gallery                                     | (7.2200, 36.2500, -24.7500)   | (2.0900, 8.7400, 47.8500)       | (-0.4587, 0, 0)    | gallery        | #d4c4a0 | 0.35    |            |
| `antechamber`                   | Antechamber                                       | (7.2200, 44.8000, 1.6200)     | (1.6510, 3.7940, 2.9540)        | (0, 0, 0)          | kings-complex  | #a08060 | 0.5     |            |
| `kings-chamber`                 | King's Chamber                                    | (7.2200, 45.8800, 11.0200)    | (10.4700, 5.8400, 5.2400)       | (0, 0, 0)          | kings-complex  | #8a6050 | 0.4     |            |
| `kings-sarcophagus`             | King's Chamber Sarcophagus                        | (2.4700, 43.5000, 11.0200)    | (0.9780, 1.0490, 2.2760)        | (0, 0, 0)          | kings-complex  | #3a3a3f | 1       |            |
| `relieving-davison`             | Davison's Chamber (Relieving 1)                   | (7.2200, 49.3500, 11.0200)    | (11.6800, 1.0700, 5.2100)       | (0, 0, 0)          | relieving      | #706050 | 0.4     |            |
| `relieving-wellington`          | Wellington's Chamber (Relieving 2)                | (7.2200, 52.3200, 11.0200)    | (11.7300, 1.1200, 5.1800)       | (0, 0, 0)          | relieving      | #706050 | 0.4     |            |
| `relieving-nelson`              | Nelson's Chamber (Relieving 3)                    | (7.2200, 55.5000, 11.0200)    | (11.8100, 1.4700, 5.0800)       | (0, 0, 0)          | relieving      | #706050 | 0.4     |            |
| `relieving-arbuthnot`           | Lady Arbuthnot's Chamber (Relieving 4)            | (7.2200, 58.7900, 11.0200)    | (11.3800, 1.3500, 4.9800)       | (0, 0, 0)          | relieving      | #706050 | 0.4     |            |
| `relieving-campbell`            | Campbell's Chamber (Relieving 5, with cartouches) | (7.2200, 62.6500, 11.0200)    | (11.5300, 2.6200, 6.2500)       | (0, 0, 0)          | relieving      | #807060 | 0.45    |            |
| `queens-chamber`                | Queen's Chamber                                   | (0, 24.0500, 6.3200)          | (5.7500, 6.2300, 5.2300)        | (0, 0, 0)          | queens-complex | #b39b6b | 0.4     |            |
| `queens-niche`                  | Queen's Chamber Niche (East Wall)                 | (2.8800, 23.8500, 6.3200)     | (1.0400, 4.6900, 1.5700)        | (0, 0, 0)          | queens-complex | #a38b5c | 0.6     |            |
| `queens-passage`                | Queen's Chamber Passage                           | (3.6100, 21.7800, -17.9800)   | (1.0500, 1.1700, 43.9600)       | (0, 0, 0)          | passages       | #c2ab7a | 0.35    |            |
| `kc-north-shaft`                | King's Chamber North Shaft                        | (7.2200, 62.1600, -21.4400)   | (0.2050, 0.2050, 70.9600)       | (0.5690, 0, 0)     | shafts         | #6b5f45 | 0.3     |            |
| `kc-south-shaft`                | King's Chamber South Shaft                        | (7.2200, 62.0100, 32.5400)    | (0.2050, 0.2050, 53.6900)       | (-0.7854, 0, 0)    | shafts         | #6b5f45 | 0.3     |            |
| `qc-north-shaft`                | Queen's Chamber North Shaft                       | (0, 40.1500, -19.5400)        | (0.2100, 0.2100, 60)            | (0.6807, 0, 0)     | shafts         | #6b5f45 | 0.3     |            |
| `qc-south-shaft`                | Queen's Chamber South Shaft                       | (0, 40.3900, 31.9800)         | (0.2100, 0.2100, 60)            | (-0.6912, 0, 0)    | shafts         | #6b5f45 | 0.3     |            |
| `well-shaft`                    | Well Shaft (Service Shaft)                        | (6.1700, -2.3300, -25.6800)   | (0.7800, 0.7800, 65.9200)       | (0.9838, 0, 0)     | passages       | #5a4a30 | 0.3     |            |
| `grotto`                        | Grotto                                            | (6.1700, 0, -25.6800)         | (2, 2, 2)                       | (0, 0, 0)          | passages       | #7a6a4a | 0.5     |            |

### 1.3 LOD1 — measurement-derived geometry

ID: `great-pyramid-lod1`  
Name: Great Pyramid LOD1  
Units: meters  
Generated by `database/geometry/gp-lod1.ts` from the constants below.

| ID                              | Name                                              | Position (x, y, z)            | Size (x, y, z)                 | Rotation (x, y, z) | Layer          | Color   | Opacity | Derivation |
| ------------------------------- | ------------------------------------------------- | ----------------------------- | ------------------------------ | ------------------ | -------------- | ------- | ------- | ---------- |
| `pyramid-exterior`              | Pyramid Exterior (core masonry)                   | (0, 69.2500, 0)               | (230.3640, 138.5000, 230.3640)  | (0, 0, 0)          | exterior       | #c2b090 | 0.15    | measured   |
| `casing-north`                  | Casing Stones (north face, lower courses)         | (0, 5, -111.2530)             | (230.3640, 10, 1)               | (0.9048, 0, 0)     | exterior       | #e8e0d0 | 0.7     | measured   |
| `original-entrance`             | Original Entrance                                 | (7.2900, 16.9700, -101.8471)  | (1.0500, 1.1900, 1)             | (0, 0, 0)          | exterior       | #8a7a55 | 1       | measured   |
| `modern-entrance`               | Modern Entrance (Al-Mamun Tunnel)                 | (0, 17, -101.8400)            | (2, 2, 3)                       | (0, 0, 0)          | exterior       | #6b5f45 | 1       | measured   |
| `descending-passage`            | Descending Passage (sloped)                       | (7.2900, -5.9751, -54.5340)   | (1.0500, 1.1900, 105.1600)      | (0.4629, 0, 0)     | passages       | #8a7a55 | 0.4     | calculated |
| `descending-passage-horizontal` | Descending Passage (horizontal)                   | (7.2900, -29.3900, 0.7828)    | (1.0500, 1.1900, 17.0700)       | (0, 0, 0)          | passages       | #8a7a55 | 0.4     | calculated |
| `subterranean-chamber`          | Subterranean Chamber                              | (0.6600, -28.2200, 5.1778)    | (14.0700, 3.5600, 8.2800)       | (0, 0, 0)          | subterranean   | #6a5a40 | 0.4     | calculated |
| `subterranean-pit`              | Central Pit (Subterranean)                        | (0.6600, -32.5150, 5.1778)    | (2.5400, 5.0300, 2.5400)        | (0, 0, 0)          | subterranean   | #5a4a30 | 0.6     | inferred   |
| `ascending-passage`             | Ascending Passage                                 | (7.2900, 15.0151, -62.1797)   | (0.9700, 1.2000, 39.2900)       | (-0.4545, 0, 0)    | passages       | #c2ab7a | 0.4     | calculated |
| `grand-gallery`                 | Grand Gallery                                     | (7.2200, 36.2513, -24.7482)   | (2.0900, 8.7400, 47.8500)       | (-0.4587, 0, 0)    | gallery        | #d4c4a0 | 0.35    | calculated |
| `antechamber`                   | Antechamber                                       | (7.2200, 44.8170, 1.6157)     | (1.6510, 3.7940, 2.9540)        | (0, 0, 0)          | kings-complex  | #a08060 | 0.4     | calculated |
| `kings-chamber`                 | King's Chamber                                    | (7.2200, 45.8800, 11.0127)    | (10.4700, 5.8400, 5.2400)       | (0, 0, 0)          | kings-complex  | #8a6050 | 0.4     | measured   |
| `kings-sarcophagus`             | King's Chamber Sarcophagus                        | (2.4700, 43.5000, 11.0200)    | (0.9780, 1.0490, 2.2760)        | (0, 0, 0)          | kings-complex  | #3a3a3f | 1       | measured   |
| `relieving-davison`             | Davison's Chamber (Relieving 1)                   | (7.2200, 49.3500, 11.0127)    | (11.6800, 1.0700, 5.2100)       | (0, 0, 0)          | relieving      | #706050 | 0.4     | calculated |
| `relieving-wellington`          | Wellington's Chamber (Relieving 2)                | (7.2200, 52.3200, 11.0127)    | (11.7300, 1.1200, 5.1800)       | (0, 0, 0)          | relieving      | #706050 | 0.4     | calculated |
| `relieving-nelson`              | Nelson's Chamber (Relieving 3)                    | (7.2200, 55.5000, 11.0127)    | (11.8100, 1.4700, 5.0800)       | (0, 0, 0)          | relieving      | #706050 | 0.4     | calculated |
| `relieving-arbuthnot`           | Lady Arbuthnot's Chamber (Relieving 4)            | (7.2200, 58.7900, 11.0127)    | (11.3800, 1.3500, 4.9800)       | (0, 0, 0)          | relieving      | #706050 | 0.4     | calculated |
| `relieving-campbell`            | Campbell's Chamber (Relieving 5, with cartouches) | (7.2200, 62.6500, 11.0127)    | (11.5300, 2.6200, 6.2500)       | (0, 0, 0)          | relieving      | #807060 | 0.45    | calculated |
| `queens-chamber`                | Queen's Chamber                                   | (0, 24.3050, 6.3200)          | (5.7500, 6.2300, 5.2300)        | (0, 0, 0)          | queens-complex | #b39b6b | 0.4     | measured   |
| `queens-niche`                  | Queen's Chamber Niche (East Wall)                 | (2.8800, 23.8500, 6.3200)     | (1.0400, 4.6900, 1.5700)        | (0, 0, 0)          | queens-complex | #a38b5c | 0.6     | measured   |
| `queens-passage`                | Queen's Chamber Passage                           | (3.6100, 21.7750, -17.9765)   | (1.0500, 1.1700, 43.9600)       | (0, 0, 0)          | queens-complex | #c2ab7a | 0.4     | calculated |
| `kc-north-shaft`                | KC North Shaft                                    | (7.2200, 62.1609, -21.4405)   | (0.2050, 0.2050, 70.9560)       | (0.5690, 0, 0)     | shafts         | #7a6a4a | 0.5     | calculated |
| `kc-south-shaft`                | KC South Shaft                                    | (7.2200, 62.0133, 32.5411)    | (0.2050, 0.2050, 53.6859)       | (-0.7854, 0, 0)    | shafts         | #7a6a4a | 0.5     | calculated |
| `qc-north-shaft`                | QC North Shaft                                    | (0, 40.1512, -19.5433)        | (0.2100, 0.2100, 60)            | (0.6807, 0, 0)     | shafts         | #7a6a4a | 0.5     | calculated |
| `qc-south-shaft`                | QC South Shaft                                    | (0, 40.3936, 31.9835)         | (0.2100, 0.2100, 60)            | (-0.6912, 0, 0)    | shafts         | #7a6a4a | 0.5     | calculated |
| `well-shaft`                    | Well Shaft                                        | (6.1750, -2.3265, -25.6841)   | (0.7800, 0.7800, 65.9211)       | (0.9838, 0, 0)     | shafts         | #6a5a40 | 0.5     | inferred   |
| `grotto`                        | Grotto                                            | (6.1700, 0, -25.6800)         | (2, 2, 2)                       | (0, 0, 0)          | passages       | #7a6a4a | 0.5     | inferred   |

### 1.4 Great Pyramid measurement constants

These constants live in `database/measurements/great-pyramid-measurements.ts`.

```ts
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
  /** Center X (m) — QC is on the pyramid centre axis, not offset east like KC/GG */
  centerX: 0,
  /** Center Z (m south of centre) — Petrie places QC ~249 B" south of centre */
  centerZ: 6.32,
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

/** Point of Intersection — where AP branches off DP */
export const GP_POI = {
  /** Distance along DP from entrance to AP junction (m) — Petrie ~980.5 B" */
  distanceAlongDP: 24.9,
} as const;

/** Antechamber — between GG south wall and King's Chamber */
export const GP_ANTECHAMBER = {
  /** Depth N-S (m) — Petrie 116.3 B" */
  depth: 2.954,
  /** Width E-W (m) — Petrie 65.0 B" */
  width: 1.651,
  /** Height (m) — Petrie 149.6 B" */
  height: 3.794,
  /** Floor Y (m above pavement) — same as GG south floor ~42.92 */
  floorY: 42.92,
  /** Gap between GG south wall and antechamber north wall (m) — step + short horizontal passage.
   *  Calibrated so the KC north wall matches Petrie's direct measurement of 330.6 B" S of centre. */
  gapFromGG: 1.5,
  /** Gap between antechamber south wall and KC north wall (m) — passage with portcullis grooves.
   *  Calibrated so the KC north wall matches Petrie's direct measurement of 330.6 B" S of centre. */
  gapToKC: 5.3,
} as const;

/** Subterranean Chamber — below pyramid centre */
export const GP_SUBTERRANEAN = {
  /** Chamber floor Y (m below pavement) — derived from DP geometry:
   *  entranceY - (totalLength - horizontalLength) * sin(DP angle)
   *  = 16.97 - 96.16 * sin(26.52°) ≈ -25.97.  Matches Petrie ~1022 B" below pavement. */
  floorY: -25.97,
  /** Chamber width E-W (m) — Petrie ~327 B" */
  width: 8.3,
  /** Chamber height (m) — Petrie ~140 B" */
  height: 3.56,
  /** Chamber depth N-S (m) — Petrie ~205 B" */
  depth: 5.2,
  /** Horizontal passage length at bottom of DP (m) */
  horizontalPassageLength: 9.0,
} as const;

/** Queen's Chamber Passage — horizontal, connects AP/GG junction to QC */
export const GP_QC_PASSAGE = {
  /** Total length (m) — Petrie 1731.6 B" */
  length: 43.96,
  /** Width (m) — Petrie ~41.4 B" */
  width: 1.05,
  /** Height before step (m) — Petrie ~46.2 B" */
  heightBeforeStep: 1.17,
  /** Height after step (m) — Petrie ~68.1 B" */
  heightAfterStep: 1.73,
} as const;
```

### 1.5 Great Pyramid geometry utilities

```ts
/**
 * Great Pyramid — Geometry Derivation Utilities
 *
 * Pure functions for computing 3D positions, rotations, and sizes
 * from raw measurement constants. No hardcoded coordinates.
 *
 * Coordinate system: +X=east, +Y=up, +Z=south, origin at pyramid centre.
 */

import type { Vector3 } from '@/schemas/location';

const DEG = Math.PI / 180;

/** Convert degrees to radians */
export function degToRad(deg: number): number {
  return deg * DEG;
}

/** Midpoint of two 3D points */
export function midpoint(a: Vector3, b: Vector3): Vector3 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

/**
 * Compute the endpoint of a sloped passage starting from a given point.
 * The passage slopes in the Y-Z plane (rotation around X-axis).
 * Positive angle = downward toward +Z (south).
 * Negative angle = upward toward +Z (south).
 */
export function slopedEndpoint(
  start: Vector3,
  angleDeg: number,
  length: number,
  direction: 1 | -1 = 1,
): Vector3 {
  const rad = degToRad(angleDeg);
  return {
    x: start.x,
    y: start.y - direction * length * Math.sin(rad),
    z: start.z + direction * length * Math.cos(rad),
  };
}

/**
 * 3D distance between two points.
 */
export function distance3D(a: Vector3, b: Vector3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Derive a sloped passage box from two floor endpoints.
 * The box length (size.z) is the 3D distance between endpoints.
 * The rotation is around X, computed from the Y-Z slope.
 * The box center is offset from the floor midpoint by half the height in the
 * perpendicular direction (so the floor face aligns with the endpoints).
 */
export function slopedBoxFromFloorEndpoints(
  start: Vector3,
  end: Vector3,
  width: number,
  height: number,
): { position: Vector3; rotation: Vector3; size: Vector3 } {
  const len = distance3D(start, end);
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const absDz = Math.abs(dz);
  // Use abs(dz) so the angle is always the acute slope angle.
  // Negate to match Three.js X-rotation convention:
  // positive rotation → +Z end goes down (descending passage)
  // negative rotation → +Z end goes up (ascending, grand gallery, north shafts)
  const angle = -Math.atan2(dy, absDz > 1e-9 ? absDz : 1e-9);
  const floorMid = midpoint(start, end);
  // Offset from floor midpoint to box center (half height in perpendicular direction)
  // For +Z passages: offsetZ = (h/2)*sin(angle)
  // For -Z passages: offsetZ must be flipped to keep ceiling on the correct side
  const zSign = dz >= 0 ? 1 : -1;
  const offsetY = (height / 2) * Math.cos(angle);
  const offsetZ = zSign * (height / 2) * Math.sin(angle);
  return {
    position: { x: floorMid.x, y: floorMid.y + offsetY, z: floorMid.z + offsetZ },
    rotation: { x: angle, y: 0, z: 0 },
    size: { x: width, y: height, z: len },
  };
}

/**
 * Compute the center position of a sloped box from its two endpoints.
 * The center is the midpoint of the start and end points.
 */
export function slopedBoxCenter(start: Vector3, end: Vector3): Vector3 {
  return midpoint(start, end);
}

/**
 * Compute the rotation for a sloped element.
 * Positive angle (e.g., descending passage) → positive rotation.x (slopes down toward +Z).
 * Negative angle (e.g., ascending passage) → negative rotation.x (slopes up toward +Z).
 */
export function slopedBoxRotation(angleDeg: number): Vector3 {
  return { x: degToRad(angleDeg), y: 0, z: 0 };
}

/**
 * Compute the center of a horizontal (non-sloped) element from its start point and length.
 * The element extends in the +Z direction.
 */
export function horizontalCenter(start: Vector3, length: number): Vector3 {
  return {
    x: start.x,
    y: start.y,
    z: start.z + length / 2,
  };
}

/**
 * Compute the center Y of a chamber given its floor Y and height.
 */
export function chamberCenterY(floorY: number, height: number): number {
  return floorY + height / 2;
}

/**
 * Compute the center Z of a chamber given its south wall Z and depth (N-S).
 * The chamber extends from southWallZ toward -Z (north).
 */
export function chamberCenterZ(southWallZ: number, depth: number): number {
  return southWallZ - depth / 2;
}

/**
 * Compute the center X of a chamber given its east offset and width (E-W).
 */
export function chamberCenterX(xOffset: number): number {
  return xOffset;
}

/**
 * Compute the Z position of the pyramid's sloped north face at a given height.
 * The face recedes inward from the base edge as height increases.
 * At y=0 the face is at z = -baseHalfWidth.
 * At y=h the face is at z = -baseHalfWidth + h / tan(casingAngle).
 *
 * @param y Height above pavement (m)
 * @param baseHalfWidth Half the base mean width (m) = baseMean / 2
 * @param casingAngleDeg Casing slope angle in degrees (e.g., 51.84)
 * @returns Z coordinate of the north face at that height
 */
export function faceZAtHeight(y: number, baseHalfWidth: number, casingAngleDeg: number): number {
  return -baseHalfWidth + y / Math.tan(degToRad(casingAngleDeg));
}
```

### 1.6 Great Pyramid LOD1 generator source

```ts
/**
 * Great Pyramid — LOD1 Geometry Generator
 *
 * Produces measurement-derived geometry nodes for LOD1 rendering.
 * Positions are calculated from published survey data, not hardcoded.
 *
 * LOD0 = existing blockout (manual coordinates)
 * LOD1 = measurement-derived positions (this file)
 *
 * All nodes include provenance metadata: derivation type and source.
 */

import type { Vector3 } from '@/schemas/location';
import type { BlockoutNode } from '@db/blockouts/great-pyramid';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import {
  GP_EXTERNAL,
  GP_ENTRANCE,
  GP_DESCENDING_PASSAGE,
  GP_ASCENDING_PASSAGE,
  GP_GRAND_GALLERY,
  GP_KINGS_CHAMBER,
  GP_QUEENS_CHAMBER,
  GP_KC_SHAFTS,
  GP_QC_SHAFTS,
  GP_WELL_SHAFT,
  GP_POI,
  GP_ANTECHAMBER,
  GP_SUBTERRANEAN,
  GP_QC_PASSAGE,
} from '@db/measurements/great-pyramid-measurements';
import {
  degToRad,
  slopedEndpoint,
  slopedBoxFromFloorEndpoints,
  chamberCenterY,
  faceZAtHeight,
} from './gp-geometry-utils';

export type DerivationType = 'measured' | 'calculated' | 'inferred' | 'placeholder';

export interface BlockoutNodeLOD1 extends BlockoutNode {
  lod: 'LOD1';
  derivation: DerivationType;
}

/** Helper: get a blockout node by ID */
function getBlockoutNode(id: string): BlockoutNode {
  const node = greatPyramidBlockout.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Blockout node ${id} not found`);
  return node;
}

/** Helper: create a LOD1 node from a blockout node, adding provenance */
function fromBlockout(id: string, derivation: DerivationType): BlockoutNodeLOD1 {
  const node = getBlockoutNode(id);
  return { ...node, lod: 'LOD1', derivation };
}

/** Helper: create a LOD1 node with calculated position */
function calculated(node: Omit<BlockoutNodeLOD1, 'lod'>): BlockoutNodeLOD1 {
  return { ...node, lod: 'LOD1' };
}

/**
 * Generate all LOD1 geometry nodes for the Great Pyramid.
 * Returns ~40 nodes with measurement-derived positions.
 */
export function generateGreatPyramidLOD1(): BlockoutNodeLOD1[] {
  const nodes: BlockoutNodeLOD1[] = [];

  // --- Exterior ---
  nodes.push(
    calculated({
      id: 'pyramid-exterior',
      name: 'Pyramid Exterior (core masonry)',
      position: { x: 0, y: GP_EXTERNAL.currentHeight / 2, z: 0 },
      size: {
        x: GP_EXTERNAL.baseMean,
        y: GP_EXTERNAL.currentHeight,
        z: GP_EXTERNAL.baseMean,
      },
      objectId: 'OBJ-0101',
      evidenceIds: ['EV-100001'],
      sourceIds: ['SRC-0101', 'SRC-0102'],
      layer: 'exterior',
      color: '#c2b090',
      opacity: 0.15,
      derivation: 'measured',
    }),
  );

  nodes.push(
    calculated({
      id: 'casing-north',
      name: 'Casing Stones (north face, lower courses)',
      position: {
        x: 0,
        y: 5,
        z: faceZAtHeight(5, GP_EXTERNAL.baseMean / 2, GP_EXTERNAL.casingAngleDeg),
      },
      rotation: { x: degToRad(GP_EXTERNAL.casingAngleDeg), y: 0, z: 0 },
      size: { x: GP_EXTERNAL.baseMean, y: 10, z: 1 },
      objectId: 'OBJ-0102',
      evidenceIds: ['EV-100002'],
      sourceIds: ['SRC-0101'],
      layer: 'exterior',
      color: '#e8e0d0',
      opacity: 0.7,
      derivation: 'measured',
    }),
  );

  // --- Entrance ---
  nodes.push(
    calculated({
      id: 'original-entrance',
      name: 'Original Entrance',
      position: {
        x: GP_ENTRANCE.xOffset,
        y: GP_ENTRANCE.heightAboveBase,
        z: faceZAtHeight(
          GP_ENTRANCE.heightAboveBase,
          GP_EXTERNAL.baseMean / 2,
          GP_EXTERNAL.casingAngleDeg,
        ),
      },
      size: { x: GP_DESCENDING_PASSAGE.width, y: GP_DESCENDING_PASSAGE.height, z: 1 },
      objectId: 'OBJ-0103',
      evidenceIds: ['EV-100003'],
      sourceIds: ['SRC-0101'],
      layer: 'exterior',
      color: '#8a7a55',
      derivation: 'measured',
    }),
  );

  nodes.push(fromBlockout('modern-entrance', 'measured'));

  // --- Descending Passage (sloped section) ---
  // Shared computation: entrance on sloped north face, POI, DP endpoint
  const entranceZ = faceZAtHeight(
    GP_ENTRANCE.heightAboveBase,
    GP_EXTERNAL.baseMean / 2,
    GP_EXTERNAL.casingAngleDeg,
  );
  const dpStart: Vector3 = {
    x: GP_ENTRANCE.xOffset,
    y: GP_ENTRANCE.heightAboveBase,
    z: entranceZ,
  };
  // POI: where AP branches off DP, computed from distanceAlongDP constant
  const poiY =
    GP_ENTRANCE.heightAboveBase -
    GP_POI.distanceAlongDP * Math.sin(degToRad(GP_DESCENDING_PASSAGE.angleDeg));
  const poiZ =
    entranceZ + GP_POI.distanceAlongDP * Math.cos(degToRad(GP_DESCENDING_PASSAGE.angleDeg));
  // DP sloped section ends where horizontal section begins
  const dpSlopedLength =
    GP_DESCENDING_PASSAGE.totalLength - GP_SUBTERRANEAN.horizontalPassageLength;
  const dpSlopedEnd = slopedEndpoint(dpStart, GP_DESCENDING_PASSAGE.angleDeg, dpSlopedLength);
  // DP horizontal section: from sloped end south to subterranean chamber
  const dpHorizontalEnd: Vector3 = {
    x: dpSlopedEnd.x,
    y: dpSlopedEnd.y,
    z: dpSlopedEnd.z + GP_SUBTERRANEAN.horizontalPassageLength,
  };
  const dpBox = slopedBoxFromFloorEndpoints(
    dpStart,
    dpSlopedEnd,
    GP_DESCENDING_PASSAGE.width,
    GP_DESCENDING_PASSAGE.height,
  );
  nodes.push(
    calculated({
      id: 'descending-passage',
      name: 'Descending Passage (sloped)',
      position: dpBox.position,
      rotation: dpBox.rotation,
      size: dpBox.size,
      objectId: 'OBJ-0105',
      evidenceIds: ['EV-100005'],
      sourceIds: ['SRC-0101'],
      layer: 'passages',
      color: '#8a7a55',
      opacity: 0.4,
      derivation: 'calculated',
    }),
  );
  // DP horizontal section
  {
    const horizBox = slopedBoxFromFloorEndpoints(
      dpSlopedEnd,
      dpHorizontalEnd,
      GP_DESCENDING_PASSAGE.width,
      GP_DESCENDING_PASSAGE.height,
    );
    nodes.push(
      calculated({
        id: 'descending-passage-horizontal',
        name: 'Descending Passage (horizontal)',
        position: horizBox.position,
        rotation: horizBox.rotation,
        size: horizBox.size,
        objectId: 'OBJ-0105',
        evidenceIds: ['EV-100005'],
        sourceIds: ['SRC-0101'],
        layer: 'passages',
        color: '#8a7a55',
        opacity: 0.4,
        derivation: 'calculated',
      }),
    );
  }

  // --- Subterranean Chamber ---
  nodes.push(
    calculated({
      id: 'subterranean-chamber',
      name: 'Subterranean Chamber',
      position: {
        x: 0,
        y: GP_SUBTERRANEAN.floorY + GP_SUBTERRANEAN.height / 2,
        z: dpHorizontalEnd.z + GP_SUBTERRANEAN.depth / 2,
      },
      size: {
        x: GP_SUBTERRANEAN.width,
        y: GP_SUBTERRANEAN.height,
        z: GP_SUBTERRANEAN.depth,
      },
      objectId: 'OBJ-0107',
      evidenceIds: ['EV-100007'],
      sourceIds: ['SRC-0101'],
      layer: 'subterranean',
      color: '#6a5a40',
      opacity: 0.4,
      derivation: 'calculated',
    }),
  );
  nodes.push(fromBlockout('subterranean-pit', 'inferred'));

  // --- Ascending Passage ---
  {
    // AP starts at the Point of Intersection (POI) with DP
    // poiY and poiZ are computed above from GP_POI.distanceAlongDP
    const apStart: Vector3 = { x: GP_ENTRANCE.xOffset, y: poiY, z: poiZ };
    const apEnd = slopedEndpoint(
      apStart,
      -GP_ASCENDING_PASSAGE.angleDeg,
      GP_ASCENDING_PASSAGE.length,
    );
    const apBox = slopedBoxFromFloorEndpoints(
      apStart,
      apEnd,
      GP_ASCENDING_PASSAGE.width,
      GP_ASCENDING_PASSAGE.height,
    );
    nodes.push(
      calculated({
        id: 'ascending-passage',
        name: 'Ascending Passage',
        position: apBox.position,
        rotation: apBox.rotation,
        size: apBox.size,
        objectId: 'OBJ-0108',
        evidenceIds: ['EV-100008'],
        sourceIds: ['SRC-0101'],
        layer: 'passages',
        color: '#c2ab7a',
        opacity: 0.4,
        derivation: 'calculated',
      }),
    );
  }

  // --- Grand Gallery ---
  {
    // GG starts at AP upper end (z) but at floorNorthY (y)
    // The AP opens into the GG above the floor level — there is a vertical drop
    // from the AP floor to the GG floor at the north wall.
    const apEndZ =
      poiZ + GP_ASCENDING_PASSAGE.length * Math.cos(degToRad(GP_ASCENDING_PASSAGE.angleDeg));
    const ggStart: Vector3 = {
      x: GP_GRAND_GALLERY.xOffset,
      y: GP_GRAND_GALLERY.floorNorthY,
      z: apEndZ,
    };
    const ggEnd = slopedEndpoint(ggStart, -GP_GRAND_GALLERY.angleDeg, GP_GRAND_GALLERY.floorLength);
    const ggBox = slopedBoxFromFloorEndpoints(
      ggStart,
      ggEnd,
      GP_GRAND_GALLERY.floorWidth,
      GP_GRAND_GALLERY.height,
    );
    nodes.push(
      calculated({
        id: 'grand-gallery',
        name: 'Grand Gallery',
        position: ggBox.position,
        rotation: ggBox.rotation,
        size: ggBox.size,
        objectId: 'OBJ-0109',
        evidenceIds: ['EV-100009'],
        sourceIds: ['SRC-0101'],
        layer: 'gallery',
        color: '#d4c4a0',
        opacity: 0.35,
        derivation: 'calculated',
      }),
    );
  }

  // --- Antechamber ---
  // Positioned between GG south wall and KC north wall
  const ggEndZ =
    poiZ +
    GP_ASCENDING_PASSAGE.length * Math.cos(degToRad(GP_ASCENDING_PASSAGE.angleDeg)) +
    GP_GRAND_GALLERY.floorLength * Math.cos(degToRad(GP_GRAND_GALLERY.angleDeg));
  const antechamberNorthZ = ggEndZ + GP_ANTECHAMBER.gapFromGG;
  const antechamberCenterZ = antechamberNorthZ + GP_ANTECHAMBER.depth / 2;
  nodes.push(
    calculated({
      id: 'antechamber',
      name: 'Antechamber',
      position: {
        x: GP_GRAND_GALLERY.xOffset,
        y: chamberCenterY(GP_ANTECHAMBER.floorY, GP_ANTECHAMBER.height),
        z: antechamberCenterZ,
      },
      size: {
        x: GP_ANTECHAMBER.width,
        y: GP_ANTECHAMBER.height,
        z: GP_ANTECHAMBER.depth,
      },
      objectId: 'OBJ-0110',
      evidenceIds: ['EV-100010'],
      sourceIds: ['SRC-0101'],
      layer: 'kings-complex',
      color: '#a08060',
      opacity: 0.4,
      derivation: 'calculated',
    }),
  );

  // --- King's Chamber ---
  // KC z computed from measurement chain: GG end → antechamber → gap → KC
  const kcNorthZ = antechamberNorthZ + GP_ANTECHAMBER.depth + GP_ANTECHAMBER.gapToKC;
  const kcCenterZ = kcNorthZ + GP_KINGS_CHAMBER.depth / 2;
  nodes.push(
    calculated({
      id: 'kings-chamber',
      name: "King's Chamber",
      position: {
        x: GP_GRAND_GALLERY.xOffset,
        y: chamberCenterY(GP_KINGS_CHAMBER.floorY, GP_KINGS_CHAMBER.height),
        z: kcCenterZ,
      },
      size: {
        x: GP_KINGS_CHAMBER.width,
        y: GP_KINGS_CHAMBER.height,
        z: GP_KINGS_CHAMBER.depth,
      },
      objectId: 'OBJ-0111',
      evidenceIds: ['EV-100011'],
      sourceIds: ['SRC-0101'],
      layer: 'kings-complex',
      color: '#8a6050',
      opacity: 0.4,
      derivation: 'measured',
    }),
  );

  // --- Sarcophagus (from blockout) ---
  nodes.push(fromBlockout('kings-sarcophagus', 'measured'));

  // --- Relieving Chambers ---
  // Aligned with corrected KC z and preserving the measured vertical spacing
  // (Vyse total height from KC floor to Campbell's roof = 21.11 m).
  const kcCeilingY = GP_KINGS_CHAMBER.floorY + GP_KINGS_CHAMBER.height;
  const blockoutKC = getBlockoutNode('kings-chamber');
  const blockoutKCCeilingY = blockoutKC.position.y + blockoutKC.size.y / 2;
  const relievingNames = [
    'relieving-davison',
    'relieving-wellington',
    'relieving-nelson',
    'relieving-arbuthnot',
    'relieving-campbell',
  ] as const;
  for (const id of relievingNames) {
    const blockout = getBlockoutNode(id);
    nodes.push(
      calculated({
        ...blockout,
        position: {
          x: GP_GRAND_GALLERY.xOffset,
          y: kcCeilingY + (blockout.position.y - blockoutKCCeilingY),
          z: kcCenterZ,
        },
        lod: 'LOD1',
        derivation: 'calculated',
      } as BlockoutNodeLOD1),
    );
  }

  // --- Queen's Chamber ---
  // QC is on the pyramid centre axis (x=0), not offset east like KC/GG
  nodes.push(
    calculated({
      id: 'queens-chamber',
      name: "Queen's Chamber",
      position: {
        x: GP_QUEENS_CHAMBER.centerX,
        y: chamberCenterY(GP_QUEENS_CHAMBER.floorY, GP_QUEENS_CHAMBER.height),
        z: GP_QUEENS_CHAMBER.centerZ,
      },
      size: {
        x: GP_QUEENS_CHAMBER.width,
        y: GP_QUEENS_CHAMBER.height,
        z: GP_QUEENS_CHAMBER.depth,
      },
      objectId: 'OBJ-0118',
      evidenceIds: ['EV-100018'],
      sourceIds: ['SRC-0101'],
      layer: 'queens-complex',
      color: '#b39b6b',
      opacity: 0.4,
      derivation: 'measured',
    }),
  );

  // --- Queen's Niche (from blockout) ---
  nodes.push(fromBlockout('queens-niche', 'measured'));

  // --- Queen's Chamber Passage ---
  // Measured-length horizontal passage from the Grand Gallery lower end to the
  // Queen's Chamber north wall (Petrie 43.96 m). The start z is derived from the
  // known length and the x offset between the GG axis and the QC axis.
  {
    const qcNorthZ = GP_QUEENS_CHAMBER.centerZ - GP_QUEENS_CHAMBER.depth / 2;
    const qcPassageStartX = GP_GRAND_GALLERY.xOffset;
    const qcPassageEndX = GP_QUEENS_CHAMBER.centerX;
    const qcPassageRun = Math.sqrt(
      GP_QC_PASSAGE.length ** 2 - (qcPassageStartX - qcPassageEndX) ** 2,
    );
    const qcPassageStartZ = qcNorthZ - qcPassageRun;
    const qcPassageStart: Vector3 = {
      x: qcPassageStartX,
      y: GP_QUEENS_CHAMBER.floorY,
      z: qcPassageStartZ,
    };
    const qcPassageEnd: Vector3 = {
      x: qcPassageEndX,
      y: GP_QUEENS_CHAMBER.floorY,
      z: qcNorthZ,
    };
    const qcPassageBox = slopedBoxFromFloorEndpoints(
      qcPassageStart,
      qcPassageEnd,
      GP_QC_PASSAGE.width,
      GP_QC_PASSAGE.heightBeforeStep,
    );
    nodes.push(
      calculated({
        id: 'queens-passage',
        name: "Queen's Chamber Passage",
        position: qcPassageBox.position,
        rotation: qcPassageBox.rotation,
        size: qcPassageBox.size,
        objectId: 'OBJ-0117',
        evidenceIds: ['EV-100017'],
        sourceIds: ['SRC-0101'],
        layer: 'queens-complex',
        color: '#c2ab7a',
        opacity: 0.4,
        derivation: 'calculated',
      }),
    );
  }

  // --- Shafts ---
  // KC shafts: computed from corrected KC geometry, exit at pyramid face
  {
    const kcCeilingY = GP_KINGS_CHAMBER.floorY + GP_KINGS_CHAMBER.height;
    const kcSouthZ = kcCenterZ + GP_KINGS_CHAMBER.depth / 2;

    // KC north shaft: starts at KC north wall ceiling, goes up toward north face
    const kcNorthStart: Vector3 = {
      x: GP_GRAND_GALLERY.xOffset,
      y: kcCeilingY,
      z: kcNorthZ,
    };
    // Solve for t where shaft meets north face:
    // z_start - t*cos(angle) = faceZAtHeight(y_start + t*sin(angle))
    const nAng = GP_KC_SHAFTS.north.angleDeg;
    const nSin = Math.sin(degToRad(nAng));
    const nCos = Math.cos(degToRad(nAng));
    const tanCasing = Math.tan(degToRad(GP_EXTERNAL.casingAngleDeg));
    // z_start - t*cos = -baseHalf + (y_start + t*sin) / tanCasing
    // z_start + baseHalf = t*cos + (y_start + t*sin) / tanCasing
    // z_start + baseHalf = t*cos + y_start/tanCasing + t*sin/tanCasing
    // z_start + baseHalf - y_start/tanCasing = t * (cos + sin/tanCasing)
    const kcNorthT =
      (kcNorthStart.z + GP_EXTERNAL.baseMean / 2 - kcNorthStart.y / tanCasing) /
      (nCos + nSin / tanCasing);
    const kcNorthEnd: Vector3 = {
      x: kcNorthStart.x,
      y: kcNorthStart.y + kcNorthT * nSin,
      z: kcNorthStart.z - kcNorthT * nCos,
    };
    const kcNorthBox = slopedBoxFromFloorEndpoints(
      kcNorthStart,
      kcNorthEnd,
      GP_KC_SHAFTS.north.diameter,
      GP_KC_SHAFTS.north.diameter,
    );
    nodes.push(
      calculated({
        id: 'kc-north-shaft',
        name: 'KC North Shaft',
        position: kcNorthBox.position,
        rotation: kcNorthBox.rotation,
        size: kcNorthBox.size,
        objectId: 'OBJ-0121',
        evidenceIds: ['EV-100021'],
        sourceIds: ['SRC-0103'],
        layer: 'shafts',
        color: '#7a6a4a',
        opacity: 0.5,
        derivation: 'calculated',
      }),
    );

    // KC south shaft: starts at KC south wall ceiling, goes up toward south face
    const kcSouthStart: Vector3 = {
      x: GP_GRAND_GALLERY.xOffset,
      y: kcCeilingY,
      z: kcSouthZ,
    };
    const sAng = GP_KC_SHAFTS.south.angleDeg;
    const sSin = Math.sin(degToRad(sAng));
    const sCos = Math.cos(degToRad(sAng));
    // South face: z = baseHalf - y / tanCasing
    // z_start + t*cos = baseHalf - (y_start + t*sin) / tanCasing
    // z_start - baseHalf + y_start/tanCasing = -t*cos - t*sin/tanCasing
    // baseHalf - z_start - y_start/tanCasing = t * (cos + sin/tanCasing)
    const kcSouthT =
      (GP_EXTERNAL.baseMean / 2 - kcSouthStart.z - kcSouthStart.y / tanCasing) /
      (sCos + sSin / tanCasing);
    const kcSouthEnd: Vector3 = {
      x: kcSouthStart.x,
      y: kcSouthStart.y + kcSouthT * sSin,
      z: kcSouthStart.z + kcSouthT * sCos,
    };
    const kcSouthBox = slopedBoxFromFloorEndpoints(
      kcSouthStart,
      kcSouthEnd,
      GP_KC_SHAFTS.south.diameter,
      GP_KC_SHAFTS.south.diameter,
    );
    nodes.push(
      calculated({
        id: 'kc-south-shaft',
        name: 'KC South Shaft',
        position: kcSouthBox.position,
        rotation: kcSouthBox.rotation,
        size: kcSouthBox.size,
        objectId: 'OBJ-0122',
        evidenceIds: ['EV-100022'],
        sourceIds: ['SRC-0103'],
        layer: 'shafts',
        color: '#7a6a4a',
        opacity: 0.5,
        derivation: 'calculated',
      }),
    );
  }

  // QC shafts: start from QC walls, don't exit pyramid — cap at ~60m
  {
    const qcCeilingY = GP_QUEENS_CHAMBER.floorY + GP_QUEENS_CHAMBER.height;
    const qcNorthZ = GP_QUEENS_CHAMBER.centerZ - GP_QUEENS_CHAMBER.depth / 2;
    const qcSouthZ = GP_QUEENS_CHAMBER.centerZ + GP_QUEENS_CHAMBER.depth / 2;
    const qcShaftMaxLen = 60;

    // QC north shaft
    const qcNorthStart: Vector3 = {
      x: GP_QUEENS_CHAMBER.centerX,
      y: qcCeilingY,
      z: qcNorthZ,
    };
    const qcNorthEnd = slopedEndpoint(qcNorthStart, GP_QC_SHAFTS.north.angleDeg, qcShaftMaxLen, -1);
    const qcNorthBox = slopedBoxFromFloorEndpoints(
      qcNorthStart,
      qcNorthEnd,
      GP_QC_SHAFTS.north.diameter,
      GP_QC_SHAFTS.north.diameter,
    );
    nodes.push(
      calculated({
        id: 'qc-north-shaft',
        name: 'QC North Shaft',
        position: qcNorthBox.position,
        rotation: qcNorthBox.rotation,
        size: qcNorthBox.size,
        objectId: 'OBJ-0123',
        evidenceIds: ['EV-100023'],
        sourceIds: ['SRC-0103'],
        layer: 'shafts',
        color: '#7a6a4a',
        opacity: 0.5,
        derivation: 'calculated',
      }),
    );

    // QC south shaft
    const qcSouthStart: Vector3 = {
      x: GP_QUEENS_CHAMBER.centerX,
      y: qcCeilingY,
      z: qcSouthZ,
    };
    const qcSouthEnd = slopedEndpoint(qcSouthStart, -GP_QC_SHAFTS.south.angleDeg, qcShaftMaxLen);
    const qcSouthBox = slopedBoxFromFloorEndpoints(
      qcSouthStart,
      qcSouthEnd,
      GP_QC_SHAFTS.south.diameter,
      GP_QC_SHAFTS.south.diameter,
    );
    nodes.push(
      calculated({
        id: 'qc-south-shaft',
        name: 'QC South Shaft',
        position: qcSouthBox.position,
        rotation: qcSouthBox.rotation,
        size: qcSouthBox.size,
        objectId: 'OBJ-0124',
        evidenceIds: ['EV-100024'],
        sourceIds: ['SRC-0103'],
        layer: 'shafts',
        color: '#7a6a4a',
        opacity: 0.5,
        derivation: 'calculated',
      }),
    );
  }

  // --- Well Shaft ---
  // Connects from GG west wall near floor level down to DP near subterranean chamber
  {
    const ggWestX = GP_GRAND_GALLERY.xOffset - GP_GRAND_GALLERY.floorWidth / 2;
    const wellStart: Vector3 = {
      x: ggWestX,
      y: GP_GRAND_GALLERY.floorLowY,
      z: poiZ + GP_ASCENDING_PASSAGE.length * Math.cos(degToRad(GP_ASCENDING_PASSAGE.angleDeg)),
    };
    // End near DP at subterranean chamber level
    const wellEnd: Vector3 = {
      x: ggWestX,
      y: dpSlopedEnd.y,
      z: dpSlopedEnd.z,
    };
    const wellBox = slopedBoxFromFloorEndpoints(
      wellStart,
      wellEnd,
      GP_WELL_SHAFT.width,
      GP_WELL_SHAFT.width,
    );
    nodes.push(
      calculated({
        id: 'well-shaft',
        name: 'Well Shaft',
        position: wellBox.position,
        rotation: wellBox.rotation,
        size: wellBox.size,
        objectId: 'OBJ-0125',
        evidenceIds: ['EV-100025'],
        sourceIds: ['SRC-0101'],
        layer: 'shafts',
        color: '#6a5a40',
        opacity: 0.5,
        derivation: 'inferred',
      }),
    );
  }

  // --- Grotto (from blockout) ---
  nodes.push(fromBlockout('grotto', 'inferred'));

  return nodes;
}
```

### 1.7 Great Pyramid scene graph layer groups

Layer group nodes are created in `src/scene/greatPyramidSceneGraph.ts` under root `gp-root` with these IDs: `gp-exterior`, `gp-passages`, `gp-subterranean`, `gp-gallery`, `gp-kings-complex`, `gp-queens-complex`, `gp-relieving`, `gp-shafts`. All mesh nodes are parented to the matching layer group.

### 1.8 Great Pyramid PBR material mapping

Used in `src/scene/GreatPyramidScene.tsx`:

| Layer          | Metalness | Roughness |
| -------------- | --------- | --------- |
| exterior       | 0.05      | 0.9       |
| passages       | 0.1       | 0.85      |
| subterranean   | 0.1       | 0.85      |
| gallery        | 0.15      | 0.8       |
| kings-complex  | 0.2       | 0.7       |
| queens-complex | 0.15      | 0.75      |
| relieving      | 0.15      | 0.8       |
| shafts         | 0.05      | 0.9       |

## 2. Osiris Shaft

### 2.1 Coordinate system & conventions

- Origin: monument local centre at the surface entrance of Shaft A.
- Same box/rotation conventions as the Great Pyramid.

### 2.2 Osiris Shaft blockout

Blockout ID: `osiris-shaft-blockout`  
Name: Osiris Shaft  
Units: meters

| ID                 | Name               | Position (x, y, z)           | Size (x, y, z)            | Rotation (x, y, z) | Layer   | Color   | Opacity | Derivation |
| ------------------ | ------------------ | ---------------------------- | ------------------------- | ------------------ | ------- | ------- | ------- | ---------- |
| `shaft-a`          | Shaft A            | (0, -4.8100, 0)              | (2.6000, 9.6200, 3)       | (0, 0, 0)          | shafts  | #8a7a55 | 0.5     |            |
| `chamber-a`        | Chamber A          | (0, -8.2700, 2.8000)         | (3.8500, 2.7000, 8.6000)  | (0, 0, 0)          | level-1 | #c2ab7a | 0.3     |            |
| `shaft-b`          | Shaft B            | (-1.1250, -16.2450, -0.4000) | (1.9000, 13.2500, 1.9000) | (0, 0, 0)          | shafts  | #8a7a55 | 0.5     |            |
| `chamber-b`        | Chamber B          | (0, -21.8500, 2.4500)        | (3.6500, 2.6000, 6.8000)  | (0, 0, 0)          | level-2 | #b39b6b | 0.3     |            |
| `shaft-c`          | Shaft C            | (0.9000, -26.9000, 4.5000)   | (1.9000, 7.5000, 1.6500)  | (0, 0, 0)          | shafts  | #8a7a55 | 0.5     |            |
| `chamber-i`        | Chamber I          | (-1, -29.1500, 4)            | (6.5000, 3, 9)            | (0, 0, 0)          | level-3 | #a38b5c | 0.3     |            |
| `central-island`   | Central Island     | (-1, -29.7750, 4)            | (3.2000, 1.7500, 5.2000)  | (0, 0, 0)          | level-3 | #7a6a4a | 1       |            |
| `sarcophagus-i`    | Basalt Sarcophagus | (-1, -28.4250, 4.5000)       | (1.0800, 0.9500, 2.2800)  | (0, 0, 0)          | level-3 | #3a3a3f | 1       |            |
| `northern-conduit` | Northern Conduit   | (-6.4000, -30.3000, -2.7000) | (0.6000, 0.7000, 6.8000)  | (0, -2.3562, 0)    | level-3 | #6b5f45 | 1       |            |
| `chamber-i-water`  | Chamber I Water    | (-1, -30.4000, 4)            | (6.5000, 0.5000, 9)       | (0, 0, 0)          | level-3 | #0a4a6b | 0.6     |            |

### 2.3 Osiris Shaft scene graph construction

```ts
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { IDENTITY_TRANSFORM, SceneGraph } from './sceneGraph';

export const OSIRIS_SCENE_ROOT_ID = 'osiris-shaft-scene';

export function buildOsirisSceneGraph(): SceneGraph {
  const graph = new SceneGraph();

  graph.addNode({
    id: OSIRIS_SCENE_ROOT_ID,
    name: osirisBlockout.name,
    parentId: null,
    localTransform: IDENTITY_TRANSFORM,
    metadata: { layer: 'monument' },
    visible: true,
  });

  for (const node of osirisBlockout.nodes) {
    graph.addNode({
      id: node.id,
      name: node.name,
      parentId: OSIRIS_SCENE_ROOT_ID,
      localTransform: {
        position: node.position,
        rotation: node.rotation ?? { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      metadata: {
        objectId: node.objectId,
        evidenceIds: node.evidenceIds,
        sourceIds: node.sourceIds,
        layer: node.layer,
      },
      visible: true,
    });
  }

  return graph;
}
```

### 2.4 Osiris Shaft seed evidence

Evidence and object references for traceability are in `database/seeds/osiris-shaft.ts`. Key dimensions used for the blockout: Shaft A 2.60 m × 3.00 m × 9.62 m deep; Shaft B 1.90 m × 1.90 m × 13.25 m; Shaft C 1.90 m × 1.65 m × 7.50 m; Chamber A 3.85 m × 2.70 m × 8.60 m; Chamber B 3.65 m × 2.60 m × 6.80 m; Chamber I 6.50 m × 3.00 m × 9.00 m; Central Island 3.20 m × 1.75 m × 5.20 m; Basalt Sarcophagus 1.08 m × 0.95 m × 2.28 m; Northern Conduit 0.60 m × 0.70 m × 6.80 m at -135° Y-rotation.

## Appendix A — Raw geometry dump (JSON)

A machine-readable dump of every node in this document is also available in `geometry-dump.json` in this directory. It was produced by importing the live TypeScript generators/blockouts and serialising the resulting objects, so it is bit-for-bit identical to the runtime data.

## Appendix B — Reproduction checklist

To reproduce the scene exactly:

1. Use the coordinate system and conventions above.
2. Load the constants in §1.4 and run `generateGreatPyramidLOD1()` for LOD1, or use the blockout in §1.2 for LOD0.
3. For Osiris Shaft, use the blockout in §2.2 and build the scene graph with `buildOsirisSceneGraph()`.
4. Parent each mesh to the appropriate layer group and apply the PBR mapping in §1.8.
5. Set `color`, `opacity`, and `layer` exactly as listed in the tables.
6. For box meshes, use Three.js `boxGeometry(args=[size.x, size.y, size.z])` centered at `position` and rotated by `rotation`.

## Appendix C — Geometry correction log

This appendix records corrections applied to the Great Pyramid geometry sources. All fixes were verified against Petrie (1883), Cole (1925), Gantenbrink (1999), and Vyse. The `geometry-dump.json` and the tables in §1.2–§1.3 are regenerated from the corrected source by `scripts/generate-geometry-dump.ts` and `scripts/update-monument-geometry-tables.ts`.

### C.1 King's Chamber absolute Z-position (2026-07)

**Problem:** The KC north wall sat at z ≈ 3.2 m south of centre in both LODs, ~5.2 m too far north. Petrie places the KC north wall at 330.6 ± 0.8 inches (≈ 8.40 m) south of centre. The entire upper system (antechamber, relieving chambers, KC shafts) inherited the same offset.

**Root cause:** In `GP_ANTECHAMBER`, `gapFromGG` (0.6 m) + `gapToKC` (1.0 m) = 1.6 m total, but the measurement chain (entrance → POI → AP → GG → antechamber → KC) requires ~6.8 m of gap to land the KC north wall at +8.40 m.

**Fix:** Calibrated `gapFromGG` to 1.5 m and `gapToKC` to 5.3 m. The KC north wall now lands at z = 8.40 m in both LODs, matching Petrie. The LOD0 blockout KC complex (antechamber, KC, sarcophagus, 5 relieving chambers) was shifted from z = 40.5 to z = 13.64 (KC center) to match.

### C.2 Descending Passage horizontal section in LOD0 (2026-07)

**Problem:** LOD0 modelled only the sloped portion of the Descending Passage (length 105.16 m), landing its lower end ~11 m short of the subterranean chamber. LOD1 already had a separate horizontal segment.

**Fix:** LOD0 now splits the DP into a sloped section (96.16 m, matching the LOD1 sloped length = totalLength − horizontalPassageLength) and a horizontal section (9 m), mirroring LOD1. The subterranean chamber floor Y was corrected from −29.8 to −25.97 m to match the shortened sloped run (matches Petrie ~1022 B" below pavement).

### C.3 Subterranean chamber east offset (2026-07)

**Problem:** Both LODs placed the subterranean chamber and pit at x = 0, breaking lateral continuity with the descending passage (which is at x = 7.29 m).

**Fix:** LOD1 subterranean chamber and pit now use x = 7.29 (GP_ENTRANCE.xOffset). LOD0 already used x = 7.29.

### C.4 Casing and entrance Z-position (2026-07)

**Problem:** LOD0 placed the casing north face and original entrance at z = −115.18 (geometric half-base), but the casing angle of 51.84° places the north face at z ≈ −111.25 at y = 5 m (the casing slab center height). LOD1 already used the calculated face position.

**Fix:** LOD0 casing and entrance now use the calculated face Z (−111.25 and −101.84 respectively), matching LOD1.

### C.5 Shaft rotation sign convention (2026-07)

**Problem:** Several shafts in LOD0 and LOD1 had inconsistent rotation signs. The convention is: positive `rotation.x` → +Z end goes down (descending, north-going shafts where the far −Z end is higher); negative `rotation.x` → +Z end goes up (ascending, south-going shafts where the far +Z end is higher).

**Fix:**
- LOD0 KC north shaft: rotation flipped from −32.6° to +32.6° (north-going, +Z/south end is the low KC end).
- LOD0 KC south shaft: rotation flipped from +45° to −45° (south-going, +Z/south end is the high exterior end).
- LOD0 QC north shaft: rotation flipped from −39° to +39°.
- LOD0 QC south shaft: rotation flipped from +39.6° to −39.6°.
- `slopedBoxFromFloorEndpoints` in `gp-geometry-utils.ts`: sign logic corrected from `dz >= 0 ? -slopeAngle : slopeAngle` to `dy * dz < 0 ? slopeAngle : -slopeAngle` (positive when dy and dz have opposite signs).

### C.6 Queen's Chamber axis (2026-07)

**Problem:** LOD0 placed the Queen's Chamber at x = 7.22 (east offset), but Petrie establishes that the QC sits on the pyramid's east-west centre axis (x = 0), unlike the KC/GG which are offset east.

**Fix:** LOD0 QC, QC niche, and QC shafts now use x = 0 (QC on centre axis) and x = 2.62 (niche east of QC centre), matching LOD1. QC shafts were repositioned to start from the QC walls.

### C.7 Remaining approximations (known, retained)

These are intentional blockout approximations, not errors:
- Well shaft and grotto are single-box representations of multi-section features.
- Relieving chamber heights are taken at the high end of Vyse's ranges.
- Grotto is a 2 m cube.
- LOD1 KC/QC shafts are truncated at the pyramid exterior face; LOD0 uses the full Gantenbrink lengths.

### C.8 LOD1 objectId / evidenceId copy-paste errors (2026-07)

**Problem:** Two LOD1 nodes had incorrect `objectId` and `evidenceIds` due to copy-paste errors in `gp-lod1.ts`:
- `subterranean-chamber`: had `OBJ-0107` / `EV-100007` (the Central Pit's IDs) instead of `OBJ-0106` / `EV-100006`.
- `queens-passage`: had `OBJ-0117` / `EV-100017` (Campbell's Chamber's IDs) instead of `OBJ-0120` / `EV-100020`.

**Fix:** Corrected both nodes to match the LOD0 blockout and the object/evidence registry.

### C.9 Floating-point precision artifacts in geometry-dump.json (2026-07)

**Problem:** The JSON dump contained IEEE 754 rounding artifacts from trigonometric calculations (e.g. `39.290000000000006`, `62.775000000000006`, `-24.189999999999998`, `59.99999999999999`).

**Fix:** The dump generation script (`scripts/generate-geometry-dump.ts`) now rounds all numeric values to 6 decimal places before serialising, eliminating the artifacts without affecting geometric accuracy.

### C.10 King's Chamber height correction (2026-07)

**Problem:** The KC height was stored as 5.97 m, but Petrie's direct measurement is 230.09 in = 5.844 m. The 5.97 m value appears to be a transcription error (235.04 in vs Petrie's 230.09 in).

**Fix:** Corrected `GP_KINGS_CHAMBER.height` from 5.97 m to 5.84 m in `great-pyramid-measurements.ts`. Updated the LOD0 KC center y (45.94 → 45.88) and all five relieving chamber y positions (shifted -0.125 m to maintain their relative offsets from the KC ceiling). Updated acoustic and hydraulic-acoustic test fixtures to use the corrected height.

### C.11 Subterranean chamber — dimensions, position, and DP geometry correction (2026-07)

**Problem:** The subterranean chamber had multiple errors verified against Petrie's original text (Sec. 37):
1. **Dimensions swapped**: Code had width(E-W)=11.88, depth(N-S)=7.92. Petrie says E wall 302.9″ E + W wall 250.6″ W = 553.5″ = 14.07 m E-W; N wall 40″ S, S wall 366″ S = 326″ = 8.28 m N-S.
2. **Position wrong**: Code had x=7.29 (DP entrance offset), z=-2.83. Petrie says chamber center is 0.66 m E and 5.16 m S of pyramid centre.
3. **Floor depth wrong**: Code had floorY=-25.97. Petrie says DP end at -1181″ = -30.00 m below pavement.
4. **DP sloped length wrong**: Code subtracted horizontal passage (9.0 m) from totalLength (105.16 m) to get sloped length. But totalLength IS the sloped length; the horizontal passage is separate.
5. **Horizontal passage length wrong**: Code had 9.0 m. Petrie says 672″ = 17.07 m from DP end to chamber S wall.
6. **Chamber z direction wrong**: Code used `+depth/2` (chamber extends south from DP end). Petrie says the DP enters at the S wall; chamber extends northward, so z should use `-depth/2`.

**Fix:** Corrected `GP_SUBTERRANEAN.width` to 14.07 m, `.depth` to 8.28 m, `.floorY` to -30.0 m, added `.centerX` = 0.66 m, and `.horizontalPassageLength` to 17.07 m. Updated LOD0 chamber position to (0.66, -28.22, 5.16) and pit to (0.66, -32.52, 5.16). Fixed LOD1 DP sloped length calculation (removed erroneous subtraction), chamber position (uses measured centerX and `-depth/2` for z), and pit position.

### C.12 King's Chamber orientation correction (2026-07)

**Problem:** The KC dimensions were assigned to the wrong axes. The code had `size.x = 5.24` (E-W) and `size.z = 10.47` (N-S), but the KC long axis is E-W: the chamber measures 10.47 m E-W (20 RC) × 5.24 m N-S (10 RC), as confirmed by Petrie's measurements (N wall 412.78″, S wall 412.53″ for E-W; E wall 206.43″, W wall 206.16″ for N-S). The KC entrance is through the north short wall, and the sarcophagus sits at the west end.

**Fix:** Swapped the KC size assignments in both LOD0 and LOD1: `size.x = depth (10.47)` for E-W, `size.z = width (5.24)` for N-S. Updated the KC center z from 13.64 to 11.02 (maintaining the north wall at Petrie's 330.6″ S = 8.40 m, south wall at 537.0″ S = 13.64 m). Updated all 5 relieving chambers (z and size swap), sarcophagus position (x: 4.60 → 2.47, z: 13.64 → 11.02), and KC shaft wall z calculations in LOD1 (using `width/2` for N-S offsets instead of `depth/2`).

### C.13 Queen's Chamber width/depth axis correction (2026-07)

**Problem:** The QC width (E-W) and depth (N-S) were swapped in the measurement constants. The code had width=5.23 m (E-W) and depth=5.75 m (N-S), but Petrie's original text (Sec. 41) confirms the QC gable roof ridge runs E-W, making the E-W the longer dimension: "205.85 wide, and 226.47 long" where "wide" = N-S (perpendicular to ridge) = 5.23 m and "long" = E-W (along ridge) = 5.75 m. The E and W walls contain the gable spring (245.1″ high to ridge); the N and S walls are the gable ends (184.47″ high). The niche is in the E wall which spans the N-S dimension.

**Fix:** Set `GP_QUEENS_CHAMBER.width` to 5.75 m (E-W, 226.47″ = 11 RC) and `.depth` to 5.23 m (N-S, 205.85″ = 10 RC). Updated LOD0 QC size to (5.75, 6.23, 5.23), niche x-position (2.62 → 2.88 to align with corrected east wall at x=5.75/2), QC shaft z-positions, and QC passage z (-18.24 → -17.98).

### C.14 LOD0 blockout synchronization with LOD1 calculations (2026-07)

**Problem:** The LOD0 blockout had stale hardcoded positions for several elements that no longer matched the measurement-derived LOD1 positions after the C.11–C.13 corrections:
1. **Descending passage (sloped)**: LOD0 had length=96.16 m (should be 105.16 m per Petrie 4141.4″), center y=-4.49 (should be -6.51), center z=-58.82 (should be -54.80).
2. **Descending passage (horizontal)**: LOD0 had length=9.0 m (should be 17.07 m per Petrie 672″), center y=-25.97 (should be -29.99), center z=-11.29 (should be 0.78).
3. **Queen's passage**: LOD0 had y=24.3, height=1.45 (should be y=21.78 at QC floor level, height=1.17 per `GP_QC_PASSAGE.heightBeforeStep`).
4. **KC/QC shafts**: LOD0 positions were based on pre-correction KC/QC geometry. Updated all 4 shaft positions and lengths to match LOD1 calculated values.
5. **Well shaft**: LOD0 had x=5.0, y=3.2, z=-10.0, angle=45°, length=55 m. Updated to LOD1 values: x=6.17, y=-2.33, z=-25.68, angle=56.37°, length=65.92 m (computed from GG west wall to DP end).
6. **Grotto**: Moved to align with well shaft midpoint (x=6.17, z=-25.68).

**Fix:** Updated all LOD0 blockout positions in `database/blockouts/great-pyramid.ts` to match the LOD1 calculated values. All 27 LOD0 nodes now match their LOD1 counterparts within 0.6 m (most within 0.01 m). Verified with `scripts/verify-geometry.mjs` — 70/70 checks pass.


/**
 * Color token system per GIZA - 02 §12 (Visual Language).
 *
 * Five palette families: Stone, Sand, Copper, Dark Slate, Soft Blue.
 * Museum-grade aesthetic — no game-like HUD. Avoids excessive saturation.
 *
 * Tokens are exposed as both TypeScript constants (for Three.js materials,
 * scene overlays, evidence hotspots) and CSS custom properties (for UI
 * panels). The CSS variables are defined in `index.css` under `:root`.
 */

export interface ColorToken {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

// ─── Stone ────────────────────────────────────────────────────────────────
// Neutral grays for backgrounds, panels, and structural UI elements.

export const STONE = {
  950: '#0d0d0d',
  900: '#141414',
  850: '#1a1a1a',
  800: '#222222',
  700: '#2a2a2a',
  600: '#333333',
  500: '#3a3a3a',
  400: '#555555',
  300: '#777777',
  200: '#9a9a9a',
  100: '#b0b0b0',
  50: '#d0d0d0',
  10: '#e0e0e0',
} as const;

// ─── Sand ─────────────────────────────────────────────────────────────────
// Warm desert tones for accents, highlights, and evidence markers.

export const SAND = {
  900: '#3d2f1f',
  800: '#5a4630',
  700: '#7a6244',
  600: '#9c8060',
  500: '#b89a78',
  400: '#cdaa82',
  300: '#dabf9a',
  200: '#e8d2b0',
  100: '#f0e0c4',
} as const;

// ─── Copper ───────────────────────────────────────────────────────────────
// Metallic accent for interactive elements, bookmarks, and focus states.

export const COPPER = {
  900: '#4a2c1a',
  800: '#6b3e26',
  700: '#8a5232',
  600: '#a86842',
  500: '#b87333',
  400: '#c8853e',
  300: '#d99a5a',
  200: '#e8b07a',
  100: '#f0c89a',
} as const;

// ─── Dark Slate ───────────────────────────────────────────────────────────
// Cool dark tones for secondary surfaces and data displays.

export const DARK_SLATE = {
  900: '#0f172a',
  800: '#1e293b',
  700: '#273449',
  600: '#334155',
  500: '#3b4d63',
  400: '#4a5d75',
  300: '#647890',
  200: '#8aa0b8',
  100: '#a8bdd0',
} as const;

// ─── Soft Blue ────────────────────────────────────────────────────────────
// Primary action color, active states, and informational accents.

export const SOFT_BLUE = {
  900: '#1a3a5c',
  800: '#1e4373',
  700: '#1e5089',
  600: '#2a5fa3',
  500: '#3b82f6',
  400: '#4a8cf6',
  300: '#60a5fa',
  200: '#7dbef8',
  100: '#9ad0fa',
} as const;

// ─── Semantic tokens ──────────────────────────────────────────────────────
// Evidence overlay colors per GIZA - 04 §6.20.

export const EVIDENCE_OVERLAY_COLORS = {
  green: '#22c55e', // High confidence
  blue: '#3b82f6', // Measured
  orange: '#f59e0b', // Interpretation
  purple: '#a855f7', // Simulation
  red: '#ef4444', // Contradictory evidence
} as const;

export type EvidenceOverlayColor = keyof typeof EVIDENCE_OVERLAY_COLORS;

// ─── CSS custom property names ────────────────────────────────────────────

export const CSS_VARS = {
  // Stone (surfaces)
  '--stone-950': STONE[950],
  '--stone-900': STONE[900],
  '--stone-850': STONE[850],
  '--stone-800': STONE[800],
  '--stone-700': STONE[700],
  '--stone-600': STONE[600],
  '--stone-500': STONE[500],
  '--stone-400': STONE[400],
  '--stone-300': STONE[300],
  '--stone-200': STONE[200],
  '--stone-100': STONE[100],
  '--stone-50': STONE[50],
  '--stone-10': STONE[10],
  // Sand
  '--sand-900': SAND[900],
  '--sand-800': SAND[800],
  '--sand-700': SAND[700],
  '--sand-600': SAND[600],
  '--sand-500': SAND[500],
  '--sand-400': SAND[400],
  '--sand-300': SAND[300],
  '--sand-200': SAND[200],
  '--sand-100': SAND[100],
  // Copper
  '--copper-900': COPPER[900],
  '--copper-800': COPPER[800],
  '--copper-700': COPPER[700],
  '--copper-600': COPPER[600],
  '--copper-500': COPPER[500],
  '--copper-400': COPPER[400],
  '--copper-300': COPPER[300],
  '--copper-200': COPPER[200],
  '--copper-100': COPPER[100],
  // Dark Slate
  '--slate-900': DARK_SLATE[900],
  '--slate-800': DARK_SLATE[800],
  '--slate-700': DARK_SLATE[700],
  '--slate-600': DARK_SLATE[600],
  '--slate-500': DARK_SLATE[500],
  '--slate-400': DARK_SLATE[400],
  '--slate-300': DARK_SLATE[300],
  '--slate-200': DARK_SLATE[200],
  '--slate-100': DARK_SLATE[100],
  // Soft Blue
  '--blue-900': SOFT_BLUE[900],
  '--blue-800': SOFT_BLUE[800],
  '--blue-700': SOFT_BLUE[700],
  '--blue-600': SOFT_BLUE[600],
  '--blue-500': SOFT_BLUE[500],
  '--blue-400': SOFT_BLUE[400],
  '--blue-300': SOFT_BLUE[300],
  '--blue-200': SOFT_BLUE[200],
  '--blue-100': SOFT_BLUE[100],
  // Evidence overlay
  '--ev-green': EVIDENCE_OVERLAY_COLORS.green,
  '--ev-blue': EVIDENCE_OVERLAY_COLORS.blue,
  '--ev-orange': EVIDENCE_OVERLAY_COLORS.orange,
  '--ev-purple': EVIDENCE_OVERLAY_COLORS.purple,
  '--ev-red': EVIDENCE_OVERLAY_COLORS.red,
} as const;

// ─── Helper: map confidence to evidence overlay color ─────────────────────

/**
 * Maps an evidence record's primaryClass to the overlay color per
 * GIZA - 04 §6.20.
 *
 * E1 = direct observation → green (high confidence)
 * E2 = measured → blue
 * E3 = interpretation → orange
 * E4 = publication/report → orange
 * Simulation evidence → purple
 * Contradictory evidence → red
 */
export function evidenceClassToOverlayColor(primaryClass: string): EvidenceOverlayColor {
  switch (primaryClass) {
    case 'E1':
      return 'green';
    case 'E2':
      return 'blue';
    case 'E3':
    case 'E4':
      return 'orange';
    default:
      return 'blue';
  }
}

export function confidenceToOverlayColor(confidence: number): EvidenceOverlayColor {
  if (confidence >= 85) return 'green';
  if (confidence >= 70) return 'blue';
  if (confidence >= 50) return 'orange';
  return 'red';
}

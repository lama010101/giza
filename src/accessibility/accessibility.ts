/**
 * Accessibility system per M12-T01.
 *
 * 4 accessibility features:
 *   1. Keyboard navigation (tab order, shortcuts, focus management)
 *   2. Screen reader support (ARIA labels, live regions)
 *   3. High contrast mode
 *   4. Colorblind-friendly palette (4 types: protanopia, deuteranopia,
 *      tritanopia, achromatopsia)
 *
 * All settings persist across sessions.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ColorblindType =
  | 'none'
  | 'protanopia' // red-blind
  | 'deuteranopia' // green-blind
  | 'tritanopia' // blue-blind
  | 'achromatopsia'; // total color blindness

export interface AccessibilitySettings {
  /** High contrast mode for low-vision users */
  highContrast: boolean;
  /** Colorblind-friendly palette */
  colorblindType: ColorblindType;
  /** Reduced motion (disables animations) */
  reducedMotion: boolean;
  /** Font size multiplier */
  fontSizeMultiplier: number;
  /** Screen reader announcements enabled */
  screenReaderEnabled: boolean;
  /** Keyboard navigation enabled */
  keyboardNavEnabled: boolean;
  /** Focus indicator style */
  focusIndicator: 'default' | 'enhanced' | 'minimal';
}

interface AccessibilityState extends AccessibilitySettings {
  setHighContrast: (enabled: boolean) => void;
  setColorblindType: (type: ColorblindType) => void;
  setReducedMotion: (enabled: boolean) => void;
  setFontSizeMultiplier: (multiplier: number) => void;
  setScreenReaderEnabled: (enabled: boolean) => void;
  setKeyboardNavEnabled: (enabled: boolean) => void;
  setFocusIndicator: (style: 'default' | 'enhanced' | 'minimal') => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  colorblindType: 'none',
  reducedMotion: false,
  fontSizeMultiplier: 1.0,
  screenReaderEnabled: true,
  keyboardNavEnabled: true,
  focusIndicator: 'default',
};

export const useAccessibilityStore = create<AccessibilityState>()(
  devtools(
    persist(
      (set) => ({
        ...DEFAULT_SETTINGS,
        setHighContrast: (highContrast) => set({ highContrast }),
        setColorblindType: (colorblindType) => set({ colorblindType }),
        setReducedMotion: (reducedMotion) => set({ reducedMotion }),
        setFontSizeMultiplier: (fontSizeMultiplier) =>
          set({ fontSizeMultiplier: Math.max(0.8, Math.min(2.0, fontSizeMultiplier)) }),
        setScreenReaderEnabled: (screenReaderEnabled) => set({ screenReaderEnabled }),
        setKeyboardNavEnabled: (keyboardNavEnabled) => set({ keyboardNavEnabled }),
        setFocusIndicator: (focusIndicator) => set({ focusIndicator }),
        reset: () => set(DEFAULT_SETTINGS),
      }),
      {
        name: 'giza-accessibility',
        version: 1,
      },
    ),
    { name: 'GIZA Accessibility' },
  ),
);

// ─── High contrast colors ─────────────────────────────────────────────────

export const HIGH_CONTRAST_COLORS = {
  background: '#000000',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#cccccc',
  primary: '#ffff00',
  accent: '#00ffff',
  border: '#ffffff',
  error: '#ff0000',
  success: '#00ff00',
  warning: '#ffff00',
} as const;

// ─── Colorblind-friendly palettes ─────────────────────────────────────────

/**
 * Color adjustments for each colorblind type.
 * These are used to filter/adjust the color tokens.
 */
export const COLORBLIND_FILTERS: Record<
  ColorblindType,
  { hueRotate: number; saturate: number; brightness: number }
> = {
  none: { hueRotate: 0, saturate: 1, brightness: 1 },
  protanopia: { hueRotate: 0, saturate: 0.6, brightness: 1.1 },
  deuteranopia: { hueRotate: 20, saturate: 0.6, brightness: 1.1 },
  tritanopia: { hueRotate: -20, saturate: 0.7, brightness: 1.05 },
  achromatopsia: { hueRotate: 0, saturate: 0, brightness: 1.2 },
};

/**
 * Returns a CSS filter string for the current colorblind type.
 */
export function getColorblindFilter(type: ColorblindType): string {
  const filter = COLORBLIND_FILTERS[type];
  if (type === 'none') return 'none';
  return `hue-rotate(${filter.hueRotate}deg) saturate(${filter.saturate}) brightness(${filter.brightness})`;
}

// ─── Keyboard navigation ──────────────────────────────────────────────────

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: string; // action identifier, handled by the app
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Tab', description: 'Move focus to next element', action: 'focus-next' },
  { key: 'Tab', shift: true, description: 'Move focus to previous element', action: 'focus-prev' },
  { key: 'Escape', description: 'Close panel / cancel action', action: 'close-panel' },
  { key: '1', description: 'Switch to Scene tab', action: 'tab-scene' },
  { key: '2', description: 'Switch to Evidence tab', action: 'tab-evidence' },
  { key: '3', description: 'Switch to Simulation tab', action: 'tab-simulation' },
  { key: 'e', description: 'Toggle evidence panel', action: 'toggle-evidence' },
  { key: 'l', description: 'Toggle lighting panel', action: 'toggle-lighting' },
  { key: 'm', description: 'Toggle measurement mode', action: 'toggle-measurement' },
  { key: 'h', description: 'Toggle hypothesis panel', action: 'toggle-hypothesis' },
  { key: '+', description: 'Zoom in', action: 'zoom-in' },
  { key: '-', description: 'Zoom out', action: 'zoom-out' },
  { key: 'r', description: 'Reset camera', action: 'reset-camera' },
  { key: 'g', description: 'Toggle grid', action: 'toggle-grid' },
  { key: 'f', description: 'Toggle fullscreen', action: 'toggle-fullscreen' },
  { key: '?', shift: true, description: 'Show keyboard shortcuts help', action: 'show-help' },
];

/**
 * Returns a human-readable description of a keyboard shortcut.
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
  return parts.join(' + ');
}

// ─── ARIA live region helper ──────────────────────────────────────────────

/**
 * Creates an ARIA live region announcement for screen readers.
 */
export function createAnnouncement(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
): { message: string; priority: 'polite' | 'assertive' } {
  return { message, priority };
}

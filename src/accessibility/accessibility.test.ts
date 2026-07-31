import { describe, it, expect, beforeEach } from 'vitest';
import {
  useAccessibilityStore,
  HIGH_CONTRAST_COLORS,
  COLORBLIND_FILTERS,
  getColorblindFilter,
  KEYBOARD_SHORTCUTS,
  formatShortcut,
  createAnnouncement,
  type ColorblindType,
  type KeyboardShortcut,
} from './accessibility';

describe('Accessibility System (M12-T01)', () => {
  beforeEach(() => {
    useAccessibilityStore.getState().reset();
  });

  describe('useAccessibilityStore', () => {
    it('has default settings', () => {
      const state = useAccessibilityStore.getState();
      expect(state.highContrast).toBe(false);
      expect(state.colorblindType).toBe('none');
      expect(state.reducedMotion).toBe(false);
      expect(state.fontSizeMultiplier).toBe(1.0);
      expect(state.screenReaderEnabled).toBe(true);
      expect(state.keyboardNavEnabled).toBe(true);
      expect(state.focusIndicator).toBe('default');
    });

    it('setHighContrast toggles high contrast', () => {
      useAccessibilityStore.getState().setHighContrast(true);
      expect(useAccessibilityStore.getState().highContrast).toBe(true);
    });

    it('setColorblindType sets the colorblind type', () => {
      useAccessibilityStore.getState().setColorblindType('protanopia');
      expect(useAccessibilityStore.getState().colorblindType).toBe('protanopia');
    });

    it('setReducedMotion toggles reduced motion', () => {
      useAccessibilityStore.getState().setReducedMotion(true);
      expect(useAccessibilityStore.getState().reducedMotion).toBe(true);
    });

    it('setFontSizeMultiplier clamps between 0.8 and 2.0', () => {
      useAccessibilityStore.getState().setFontSizeMultiplier(0.5);
      expect(useAccessibilityStore.getState().fontSizeMultiplier).toBe(0.8);

      useAccessibilityStore.getState().setFontSizeMultiplier(3.0);
      expect(useAccessibilityStore.getState().fontSizeMultiplier).toBe(2.0);

      useAccessibilityStore.getState().setFontSizeMultiplier(1.5);
      expect(useAccessibilityStore.getState().fontSizeMultiplier).toBe(1.5);
    });

    it('setScreenReaderEnabled toggles screen reader', () => {
      useAccessibilityStore.getState().setScreenReaderEnabled(false);
      expect(useAccessibilityStore.getState().screenReaderEnabled).toBe(false);
    });

    it('setKeyboardNavEnabled toggles keyboard nav', () => {
      useAccessibilityStore.getState().setKeyboardNavEnabled(false);
      expect(useAccessibilityStore.getState().keyboardNavEnabled).toBe(false);
    });

    it('setFocusIndicator sets the focus indicator style', () => {
      useAccessibilityStore.getState().setFocusIndicator('enhanced');
      expect(useAccessibilityStore.getState().focusIndicator).toBe('enhanced');
    });

    it('reset restores defaults', () => {
      useAccessibilityStore.getState().setHighContrast(true);
      useAccessibilityStore.getState().setColorblindType('tritanopia');
      useAccessibilityStore.getState().reset();
      expect(useAccessibilityStore.getState().highContrast).toBe(false);
      expect(useAccessibilityStore.getState().colorblindType).toBe('none');
    });
  });

  describe('HIGH_CONTRAST_COLORS', () => {
    it('provides high-contrast color values', () => {
      expect(HIGH_CONTRAST_COLORS.background).toBe('#000000');
      expect(HIGH_CONTRAST_COLORS.text).toBe('#ffffff');
      expect(HIGH_CONTRAST_COLORS.primary).toBeDefined();
      expect(HIGH_CONTRAST_COLORS.border).toBeDefined();
    });
  });

  describe('COLORBLIND_FILTERS', () => {
    it('defines filters for all 5 types', () => {
      const types: ColorblindType[] = [
        'none',
        'protanopia',
        'deuteranopia',
        'tritanopia',
        'achromatopsia',
      ];
      for (const type of types) {
        expect(COLORBLIND_FILTERS[type]).toBeDefined();
        expect(typeof COLORBLIND_FILTERS[type].hueRotate).toBe('number');
        expect(typeof COLORBLIND_FILTERS[type].saturate).toBe('number');
        expect(typeof COLORBLIND_FILTERS[type].brightness).toBe('number');
      }
    });

    it('none type has no adjustment', () => {
      expect(COLORBLIND_FILTERS.none.hueRotate).toBe(0);
      expect(COLORBLIND_FILTERS.none.saturate).toBe(1);
      expect(COLORBLIND_FILTERS.none.brightness).toBe(1);
    });

    it('achromatopsia desaturates completely', () => {
      expect(COLORBLIND_FILTERS.achromatopsia.saturate).toBe(0);
    });
  });

  describe('getColorblindFilter', () => {
    it('returns "none" for no colorblind type', () => {
      expect(getColorblindFilter('none')).toBe('none');
    });

    it('returns a CSS filter string for colorblind types', () => {
      const filter = getColorblindFilter('protanopia');
      expect(filter).toContain('saturate');
      expect(filter).toContain('brightness');
    });
  });

  describe('KEYBOARD_SHORTCUTS', () => {
    it('defines shortcuts for all major actions', () => {
      const actions = KEYBOARD_SHORTCUTS.map((s) => s.action);
      expect(actions).toContain('focus-next');
      expect(actions).toContain('close-panel');
      expect(actions).toContain('tab-scene');
      expect(actions).toContain('tab-evidence');
      expect(actions).toContain('tab-simulation');
      expect(actions).toContain('toggle-evidence');
      expect(actions).toContain('toggle-lighting');
      expect(actions).toContain('toggle-measurement');
      expect(actions).toContain('zoom-in');
      expect(actions).toContain('zoom-out');
      expect(actions).toContain('reset-camera');
      expect(actions).toContain('show-help');
    });

    it('every shortcut has a description', () => {
      for (const shortcut of KEYBOARD_SHORTCUTS) {
        expect(shortcut.description.length).toBeGreaterThan(0);
      }
    });

    it('every shortcut has a key and action', () => {
      for (const shortcut of KEYBOARD_SHORTCUTS) {
        expect(shortcut.key.length).toBeGreaterThan(0);
        expect(shortcut.action.length).toBeGreaterThan(0);
      }
    });
  });

  describe('formatShortcut', () => {
    it('formats a simple shortcut', () => {
      const shortcut = KEYBOARD_SHORTCUTS.find((s) => s.key === 'e')!;
      expect(formatShortcut(shortcut)).toBe('e');
    });

    it('formats a shortcut with modifiers', () => {
      const shortcut: KeyboardShortcut = {
        key: 's',
        ctrl: true,
        shift: true,
        description: 'Save',
        action: 'save',
      };
      const formatted = formatShortcut(shortcut);
      expect(formatted).toContain('Ctrl');
      expect(formatted).toContain('Shift');
      expect(formatted).toContain('s');
    });

    it('formats Space key', () => {
      const shortcut: KeyboardShortcut = {
        key: ' ',
        description: 'Play/Pause',
        action: 'play-pause',
      };
      expect(formatShortcut(shortcut)).toContain('Space');
    });
  });

  describe('createAnnouncement', () => {
    it('creates a polite announcement by default', () => {
      const ann = createAnnouncement('Scene loaded');
      expect(ann.message).toBe('Scene loaded');
      expect(ann.priority).toBe('polite');
    });

    it('creates an assertive announcement', () => {
      const ann = createAnnouncement('Error occurred', 'assertive');
      expect(ann.priority).toBe('assertive');
    });
  });
});

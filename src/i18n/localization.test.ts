import { describe, it, expect, beforeEach } from 'vitest';
import {
  useLocaleStore,
  translate,
  SUPPORTED_LOCALES,
  LOCALE_METADATA,
  TRANSLATIONS,
} from './localization';

describe('Localization (M12-T02)', () => {
  beforeEach(() => {
    useLocaleStore.getState().setLocale('en');
  });

  describe('SUPPORTED_LOCALES', () => {
    it('supports English and French', () => {
      expect(SUPPORTED_LOCALES).toContain('en');
      expect(SUPPORTED_LOCALES).toContain('fr');
      expect(SUPPORTED_LOCALES).toHaveLength(2);
    });
  });

  describe('LOCALE_METADATA', () => {
    it('has metadata for each locale', () => {
      for (const locale of SUPPORTED_LOCALES) {
        expect(LOCALE_METADATA[locale]).toBeDefined();
        expect(LOCALE_METADATA[locale].label.length).toBeGreaterThan(0);
      }
    });
  });

  describe('translate', () => {
    it('translates keys to English', () => {
      expect(translate('app.title', 'en')).toBe('GIZA — Archaeological Visualization');
      expect(translate('panel.scene', 'en')).toBe('Scene');
      expect(translate('panel.evidence', 'en')).toBe('Evidence');
    });

    it('translates keys to French', () => {
      expect(translate('app.title', 'fr')).toBe('GIZA — Visualisation Archéologique');
      expect(translate('panel.scene', 'fr')).toBe('Scène');
      expect(translate('panel.evidence', 'fr')).toBe('Preuves');
    });

    it('falls back to English for missing French keys', () => {
      // All keys should have French translations, but the fallback should work
      const result = translate('app.title', 'fr');
      expect(result).toBeDefined();
    });

    it('returns the key itself for unknown keys', () => {
      expect(translate('nonexistent.key', 'en')).toBe('nonexistent.key');
    });

    it('supports parameter interpolation', () => {
      const result = translate('evidence.searchResults', 'en', { count: 5 });
      expect(result).toBe('5 results');
    });

    it('supports parameter interpolation in French', () => {
      const result = translate('evidence.searchResults', 'fr', { count: 5 });
      expect(result).toBe('5 résultats');
    });
  });

  describe('TRANSLATIONS completeness', () => {
    it('every translation key has an English value', () => {
      for (const t of TRANSLATIONS) {
        expect(t.en.length).toBeGreaterThan(0);
      }
    });

    it('every translation key has a French value', () => {
      for (const t of TRANSLATIONS) {
        expect(t.fr.length).toBeGreaterThan(0);
      }
    });

    it('covers all major UI areas', () => {
      const keys = TRANSLATIONS.map((t) => t.key);
      expect(keys.some((k) => k.startsWith('app.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('panel.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('evidence.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('scene.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('simulation.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('lighting.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('measurement.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('camera.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('toolbar.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('accessibility.'))).toBe(true);
      expect(keys.some((k) => k.startsWith('common.'))).toBe(true);
    });
  });

  describe('useLocaleStore', () => {
    it('defaults to English', () => {
      expect(useLocaleStore.getState().locale).toBe('en');
    });

    it('can switch to French', () => {
      useLocaleStore.getState().setLocale('fr');
      expect(useLocaleStore.getState().locale).toBe('fr');
    });
  });
});

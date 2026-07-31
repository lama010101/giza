/**
 * Localization system per M12-T02.
 *
 * Supports English (default) and French.
 * Translation keys are namespaced by feature area.
 * Falls back to English for missing keys.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Locale = 'en' | 'fr';

export interface TranslationKey {
  key: string;
  en: string;
  fr: string;
}

// ─── Translation dictionary ───────────────────────────────────────────────

export const TRANSLATIONS: TranslationKey[] = [
  // App
  {
    key: 'app.title',
    en: 'GIZA — Archaeological Visualization',
    fr: 'GIZA — Visualisation Archéologique',
  },
  { key: 'app.mode.explore', en: 'Explore', fr: 'Explorer' },
  { key: 'app.mode.guided', en: 'Guided', fr: 'Guidé' },
  { key: 'app.mode.research', en: 'Research', fr: 'Recherche' },
  { key: 'app.mode.documentary', en: 'Documentary', fr: 'Documentaire' },
  { key: 'app.mode.presentation', en: 'Presentation', fr: 'Présentation' },
  { key: 'app.mode.educational', en: 'Educational', fr: 'Éducatif' },
  { key: 'app.mode.museum', en: 'Museum', fr: 'Musée' },
  { key: 'app.mode.developer', en: 'Developer', fr: 'Développeur' },

  // Side panel tabs
  { key: 'panel.scene', en: 'Scene', fr: 'Scène' },
  { key: 'panel.evidence', en: 'Evidence', fr: 'Preuves' },
  { key: 'panel.simulation', en: 'Simulation', fr: 'Simulation' },

  // Evidence
  { key: 'evidence.title', en: 'Evidence', fr: 'Preuves' },
  { key: 'evidence.empty', en: 'No evidence selected', fr: 'Aucune preuve sélectionnée' },
  { key: 'evidence.confidence', en: 'Confidence', fr: 'Confiance' },
  { key: 'evidence.category', en: 'Category', fr: 'Catégorie' },
  { key: 'evidence.status', en: 'Status', fr: 'Statut' },
  { key: 'evidence.source', en: 'Source', fr: 'Source' },
  { key: 'evidence.bookmark', en: 'Bookmark', fr: 'Signet' },
  { key: 'evidence.bookmarked', en: 'Bookmarked', fr: 'Marqué' },
  { key: 'evidence.search', en: 'Search evidence...', fr: 'Rechercher des preuves...' },
  { key: 'evidence.searchResults', en: '{count} results', fr: '{count} résultats' },
  { key: 'evidence.noResults', en: 'No results found', fr: 'Aucun résultat trouvé' },

  // Scene
  { key: 'scene.layers', en: 'Layers', fr: 'Couches' },
  { key: 'scene.hypotheses', en: 'Hypotheses', fr: 'Hypothèses' },
  { key: 'scene.monument', en: 'Monument', fr: 'Monument' },
  { key: 'scene.monument.osiris', en: 'Osiris Shaft', fr: "Puits d'Osiris" },
  { key: 'scene.monument.great-pyramid', en: 'Great Pyramid', fr: 'Grande Pyramide' },

  // Simulation
  { key: 'simulation.title', en: 'Hydraulic Simulation', fr: 'Simulation Hydraulique' },
  { key: 'simulation.play', en: 'Play', fr: 'Lire' },
  { key: 'simulation.pause', en: 'Pause', fr: 'Pause' },
  { key: 'simulation.reset', en: 'Reset', fr: 'Réinitialiser' },
  { key: 'simulation.waterLevel', en: 'Water Level', fr: "Niveau d'Eau" },
  { key: 'simulation.flowRate', en: 'Flow Rate', fr: 'Débit' },
  { key: 'simulation.pressure', en: 'Pressure', fr: 'Pression' },
  { key: 'simulation.velocity', en: 'Velocity', fr: 'Vélocité' },
  { key: 'simulation.duration', en: 'Duration', fr: 'Durée' },

  // Lighting
  { key: 'lighting.title', en: 'Lighting', fr: 'Éclairage' },
  { key: 'lighting.ambient', en: 'Ambient', fr: 'Ambiant' },
  { key: 'lighting.sun', en: 'Sun', fr: 'Soleil' },
  { key: 'lighting.intensity', en: 'Intensity', fr: 'Intensité' },
  { key: 'lighting.color', en: 'Color', fr: 'Couleur' },
  { key: 'lighting.background', en: 'Background', fr: 'Arrière-plan' },

  // Measurement
  { key: 'measurement.title', en: 'Measurement', fr: 'Mesure' },
  { key: 'measurement.mode', en: 'Measurement Mode', fr: 'Mode de Mesure' },
  { key: 'measurement.distance', en: 'Distance', fr: 'Distance' },
  { key: 'measurement.start', en: 'Start', fr: 'Début' },
  { key: 'measurement.end', en: 'End', fr: 'Fin' },
  { key: 'measurement.clear', en: 'Clear', fr: 'Effacer' },

  // Camera
  { key: 'camera.mode', en: 'Camera Mode', fr: 'Mode Caméra' },
  { key: 'camera.orbit', en: 'Orbit', fr: 'Orbite' },
  { key: 'camera.walk', en: 'Walk', fr: 'Marche' },
  { key: 'camera.fly', en: 'Fly', fr: 'Vol' },
  { key: 'camera.teleport', en: 'Teleport', fr: 'Téléportation' },
  { key: 'camera.reset', en: 'Reset Camera', fr: 'Réinitialiser Caméra' },

  // Toolbar
  { key: 'toolbar.evidence', en: 'Evidence', fr: 'Preuves' },
  { key: 'toolbar.lighting', en: 'Lighting', fr: 'Éclairage' },
  { key: 'toolbar.measurement', en: 'Measure', fr: 'Mesurer' },
  { key: 'toolbar.bookmarks', en: 'Bookmarks', fr: 'Signets' },
  { key: 'toolbar.search', en: 'Search', fr: 'Rechercher' },
  { key: 'toolbar.settings', en: 'Settings', fr: 'Paramètres' },

  // Accessibility
  { key: 'accessibility.title', en: 'Accessibility', fr: 'Accessibilité' },
  { key: 'accessibility.highContrast', en: 'High Contrast', fr: 'Contraste Élevé' },
  { key: 'accessibility.colorblind', en: 'Colorblind Mode', fr: 'Mode Daltonien' },
  { key: 'accessibility.reducedMotion', en: 'Reduced Motion', fr: 'Mouvement Réduit' },
  { key: 'accessibility.fontSize', en: 'Font Size', fr: 'Taille de Police' },
  { key: 'accessibility.screenReader', en: 'Screen Reader', fr: "Lecteur d'Écran" },
  { key: 'accessibility.keyboardNav', en: 'Keyboard Navigation', fr: 'Navigation au Clavier' },

  // Common
  { key: 'common.close', en: 'Close', fr: 'Fermer' },
  { key: 'common.cancel', en: 'Cancel', fr: 'Annuler' },
  { key: 'common.confirm', en: 'Confirm', fr: 'Confirmer' },
  { key: 'common.save', en: 'Save', fr: 'Enregistrer' },
  { key: 'common.delete', en: 'Delete', fr: 'Supprimer' },
  { key: 'common.edit', en: 'Edit', fr: 'Modifier' },
  { key: 'common.yes', en: 'Yes', fr: 'Oui' },
  { key: 'common.no', en: 'No', fr: 'Non' },
  { key: 'common.loading', en: 'Loading...', fr: 'Chargement...' },
  { key: 'common.error', en: 'Error', fr: 'Erreur' },
];

// Build lookup maps
const EN_MAP = new Map(TRANSLATIONS.map((t) => [t.key, t.en]));
const FR_MAP = new Map(TRANSLATIONS.map((t) => [t.key, t.fr]));

// ─── Locale store ──────────────────────────────────────────────────────────

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  devtools(
    persist(
      (set) => ({
        locale: 'en',
        setLocale: (locale) => set({ locale }),
      }),
      {
        name: 'giza-locale',
        version: 1,
      },
    ),
    { name: 'GIZA Locale' },
  ),
);

// ─── Translation function ─────────────────────────────────────────────────

/**
 * Translates a key for the given locale, falling back to English.
 * Supports {placeholder} interpolation.
 */
export function translate(
  key: string,
  locale: Locale = 'en',
  params?: Record<string, string | number>,
): string {
  const map = locale === 'fr' ? FR_MAP : EN_MAP;
  let value = map.get(key);

  if (value === undefined) {
    // Fallback to English
    value = EN_MAP.get(key);
  }

  if (value === undefined) {
    // Key not found — return the key itself
    return key;
  }

  // Interpolate params
  if (params) {
    for (const [param, val] of Object.entries(params)) {
      value = value.replace(`{${param}}`, String(val));
    }
  }

  return value;
}

/**
 * Hook for translation in React components.
 * Returns a t() function bound to the current locale.
 */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  return {
    locale,
    t: (key: string, params?: Record<string, string | number>) => translate(key, locale, params),
  };
}

// ─── Locale metadata ──────────────────────────────────────────────────────

export const LOCALE_METADATA: Record<Locale, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇬🇧' },
  fr: { label: 'Français', flag: '🇫🇷' },
};

export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr'];

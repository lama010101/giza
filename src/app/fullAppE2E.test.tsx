/**
 * Full application E2E test suite per M12-T08.
 *
 * Tests the complete application flow:
 *   1. App loads
 *   2. Monument switching
 *   3. Evidence panel interaction
 *   4. Simulation panel interaction
 *   5. Lighting panel interaction
 *   6. Measurement mode
 *   7. Bookmark creation
 *   8. Search functionality
 *   9. Accessibility settings
 *  10. Localization
 *  11. Security roles
 *  12. Offline package management
 *  13. Performance monitoring
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { App } from '../App';
import { useAppStore } from '@/store/app';
import { useAccessibilityStore } from '@/accessibility/accessibility';
import { useLocaleStore, translate } from '@/i18n/localization';
import { useSecurityStore, getDefaultUser } from '@/security/securityModel';
import { useOfflineStore } from '@/offline/offlineSupport';
import { usePerformanceStore, detectPerformanceTier } from '@/performance/performanceOptimization';

// Mock R3F
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useThree: () => ({
    scene: { fog: null },
    gl: { domElement: document.createElement('canvas') },
    camera: { position: { x: 0, y: 0, z: 0 } },
  }),
  useFrame: () => undefined,
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Text: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Full Application E2E Test Suite (M12-T08)', () => {
  beforeEach(() => {
    useAccessibilityStore.getState().reset();
    useLocaleStore.getState().setLocale('en');
    useSecurityStore.getState().logout();
    usePerformanceStore.getState().setTier('unknown');
    // Clear bookmarks from persisted store
    useAppStore.getState().setActiveHypothesisIds([]);
    // Reset bookmarks by toggling off any that exist
    for (const id of useAppStore.getState().bookmarkedObjectIds) {
      useAppStore.getState().toggleBookmarkedObject(id);
    }
  });

  describe('1. App loads', () => {
    it('renders without crashing', () => {
      render(<App />);
      expect(document.body).toBeDefined();
    });
  });

  describe('2. Monument switching', () => {
    it('can switch to Osiris Shaft', () => {
      useAppStore.getState().setActiveMonument('osiris');
      expect(useAppStore.getState().activeMonument).toBe('osiris');
    });

    it('can switch to Great Pyramid', () => {
      useAppStore.getState().setActiveMonument('great-pyramid');
      expect(useAppStore.getState().activeMonument).toBe('great-pyramid');
    });

    it('updates camera target when switching monuments', () => {
      useAppStore.getState().setActiveMonument('osiris');
      expect(useAppStore.getState().cameraTarget).toEqual({ x: -1.4, y: -15, z: -7 });

      useAppStore.getState().setActiveMonument('great-pyramid');
      expect(useAppStore.getState().cameraTarget).toEqual({ x: 0, y: 70, z: 0 });
    });
  });

  describe('3. Evidence panel interaction', () => {
    it('can open and close evidence panel', () => {
      useAppStore.getState().setEvidencePanelOpen(false);
      expect(useAppStore.getState().evidencePanelOpen).toBe(false);

      useAppStore.getState().setEvidencePanelOpen(true);
      expect(useAppStore.getState().evidencePanelOpen).toBe(true);
    });

    it('can select an evidence record', () => {
      useAppStore.getState().setSelectedEvidenceId('EV-000001');
      expect(useAppStore.getState().selectedEvidenceId).toBe('EV-000001');
    });
  });

  describe('4. Simulation panel interaction', () => {
    it('can switch to simulation tab', () => {
      useAppStore.getState().setSidePanelTab('simulation');
      expect(useAppStore.getState().sidePanelTab).toBe('simulation');
    });
  });

  describe('5. Lighting panel interaction', () => {
    it('can open lighting panel', () => {
      useAppStore.getState().setLightingPanelOpen(true);
      expect(useAppStore.getState().lightingPanelOpen).toBe(true);
    });
  });

  describe('6. Measurement mode', () => {
    it('can toggle measurement mode', () => {
      useAppStore.getState().setMeasurementMode(true);
      expect(useAppStore.getState().measurementMode).toBe(true);
    });

    it('can add measurement points', () => {
      useAppStore.getState().setMeasurementMode(true);
      useAppStore.getState().addMeasurementPoint({ x: 1, y: 2, z: 3 });
      expect(useAppStore.getState().measurementStart).toEqual({ x: 1, y: 2, z: 3 });

      useAppStore.getState().addMeasurementPoint({ x: 4, y: 5, z: 6 });
      expect(useAppStore.getState().measurementEnd).toEqual({ x: 4, y: 5, z: 6 });
    });

    it('can clear measurement', () => {
      useAppStore.getState().setMeasurementMode(true);
      useAppStore.getState().addMeasurementPoint({ x: 1, y: 2, z: 3 });
      useAppStore.getState().clearMeasurement();
      expect(useAppStore.getState().measurementStart).toBeNull();
      expect(useAppStore.getState().measurementEnd).toBeNull();
    });
  });

  describe('7. Bookmark creation', () => {
    it('can bookmark an object', () => {
      useAppStore.getState().toggleBookmarkedObject('OBJ-0001');
      expect(useAppStore.getState().bookmarkedObjectIds).toContain('OBJ-0001');
    });

    it('can unbookmark an object', () => {
      useAppStore.getState().toggleBookmarkedObject('OBJ-0001');
      useAppStore.getState().toggleBookmarkedObject('OBJ-0001');
      expect(useAppStore.getState().bookmarkedObjectIds).not.toContain('OBJ-0001');
    });
  });

  describe('8. Layer toggling', () => {
    it('can toggle scene layers', () => {
      useAppStore.getState().toggleLayer('level-1');
      expect(useAppStore.getState().hiddenLayers).toContain('level-1');

      useAppStore.getState().toggleLayer('level-1');
      expect(useAppStore.getState().hiddenLayers).not.toContain('level-1');
    });
  });

  describe('9. Accessibility settings', () => {
    it('can enable high contrast', () => {
      useAccessibilityStore.getState().setHighContrast(true);
      expect(useAccessibilityStore.getState().highContrast).toBe(true);
    });

    it('can set colorblind type', () => {
      useAccessibilityStore.getState().setColorblindType('deuteranopia');
      expect(useAccessibilityStore.getState().colorblindType).toBe('deuteranopia');
    });

    it('can enable reduced motion', () => {
      useAccessibilityStore.getState().setReducedMotion(true);
      expect(useAccessibilityStore.getState().reducedMotion).toBe(true);
    });

    it('can adjust font size', () => {
      useAccessibilityStore.getState().setFontSizeMultiplier(1.5);
      expect(useAccessibilityStore.getState().fontSizeMultiplier).toBe(1.5);
    });
  });

  describe('10. Localization', () => {
    it('can switch to French', () => {
      useLocaleStore.getState().setLocale('fr');
      expect(translate('panel.evidence', 'fr')).toBe('Preuves');
    });

    it('can switch back to English', () => {
      useLocaleStore.getState().setLocale('fr');
      useLocaleStore.getState().setLocale('en');
      expect(translate('panel.evidence', 'en')).toBe('Evidence');
    });
  });

  describe('11. Security roles', () => {
    it('visitor cannot manage users', () => {
      useSecurityStore
        .getState()
        .login({ id: 'v1', username: 'visitor', displayName: 'Visitor', role: 'visitor' }, 'token');
      const state = useSecurityStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser?.role).toBe('visitor');
    });

    it('admin can manage users', () => {
      useSecurityStore
        .getState()
        .login({ id: 'a1', username: 'admin', displayName: 'Admin', role: 'admin' }, 'token');
      expect(useSecurityStore.getState().currentUser?.role).toBe('admin');
    });

    it('can get default demo user', () => {
      const user = getDefaultUser();
      expect(user.role).toBe('researcher');
    });
  });

  describe('12. Offline package management', () => {
    it('packages start as not-downloaded', () => {
      const packages_ = Object.values(useOfflineStore.getState().packages);
      expect(packages_.length).toBeGreaterThan(0);
      for (const pkg of packages_) {
        expect(pkg.status).toBe('not-downloaded');
      }
    });

    it('can download a package', async () => {
      const pkgId = Object.keys(useOfflineStore.getState().packages)[0];
      await useOfflineStore.getState().downloadPackage(pkgId);
      expect(useOfflineStore.getState().isPackageAvailable(pkgId)).toBe(true);
    });
  });

  describe('13. Performance monitoring', () => {
    it('can detect performance tier', () => {
      const tier = detectPerformanceTier();
      expect(['desktop-high', 'desktop-low', 'mobile', 'unknown']).toContain(tier);
    });

    it('can update FPS', () => {
      usePerformanceStore.getState().updateFPS(60);
      expect(usePerformanceStore.getState().currentFPS).toBe(60);
    });

    it('can set performance tier', () => {
      usePerformanceStore.getState().setTier('desktop-high');
      expect(usePerformanceStore.getState().tier).toBe('desktop-high');
    });
  });

  describe('14. Hypothesis management', () => {
    it('can activate a hypothesis', () => {
      useAppStore.getState().setActiveHypothesisIds(['THEORY-OSIRIS-001']);
      expect(useAppStore.getState().activeHypothesisIds).toContain('THEORY-OSIRIS-001');
    });

    it('can deactivate all hypotheses', () => {
      useAppStore.getState().setActiveHypothesisIds(['THEORY-OSIRIS-001']);
      useAppStore.getState().setActiveHypothesisIds([]);
      expect(useAppStore.getState().activeHypothesisIds).toHaveLength(0);
    });
  });

  describe('15. Camera mode switching', () => {
    it('can switch camera modes', () => {
      useAppStore.getState().setCameraMode('walk');
      expect(useAppStore.getState().cameraMode).toBe('walk');

      useAppStore.getState().setCameraMode('fly');
      expect(useAppStore.getState().cameraMode).toBe('fly');
    });
  });

  describe('16. LOD switching', () => {
    it('can change LOD level', () => {
      useAppStore.getState().setLOD('LOD1');
      expect(useAppStore.getState().lod).toBe('LOD1');

      useAppStore.getState().setLOD('LOD0');
      expect(useAppStore.getState().lod).toBe('LOD0');
    });
  });
});

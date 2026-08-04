import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOfflineStore, AVAILABLE_PACKAGES, setupOnlineDetection } from './offlineSupport';

describe('Offline Support (M12-T03)', () => {
  beforeEach(() => {
    // Reset all packages to not-downloaded
    const packages_ = useOfflineStore.getState().packages;
    for (const id of Object.keys(packages_)) {
      useOfflineStore.getState().removePackage(id);
    }
  });

  describe('AVAILABLE_PACKAGES', () => {
    it('defines packages for Osiris Shaft and Great Pyramid', () => {
      const monumentIds = AVAILABLE_PACKAGES.map((p) => p.monumentId);
      expect(monumentIds).toContain('osiris');
      expect(monumentIds).toContain('great-pyramid');
    });

    it('every package has required fields', () => {
      for (const pkg of AVAILABLE_PACKAGES) {
        expect(pkg.id).toBeDefined();
        expect(pkg.name).toBeDefined();
        expect(pkg.version).toBeDefined();
        expect(pkg.sizeMB).toBeGreaterThan(0);
        expect(pkg.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('useOfflineStore', () => {
    it('initializes all packages as not-downloaded', () => {
      const packages_ = Object.values(useOfflineStore.getState().packages);
      for (const pkg of packages_) {
        expect(pkg.status).toBe('not-downloaded');
        expect(pkg.downloadProgress).toBe(0);
      }
    });

    it('downloadPackage marks package as downloaded', async () => {
      const pkgId = AVAILABLE_PACKAGES[0].id;
      await useOfflineStore.getState().downloadPackage(pkgId);
      const pkg = useOfflineStore.getState().packages[pkgId];
      expect(pkg.status).toBe('downloaded');
      expect(pkg.downloadProgress).toBe(100);
      expect(pkg.downloadedAt).toBeDefined();
    });

    it('removePackage resets to not-downloaded', async () => {
      const pkgId = AVAILABLE_PACKAGES[0].id;
      await useOfflineStore.getState().downloadPackage(pkgId);
      useOfflineStore.getState().removePackage(pkgId);
      const pkg = useOfflineStore.getState().packages[pkgId];
      expect(pkg.status).toBe('not-downloaded');
      expect(pkg.downloadProgress).toBe(0);
      expect(pkg.downloadedAt).toBeUndefined();
    });

    it('isPackageAvailable returns true for downloaded packages', async () => {
      const pkgId = AVAILABLE_PACKAGES[0].id;
      expect(useOfflineStore.getState().isPackageAvailable(pkgId)).toBe(false);
      await useOfflineStore.getState().downloadPackage(pkgId);
      expect(useOfflineStore.getState().isPackageAvailable(pkgId)).toBe(true);
    });

    it('getMonumentPackages returns packages for a monument', () => {
      const osirisPackages = useOfflineStore.getState().getMonumentPackages('osiris');
      expect(osirisPackages.length).toBeGreaterThan(0);
      for (const pkg of osirisPackages) {
        expect(pkg.monumentId).toBe('osiris');
      }
    });

    it('getCacheStats returns total size and count', async () => {
      const pkgId = AVAILABLE_PACKAGES[0].id;
      await useOfflineStore.getState().downloadPackage(pkgId);
      const stats = useOfflineStore.getState().getCacheStats();
      expect(stats.packageCount).toBe(1);
      expect(stats.totalSizeMB).toBe(AVAILABLE_PACKAGES[0].sizeMB);
      expect(stats.lastUpdated).toBeDefined();
    });

    it('setOnline toggles online status', () => {
      useOfflineStore.getState().setOnline(false);
      expect(useOfflineStore.getState().isOnline).toBe(false);
      useOfflineStore.getState().setOnline(true);
      expect(useOfflineStore.getState().isOnline).toBe(true);
    });

    it('setAutoDownload toggles auto-download', () => {
      useOfflineStore.getState().setAutoDownload(true);
      expect(useOfflineStore.getState().autoDownload).toBe(true);
    });
  });

  describe('setupOnlineDetection', () => {
    it('sets up event listeners', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const cleanup = setupOnlineDetection();
      expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function));
      cleanup();
      addSpy.mockRestore();
    });

    it('returns a cleanup function', () => {
      const cleanup = setupOnlineDetection();
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });
});

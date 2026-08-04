/**
 * Offline support per M12-T03.
 *
 * Scene packages are self-contained bundles of:
 *   - Geometry (glTF / blockout data)
 *   - Textures
 *   - Evidence records
 *   - Metadata
 *
 * Packages can be downloaded for offline use (museum kiosks, field
 * research without connectivity).
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type PackageStatus = 'not-downloaded' | 'downloading' | 'downloaded' | 'error';

export interface ScenePackage {
  id: string;
  monumentId: string;
  name: string;
  version: string;
  sizeMB: number;
  status: PackageStatus;
  downloadProgress: number; // 0-100
  downloadedAt?: string; // ISO date
  checksum?: string;
  description: string;
}

export interface OfflineCacheStats {
  totalSizeMB: number;
  packageCount: number;
  lastUpdated: string;
}

// ─── Available packages ───────────────────────────────────────────────────

export const AVAILABLE_PACKAGES: Omit<
  ScenePackage,
  'status' | 'downloadProgress' | 'downloadedAt'
>[] = [
  {
    id: 'pkg-osiris-shaft',
    monumentId: 'osiris',
    name: 'Osiris Shaft — Complete',
    version: '1.0.0',
    sizeMB: 45,
    checksum: 'sha256:abc123',
    description:
      'Full Osiris Shaft model with all 4 levels, evidence records, and hydraulic simulation data.',
  },
  {
    id: 'pkg-great-pyramid',
    monumentId: 'great-pyramid',
    name: 'Great Pyramid — Complete',
    version: '1.0.0',
    sizeMB: 120,
    checksum: 'sha256:def456',
    description: 'Full Great Pyramid model with interior chambers, passages, and evidence records.',
  },
  {
    id: 'pkg-osiris-surface',
    monumentId: 'osiris',
    name: 'Osiris Shaft — Surface Only',
    version: '1.0.0',
    sizeMB: 8,
    checksum: 'sha256:ghi789',
    description: 'Lightweight package with only the surface context for low-bandwidth situations.',
  },
];

// ─── Offline store ─────────────────────────────────────────────────────────

interface OfflineState {
  packages: Record<string, ScenePackage>;
  isOnline: boolean;
  autoDownload: boolean;

  downloadPackage: (packageId: string) => Promise<void>;
  removePackage: (packageId: string) => void;
  setOnline: (online: boolean) => void;
  setAutoDownload: (enabled: boolean) => void;
  getCacheStats: () => OfflineCacheStats;
  isPackageAvailable: (packageId: string) => boolean;
  getMonumentPackages: (monumentId: string) => ScenePackage[];
}

function createInitialPackages(): Record<string, ScenePackage> {
  const packages: Record<string, ScenePackage> = {};
  for (const pkg of AVAILABLE_PACKAGES) {
    packages[pkg.id] = {
      ...pkg,
      status: 'not-downloaded',
      downloadProgress: 0,
    };
  }
  return packages;
}

export const useOfflineStore = create<OfflineState>()(
  devtools(
    persist(
      (set, get) => ({
        packages: createInitialPackages(),
        isOnline: navigator.onLine,
        autoDownload: false,

        downloadPackage: async (packageId) => {
          // Set status to downloading
          set((state) => ({
            packages: {
              ...state.packages,
              [packageId]: {
                ...state.packages[packageId],
                status: 'downloading',
                downloadProgress: 0,
              },
            },
          }));

          // Simulate download (in production, this would be a real fetch)
          const totalSteps = 10;
          for (let i = 1; i <= totalSteps; i++) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            const progress = (i / totalSteps) * 100;
            set((state) => ({
              packages: {
                ...state.packages,
                [packageId]: {
                  ...state.packages[packageId],
                  downloadProgress: progress,
                },
              },
            }));
          }

          // Mark as downloaded
          set((state) => ({
            packages: {
              ...state.packages,
              [packageId]: {
                ...state.packages[packageId],
                status: 'downloaded',
                downloadProgress: 100,
                downloadedAt: new Date().toISOString(),
              },
            },
          }));
        },

        removePackage: (packageId) =>
          set((state) => ({
            packages: {
              ...state.packages,
              [packageId]: {
                ...state.packages[packageId],
                status: 'not-downloaded',
                downloadProgress: 0,
                downloadedAt: undefined,
              },
            },
          })),

        setOnline: (isOnline) => set({ isOnline }),

        setAutoDownload: (autoDownload) => set({ autoDownload }),

        getCacheStats: () => {
          const packages = Object.values(get().packages);
          const downloaded = packages.filter((p) => p.status === 'downloaded');
          return {
            totalSizeMB: downloaded.reduce((sum, p) => sum + p.sizeMB, 0),
            packageCount: downloaded.length,
            lastUpdated:
              downloaded.length > 0
                ? downloaded
                    .map((p) => p.downloadedAt ?? '')
                    .sort()
                    .reverse()[0]
                : '',
          };
        },

        isPackageAvailable: (packageId) => {
          const pkg = get().packages[packageId];
          return pkg?.status === 'downloaded';
        },

        getMonumentPackages: (monumentId) =>
          Object.values(get().packages).filter((p) => p.monumentId === monumentId),
      }),
      {
        name: 'giza-offline',
        version: 1,
        partialize: (state) => ({
          packages: state.packages,
          autoDownload: state.autoDownload,
        }),
      },
    ),
    { name: 'GIZA Offline' },
  ),
);

// ─── Online/offline detection ──────────────────────────────────────────────

/**
 * Sets up online/offline detection and updates the store.
 */
export function setupOnlineDetection(): () => void {
  const handleOnline = () => useOfflineStore.getState().setOnline(true);
  const handleOffline = () => useOfflineStore.getState().setOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

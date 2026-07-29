import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Vector3 } from '@/schemas/location';

export type AppMode =
  | 'Explore'
  | 'Guided'
  | 'Research'
  | 'Documentary'
  | 'Presentation'
  | 'Educational'
  | 'Museum'
  | 'Developer';

export type CameraMode = 'orbit' | 'walk' | 'fly' | 'teleport';
export type Monument = 'osiris' | 'great-pyramid';

export const SCENE_LAYERS = [
  'shafts',
  'level-1',
  'level-2',
  'level-3',
  'monument',
  'exterior',
  'passages',
  'subterranean',
  'gallery',
  'kings-complex',
  'queens-complex',
  'relieving',
] as const;
export type SceneLayer = (typeof SCENE_LAYERS)[number];

interface AppState {
  mode: AppMode;
  activeMonument: Monument;
  activeHypothesisIds: string[];
  activeLocationId: string | null;
  selectedEvidenceId: string | null;
  evidencePanelOpen: boolean;
  hoveredNodeId: string | null;
  measurementMode: boolean;
  measurementStart: Vector3 | null;
  measurementEnd: Vector3 | null;
  bookmarkedObjectIds: string[];
  cameraMode: CameraMode;
  cameraTarget: Vector3;
  hiddenLayers: SceneLayer[];
  setMode: (mode: AppMode) => void;
  setActiveMonument: (monument: Monument) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (target: Vector3) => void;
  toggleLayer: (layer: SceneLayer) => void;
  setActiveHypothesisIds: (ids: string[]) => void;
  setActiveLocationId: (id: string | null) => void;
  setSelectedEvidenceId: (id: string | null) => void;
  setEvidencePanelOpen: (open: boolean) => void;
  setHoveredNodeId: (id: string | null) => void;
  setMeasurementMode: (on: boolean) => void;
  addMeasurementPoint: (point: Vector3) => void;
  clearMeasurement: () => void;
  toggleBookmarkedObject: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      mode: 'Explore',
      activeMonument: 'osiris',
      activeHypothesisIds: [],
      activeLocationId: null,
      selectedEvidenceId: null,
      evidencePanelOpen: true,
      hoveredNodeId: null,
      measurementMode: false,
      measurementStart: null,
      measurementEnd: null,
      bookmarkedObjectIds: [],
      cameraMode: 'orbit',
      cameraTarget: { x: 0, y: -15, z: 2 },
      hiddenLayers: [],
      setMode: (mode) => set({ mode }),
      setActiveMonument: (activeMonument) => set({ activeMonument }),
      setCameraMode: (cameraMode) => set({ cameraMode }),
      setCameraTarget: (cameraTarget) => set({ cameraTarget }),
      toggleLayer: (layer) =>
        set((state) => ({
          hiddenLayers: state.hiddenLayers.includes(layer)
            ? state.hiddenLayers.filter((l) => l !== layer)
            : [...state.hiddenLayers, layer],
        })),
      setActiveHypothesisIds: (activeHypothesisIds) => set({ activeHypothesisIds }),
      setActiveLocationId: (activeLocationId) => set({ activeLocationId }),
      setSelectedEvidenceId: (selectedEvidenceId) => set({ selectedEvidenceId }),
      setEvidencePanelOpen: (evidencePanelOpen) => set({ evidencePanelOpen }),
      setHoveredNodeId: (hoveredNodeId) => set({ hoveredNodeId }),
      setMeasurementMode: (measurementMode) =>
        set(
          measurementMode
            ? { measurementMode }
            : { measurementMode, measurementStart: null, measurementEnd: null },
        ),
      addMeasurementPoint: (point) =>
        set((state) =>
          state.measurementStart === null || state.measurementEnd !== null
            ? { measurementStart: point, measurementEnd: null }
            : { measurementEnd: point },
        ),
      clearMeasurement: () => set({ measurementStart: null, measurementEnd: null }),
      toggleBookmarkedObject: (id) =>
        set((state) => ({
          bookmarkedObjectIds: state.bookmarkedObjectIds.includes(id)
            ? state.bookmarkedObjectIds.filter((existing) => existing !== id)
            : [...state.bookmarkedObjectIds, id],
        })),
    }),
    { name: 'GIZA App Store' },
  ),
);

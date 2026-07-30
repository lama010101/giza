import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Vector3 } from '@/schemas/location';
import type { LODLevel } from '@/loaders/validators';

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
export type SidePanelTab = 'scene' | 'evidence' | 'simulation';

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

export const MONUMENT_LAYERS: Record<Monument, readonly SceneLayer[]> = {
  osiris: ['shafts', 'level-1', 'level-2', 'level-3', 'monument'] as const,
  'great-pyramid': [
    'exterior',
    'passages',
    'subterranean',
    'gallery',
    'kings-complex',
    'queens-complex',
    'relieving',
    'shafts',
  ] as const,
};

interface AppState {
  mode: AppMode;
  activeMonument: Monument;
  activeHypothesisIds: string[];
  activeLocationId: string | null;
  selectedEvidenceId: string | null;
  evidencePanelOpen: boolean;
  lightingPanelOpen: boolean;
  sidePanelTab: SidePanelTab;
  hoveredNodeId: string | null;
  measurementMode: boolean;
  measurementStart: Vector3 | null;
  measurementEnd: Vector3 | null;
  bookmarkedObjectIds: string[];
  cameraMode: CameraMode;
  cameraTarget: Vector3;
  hiddenLayers: SceneLayer[];
  lod: LODLevel;
  setLOD: (lod: LODLevel) => void;
  setMode: (mode: AppMode) => void;
  setActiveMonument: (monument: Monument) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (target: Vector3) => void;
  toggleLayer: (layer: SceneLayer) => void;
  setHiddenLayers: (layers: SceneLayer[]) => void;
  setActiveHypothesisIds: (ids: string[]) => void;
  setActiveLocationId: (id: string | null) => void;
  setSelectedEvidenceId: (id: string | null) => void;
  setEvidencePanelOpen: (open: boolean) => void;
  setLightingPanelOpen: (open: boolean) => void;
  setSidePanelTab: (tab: SidePanelTab) => void;
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
      lightingPanelOpen: false,
      sidePanelTab: 'scene',
      hoveredNodeId: null,
      measurementMode: false,
      measurementStart: null,
      measurementEnd: null,
      bookmarkedObjectIds: [],
      cameraMode: 'orbit',
      cameraTarget: { x: 0, y: -15, z: 2 },
      hiddenLayers: [],
      lod: 'LOD0',
      setLOD: (lod) => set({ lod }),
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
      setHiddenLayers: (hiddenLayers) => set({ hiddenLayers }),
      setActiveHypothesisIds: (activeHypothesisIds) => set({ activeHypothesisIds }),
      setActiveLocationId: (activeLocationId) => set({ activeLocationId }),
      setSelectedEvidenceId: (selectedEvidenceId) => set({ selectedEvidenceId }),
      setEvidencePanelOpen: (evidencePanelOpen) => set({ evidencePanelOpen }),
      setLightingPanelOpen: (lightingPanelOpen) => set({ lightingPanelOpen }),
      setSidePanelTab: (sidePanelTab) => set({ sidePanelTab }),
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

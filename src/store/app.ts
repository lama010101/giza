import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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

export const DEFAULT_CAMERA_TARGET: Record<Monument, Vector3> = {
  osiris: { x: -1.4, y: -15, z: -7 },
  'great-pyramid': { x: 0, y: 70, z: 0 },
};
export type SidePanelTab = 'scene' | 'evidence' | 'simulation' | 'hypothesis';

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

export const VISIBILITY_LAYERS = [
  'Geometry',
  'Modern',
  'Water',
  'Geology',
  'Evidence',
  'Theory',
  'Simulation',
  'Annotations',
] as const;
export type VisibilityLayer = (typeof VISIBILITY_LAYERS)[number];

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

export interface AppState {
  mode: AppMode;
  activeMonument: Monument;
  activeHypothesisIds: string[];
  activeLocationId: string | null;
  selectedObjectId: string | null;
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
  hiddenVisibilityLayers: VisibilityLayer[];
  lod: LODLevel;
  screenshotRequest: number | null;
  setLOD: (lod: LODLevel) => void;
  setMode: (mode: AppMode) => void;
  setActiveMonument: (monument: Monument) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (target: Vector3) => void;
  toggleLayer: (layer: SceneLayer) => void;
  setHiddenLayers: (layers: SceneLayer[]) => void;
  toggleVisibilityLayer: (layer: VisibilityLayer) => void;
  setHiddenVisibilityLayers: (layers: VisibilityLayer[]) => void;
  setActiveHypothesisIds: (ids: string[]) => void;
  requestScreenshot: () => void;
  clearScreenshotRequest: () => void;
  setActiveLocationId: (id: string | null) => void;
  setSelectedObjectId: (id: string | null) => void;
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

const PERSISTED_KEYS: (keyof AppState)[] = [
  'mode',
  'activeMonument',
  'activeHypothesisIds',
  'activeLocationId',
  'evidencePanelOpen',
  'sidePanelTab',
  'bookmarkedObjectIds',
  'cameraMode',
  'cameraTarget',
  'hiddenLayers',
  'hiddenVisibilityLayers',
  'lod',
];

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        mode: 'Explore',
        activeMonument: 'great-pyramid',
        activeHypothesisIds: [],
        activeLocationId: null,
        selectedObjectId: null,
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
        cameraTarget: { x: 0, y: 70, z: 0 },
        hiddenLayers: [],
        hiddenVisibilityLayers: [],
        lod: 'LOD0',
        screenshotRequest: null,
        setLOD: (lod) => set({ lod }),
        setMode: (mode) => set({ mode }),
        setActiveMonument: (activeMonument) =>
          set({ activeMonument, cameraTarget: DEFAULT_CAMERA_TARGET[activeMonument] }),
        setCameraMode: (cameraMode) => set({ cameraMode }),
        setCameraTarget: (cameraTarget) => set({ cameraTarget }),
        toggleLayer: (layer) =>
          set((state) => ({
            hiddenLayers: state.hiddenLayers.includes(layer)
              ? state.hiddenLayers.filter((l) => l !== layer)
              : [...state.hiddenLayers, layer],
          })),
        setHiddenLayers: (hiddenLayers) => set({ hiddenLayers }),
        toggleVisibilityLayer: (layer) =>
          set((state) => ({
            hiddenVisibilityLayers: state.hiddenVisibilityLayers.includes(layer)
              ? state.hiddenVisibilityLayers.filter((l) => l !== layer)
              : [...state.hiddenVisibilityLayers, layer],
          })),
        setHiddenVisibilityLayers: (hiddenVisibilityLayers) => set({ hiddenVisibilityLayers }),
        setActiveHypothesisIds: (activeHypothesisIds) => set({ activeHypothesisIds }),
        requestScreenshot: () => set({ screenshotRequest: Date.now() }),
        clearScreenshotRequest: () => set({ screenshotRequest: null }),
        setActiveLocationId: (activeLocationId) => set({ activeLocationId }),
        setSelectedObjectId: (selectedObjectId) => set({ selectedObjectId }),
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
      {
        name: 'giza-session',
        version: 2,
        partialize: (state) =>
          Object.fromEntries(PERSISTED_KEYS.map((key) => [key, state[key]])) as Partial<AppState>,
        migrate: (persisted, version) => {
          const state = (persisted ?? {}) as Partial<AppState>;
          // v1 defaulted to the Osiris Shaft monument with an underground camera
          // target. v2 makes the Great Pyramid the default view; adopt the new
          // defaults for users who never explicitly switched monuments.
          if (version < 2) {
            if (state.activeMonument === undefined || state.activeMonument === 'osiris') {
              state.activeMonument = 'great-pyramid';
            }
            if (
              state.cameraTarget === undefined ||
              (state.cameraTarget.x === 0 &&
                state.cameraTarget.y === -15 &&
                state.cameraTarget.z === 2)
            ) {
              state.cameraTarget = { x: 0, y: 70, z: 0 };
            }
          }
          return state;
        },
      },
    ),
    { name: 'GIZA App Store' },
  ),
);

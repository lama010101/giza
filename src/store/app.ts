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

/**
 * Conceptual layer taxonomy (M05-T05).
 * These tags describe *what kind* of geometry is being shown, independent of
 * the storage-level `SCENE_LAYERS` used by the layer panel.
 */
export const CONCEPTUAL_LAYERS = [
  'Geometry',
  'Modern',
  'Water',
  'Geology',
  'Evidence',
  'Theory',
  'Simulation',
  'Annotations',
] as const;
export type ConceptualLayer = (typeof CONCEPTUAL_LAYERS)[number];

/**
 * Maps each scene/storage layer to the conceptual layers it participates in.
 * `level-0` is intentionally included even though it is not a `SceneLayer`.
 */
export const LAYER_TO_CONCEPTUAL_LAYERS: Record<string, ConceptualLayer[]> = {
  'level-0': ['Geometry', 'Modern', 'Annotations'],
  shafts: ['Geometry', 'Evidence'],
  'level-1': ['Geometry', 'Evidence'],
  'level-2': ['Geometry', 'Evidence'],
  'level-3': ['Geometry', 'Evidence', 'Water'],
  monument: ['Geometry', 'Annotations'],
  exterior: ['Geometry'],
  passages: ['Geometry'],
  subterranean: ['Geometry', 'Geology'],
  gallery: ['Geometry'],
  'kings-complex': ['Geometry'],
  'queens-complex': ['Geometry'],
  relieving: ['Geometry', 'Theory'],
};

export function getConceptualLayersForLayer(layer: string): ConceptualLayer[] {
  return LAYER_TO_CONCEPTUAL_LAYERS[layer] ?? ['Geometry'];
}

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
  lod: LODLevel;
  microDetailEnabled: boolean;
  setLOD: (lod: LODLevel) => void;
  setMode: (mode: AppMode) => void;
  setActiveMonument: (monument: Monument) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (target: Vector3) => void;
  toggleLayer: (layer: SceneLayer) => void;
  setHiddenLayers: (layers: SceneLayer[]) => void;
  setMicroDetailEnabled: (enabled: boolean) => void;
  setActiveHypothesisIds: (ids: string[]) => void;
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
  'lod',
  'microDetailEnabled',
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
        lod: 'LOD0',
        microDetailEnabled: false,
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
        setMicroDetailEnabled: (microDetailEnabled) => set({ microDetailEnabled }),
        setActiveHypothesisIds: (activeHypothesisIds) => set({ activeHypothesisIds }),
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

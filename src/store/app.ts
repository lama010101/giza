import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Vector3 } from '@/schemas/location';
import type { LODLevel } from '@/loaders/validators';
import { createBookmark, type Bookmark } from '@/evidence/bookmark';
import type { MeasurementType } from '@/evidence/measurement';

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
export type SidePanelTab = 'scene' | 'evidence' | 'simulation' | 'hypothesis' | 'search';

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
  measurementType: MeasurementType;
  measurementStart: Vector3 | null;
  measurementEnd: Vector3 | null;
  measurementThird: Vector3 | null;
  bookmarkedObjectIds: string[];
  bookmarks: Bookmark[];
  cameraMode: CameraMode;
  cameraTarget: Vector3;
  cameraPosition: Vector3;
  hiddenLayers: SceneLayer[];
  hiddenVisibilityLayers: VisibilityLayer[];
  lod: LODLevel;
  screenshotRequest: number | null;
  setLOD: (lod: LODLevel) => void;
  setMode: (mode: AppMode) => void;
  setActiveMonument: (monument: Monument) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (target: Vector3) => void;
  setCameraPosition: (position: Vector3) => void;
  addBookmark: (name: string, notes?: string) => void;
  deleteBookmark: (id: string) => void;
  restoreBookmark: (id: string) => void;
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
  setMeasurementType: (type: MeasurementType) => void;
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
  'bookmarks',
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
        measurementType: 'distance',
        measurementStart: null,
        measurementEnd: null,
        measurementThird: null,
        bookmarkedObjectIds: [],
        bookmarks: [],
        cameraMode: 'orbit',
        cameraTarget: { x: 0, y: 70, z: 0 },
        cameraPosition: { x: 0, y: 70, z: 100 },
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
        setCameraPosition: (cameraPosition) => set({ cameraPosition }),
        addBookmark: (name, notes = '') =>
          set((state) => {
            const visibleLayers = SCENE_LAYERS.filter((l) => !state.hiddenLayers.includes(l));
            const hiddenLayers = state.hiddenLayers.slice();
            const bookmark = createBookmark({
              id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name,
              camera: {
                position: state.cameraPosition,
                target: state.cameraTarget,
                mode: state.cameraMode,
              },
              visibleLayers,
              hiddenLayers,
              activeHypothesisIds: state.activeHypothesisIds,
              hiddenVisibilityLayers: state.hiddenVisibilityLayers,
              selectedObjectId: state.selectedObjectId,
              selectedEvidenceId: state.selectedEvidenceId,
              notes,
            });
            return { bookmarks: [...state.bookmarks, bookmark] };
          }),
        deleteBookmark: (id) =>
          set((state) => ({ bookmarks: state.bookmarks.filter((bm) => bm.id !== id) })),
        restoreBookmark: (id) =>
          set((state) => {
            const bm = state.bookmarks.find((b) => b.id === id);
            if (!bm) return {};
            return {
              cameraPosition: bm.camera.position,
              cameraTarget: bm.camera.target,
              cameraMode: bm.camera.mode as CameraMode,
              hiddenLayers: bm.hiddenLayers.slice() as SceneLayer[],
              hiddenVisibilityLayers:
                (bm.hiddenVisibilityLayers.slice() as VisibilityLayer[]) ?? [],
              activeHypothesisIds: bm.activeHypothesisIds.slice(),
              selectedObjectId: bm.selectedObjectId ?? null,
              selectedEvidenceId: bm.selectedEvidenceId ?? null,
            };
          }),
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
              : {
                  measurementMode,
                  measurementType: 'distance',
                  measurementStart: null,
                  measurementEnd: null,
                  measurementThird: null,
                },
          ),
        setMeasurementType: (measurementType) => set({ measurementType }),
        addMeasurementPoint: (point) =>
          set((state) => {
            if (state.measurementStart === null) return { measurementStart: point };
            if (state.measurementEnd === null) return { measurementEnd: point };
            if (state.measurementThird === null) return { measurementThird: point };
            return { measurementStart: point, measurementEnd: null, measurementThird: null };
          }),
        clearMeasurement: () =>
          set({ measurementStart: null, measurementEnd: null, measurementThird: null }),
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

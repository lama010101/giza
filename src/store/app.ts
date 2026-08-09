import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Vector3 } from '@/schemas/location';
import type { LODLevel } from '@/loaders/validators';
import type { Measurement, MeasurementType } from '@/evidence/measurement';
import {
  createAngleMeasurement,
  createAreaMeasurement,
  createDistanceMeasurement,
  createHeightMeasurement,
  createVolumeMeasurement,
} from '@/evidence/measurement';

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
export type CrossSectionAxis = 'x' | 'y' | 'z';
export interface CrossSectionState {
  enabled: boolean;
  axis: CrossSectionAxis;
  offset: number;
}

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
  measurementPoints: Vector3[];
  measurementResult: Measurement | null;
  bookmarkedObjectIds: string[];
  cameraMode: CameraMode;
  cameraTarget: Vector3;
  cameraFov: number;
  cameraNear: number;
  hiddenLayers: SceneLayer[];
  isolatedLayer: SceneLayer | null;
  lod: LODLevel;
  crossSection: CrossSectionState;
  setLOD: (lod: LODLevel) => void;
  setMode: (mode: AppMode) => void;
  setActiveMonument: (monument: Monument) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (target: Vector3) => void;
  setCameraFov: (fov: number) => void;
  setCameraNear: (near: number) => void;
  toggleLayer: (layer: SceneLayer) => void;
  setHiddenLayers: (layers: SceneLayer[]) => void;
  setActiveHypothesisIds: (ids: string[]) => void;
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
  setCrossSection: (state: CrossSectionState) => void;
  setIsolatedLayer: (layer: SceneLayer | null) => void;
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
  'cameraFov',
  'cameraNear',
  'hiddenLayers',
  'isolatedLayer',
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
        measurementPoints: [],
        measurementResult: null,
        bookmarkedObjectIds: [],
        cameraMode: 'orbit',
        cameraTarget: { x: 0, y: 70, z: 0 },
        cameraFov: 55,
        cameraNear: 0.1,
        hiddenLayers: [],
        isolatedLayer: null,
        lod: 'LOD0',
        crossSection: { enabled: false, axis: 'y', offset: 0 },
        setLOD: (lod) => set({ lod }),
        setMode: (mode) => set({ mode }),
        setActiveMonument: (activeMonument) =>
          set({ activeMonument, cameraTarget: DEFAULT_CAMERA_TARGET[activeMonument] }),
        setCameraMode: (cameraMode) => set({ cameraMode }),
        setCameraTarget: (cameraTarget) => set({ cameraTarget }),
        setCameraFov: (cameraFov) => set({ cameraFov }),
        setCameraNear: (cameraNear) => set({ cameraNear }),
        toggleLayer: (layer) =>
          set((state) => ({
            hiddenLayers: state.hiddenLayers.includes(layer)
              ? state.hiddenLayers.filter((l) => l !== layer)
              : [...state.hiddenLayers, layer],
          })),
        setHiddenLayers: (hiddenLayers) => set({ hiddenLayers }),
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
              : {
                  measurementMode,
                  measurementStart: null,
                  measurementEnd: null,
                  measurementPoints: [],
                  measurementResult: null,
                },
          ),
        setMeasurementType: (measurementType) =>
          set({
            measurementType,
            measurementStart: null,
            measurementEnd: null,
            measurementPoints: [],
            measurementResult: null,
          }),
        addMeasurementPoint: (point) =>
          set((state) => {
            if (!state.measurementMode) return state;
            const pointsNeeded: Record<MeasurementType, number> = {
              distance: 2,
              height: 2,
              angle: 3,
              area: 3,
              volume: 2,
            };
            const needed = pointsNeeded[state.measurementType];
            const points =
              state.measurementPoints.length >= needed
                ? [point]
                : [...state.measurementPoints, point];
            const start = points[0] ?? null;
            const end = points.length > 1 ? points[points.length - 1] : null;
            let measurementResult: Measurement | null = null;
            switch (state.measurementType) {
              case 'distance':
                if (points.length === 2) {
                  measurementResult = createDistanceMeasurement(points[0], points[1]);
                }
                break;
              case 'height':
                if (points.length === 2) {
                  measurementResult = createHeightMeasurement(points[0], points[1]);
                }
                break;
              case 'angle':
                if (points.length === 3) {
                  measurementResult = createAngleMeasurement(points[0], points[1], points[2]);
                }
                break;
              case 'area':
                if (points.length === 3) {
                  measurementResult = createAreaMeasurement(points[0], points[1], points[2]);
                }
                break;
              case 'volume':
                if (points.length === 2) {
                  measurementResult = createVolumeMeasurement(points[0], points[1]);
                }
                break;
            }
            return {
              measurementPoints: points,
              measurementStart: start,
              measurementEnd: end,
              measurementResult,
            };
          }),
        clearMeasurement: () =>
          set({
            measurementStart: null,
            measurementEnd: null,
            measurementPoints: [],
            measurementResult: null,
          }),
        setCrossSection: (crossSection) => set({ crossSection }),
        setIsolatedLayer: (isolatedLayer) =>
          set((state) => {
            if (isolatedLayer === null) {
              return { isolatedLayer: null, hiddenLayers: [] };
            }
            const monumentLayers = MONUMENT_LAYERS[state.activeMonument];
            const hiddenLayers = monumentLayers.filter((layer) => layer !== isolatedLayer);
            return { isolatedLayer, hiddenLayers };
          }),
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

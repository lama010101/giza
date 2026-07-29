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

interface AppState {
  mode: AppMode;
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
  setMode: (mode: AppMode) => void;
  setCameraMode: (mode: CameraMode) => void;
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
      setMode: (mode) => set({ mode }),
      setCameraMode: (cameraMode) => set({ cameraMode }),
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

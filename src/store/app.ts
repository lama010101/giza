import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type AppMode =
  | 'Explore'
  | 'Guided'
  | 'Research'
  | 'Documentary'
  | 'Presentation'
  | 'Educational'
  | 'Museum'
  | 'Developer';

interface AppState {
  mode: AppMode;
  activeHypothesisIds: string[];
  activeLocationId: string | null;
  selectedEvidenceId: string | null;
  evidencePanelOpen: boolean;
  hoveredNodeId: string | null;
  setMode: (mode: AppMode) => void;
  setActiveHypothesisIds: (ids: string[]) => void;
  setActiveLocationId: (id: string | null) => void;
  setSelectedEvidenceId: (id: string | null) => void;
  setEvidencePanelOpen: (open: boolean) => void;
  setHoveredNodeId: (id: string | null) => void;
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
      setMode: (mode) => set({ mode }),
      setActiveHypothesisIds: (activeHypothesisIds) => set({ activeHypothesisIds }),
      setActiveLocationId: (activeLocationId) => set({ activeLocationId }),
      setSelectedEvidenceId: (selectedEvidenceId) => set({ selectedEvidenceId }),
      setEvidencePanelOpen: (evidencePanelOpen) => set({ evidencePanelOpen }),
      setHoveredNodeId: (hoveredNodeId) => set({ hoveredNodeId }),
    }),
    { name: 'GIZA App Store' },
  ),
);

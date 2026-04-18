import { create } from "zustand"
import type { Stadium, Scenario } from "./stadiums"

export type AppView = "globe" | "transition" | "dashboard"

interface AppState {
  view: AppView
  selectedStadium: Stadium | null
  selectedScenario: Scenario
  sessionId: string | null
  setView: (view: AppView) => void
  /** From globe: opens transition → dashboard. */
  selectStadium: (stadium: Stadium) => void
  /** From dashboard: updates stadium without leaving the audit view. */
  setSelectedStadium: (stadium: Stadium) => void
  setSelectedScenario: (scenario: Scenario) => void
  setSessionId: (id: string | null) => void
  goBackToGlobe: () => void
}

export const useAppState = create<AppState>((set) => ({
  view: "globe",
  selectedStadium: null,
  selectedScenario: "normal",
  sessionId: null,
  setView: (view) => set({ view }),
  selectStadium: (stadium) =>
    set({ selectedStadium: stadium, selectedScenario: stadium.signatureScenario, view: "transition" }),
  setSelectedStadium: (stadium) => set({ selectedStadium: stadium }),
  setSelectedScenario: (scenario) => set({ selectedScenario: scenario }),
  setSessionId: (id) => set({ sessionId: id }),
  goBackToGlobe: () => set({ view: "globe", selectedStadium: null, sessionId: null }),
}))

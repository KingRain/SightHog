import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReplayController } from "@/components/ReplayControls";
import type { HeatmapCell } from "@/lib/heatmap";

export interface ReplayState {
  currentTimeMs: number;
  sessionStartTimeMs: number;
  totalDurationMs: number;
  isPlaying: boolean;
  speed: number;
  selectedPageIndex: number | null;
  controller: ReplayController | null;
  heatmapEnabled: boolean;
  heatmapCells: HeatmapCell[];
  heatmapMaxClicks: number;
  heatmapLoading: boolean;
}

const initialState: ReplayState = {
  currentTimeMs: 0,
  sessionStartTimeMs: 0,
  totalDurationMs: 0,
  isPlaying: false,
  speed: 1,
  selectedPageIndex: null,
  controller: null,
  heatmapEnabled: false,
  heatmapCells: [],
  heatmapMaxClicks: 0,
  heatmapLoading: false,
};

const replaySlice = createSlice({
  name: "replay",
  initialState,
  reducers: {
    resetReplay(state) {
      const heatmapEnabled = state.heatmapEnabled;
      Object.assign(state, initialState);
      state.heatmapEnabled = heatmapEnabled;
    },
    setCurrentTimeMs(state, action: PayloadAction<number>) {
      state.currentTimeMs = action.payload;
    },
    setSessionStartTimeMs(state, action: PayloadAction<number>) {
      state.sessionStartTimeMs = action.payload;
    },
    setTotalDurationMs(state, action: PayloadAction<number>) {
      state.totalDurationMs = action.payload;
    },
    setIsPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
    setSpeed(state, action: PayloadAction<number>) {
      state.speed = action.payload;
    },
    setSelectedPageIndex(state, action: PayloadAction<number | null>) {
      state.selectedPageIndex = action.payload;
    },
    setController(state, action: PayloadAction<ReplayController | null>) {
      state.controller = action.payload;
    },
    setHeatmapEnabled(state, action: PayloadAction<boolean>) {
      state.heatmapEnabled = action.payload;
    },
    setHeatmapCells(
      state,
      action: PayloadAction<{ cells: HeatmapCell[]; maxClicks: number }>
    ) {
      state.heatmapCells = action.payload.cells;
      state.heatmapMaxClicks = action.payload.maxClicks;
    },
    setHeatmapLoading(state, action: PayloadAction<boolean>) {
      state.heatmapLoading = action.payload;
    },
    clearHeatmap(state) {
      state.heatmapCells = [];
      state.heatmapMaxClicks = 0;
      state.heatmapLoading = false;
    },
  },
});

export const {
  resetReplay,
  setCurrentTimeMs,
  setSessionStartTimeMs,
  setTotalDurationMs,
  setIsPlaying,
  setSpeed,
  setSelectedPageIndex,
  setController,
  setHeatmapEnabled,
  setHeatmapCells,
  setHeatmapLoading,
  clearHeatmap,
} = replaySlice.actions;

export default replaySlice.reducer;

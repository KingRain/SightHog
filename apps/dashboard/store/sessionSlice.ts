import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SessionMeta } from "@/components/SessionClientHeader";
import type { LogItem } from "@/components/TechTimeline";

export type { SessionMeta };
import type { TimelineMarker } from "@/lib/session-markers";

export interface SessionState {
  selectedSessionId: string | null;
  sessionMeta: SessionMeta | null;
  sessionEvents: unknown[];
  telemetryLogs: LogItem[];
  timelineMarkers: TimelineMarker[];
  loadingReplay: boolean;
  replayProcessing: boolean;
  replayWaitAttempt: number;
}

const initialState: SessionState = {
  selectedSessionId: null,
  sessionMeta: null,
  sessionEvents: [],
  telemetryLogs: [],
  timelineMarkers: [],
  loadingReplay: false,
  replayProcessing: false,
  replayWaitAttempt: 0,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    clearSessionView(state) {
      state.selectedSessionId = null;
      state.sessionMeta = null;
      state.sessionEvents = [];
      state.telemetryLogs = [];
      state.timelineMarkers = [];
      state.loadingReplay = false;
      state.replayProcessing = false;
      state.replayWaitAttempt = 0;
    },
    setSelectedSessionId(state, action: PayloadAction<string | null>) {
      state.selectedSessionId = action.payload;
    },
    setSessionMeta(state, action: PayloadAction<SessionMeta | null>) {
      state.sessionMeta = action.payload;
    },
    setSessionEvents(state, action: PayloadAction<unknown[]>) {
      state.sessionEvents = action.payload;
    },
    setTelemetryLogs(state, action: PayloadAction<LogItem[]>) {
      state.telemetryLogs = action.payload;
    },
    setTimelineMarkers(state, action: PayloadAction<TimelineMarker[]>) {
      state.timelineMarkers = action.payload;
    },
    setLoadingReplay(state, action: PayloadAction<boolean>) {
      state.loadingReplay = action.payload;
    },
    setReplayProcessing(state, action: PayloadAction<boolean>) {
      state.replayProcessing = action.payload;
    },
    setReplayWaitAttempt(state, action: PayloadAction<number>) {
      state.replayWaitAttempt = action.payload;
    },
  },
});

export const {
  clearSessionView,
  setSelectedSessionId,
  setSessionMeta,
  setSessionEvents,
  setTelemetryLogs,
  setTimelineMarkers,
  setLoadingReplay,
  setReplayProcessing,
  setReplayWaitAttempt,
} = sessionSlice.actions;

export default sessionSlice.reducer;

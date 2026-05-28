package writer

import "testing"

func TestMergeEventsPreservesFullSnapshot(t *testing.T) {
	fullSnapshot := map[string]any{"type": 2, "timestamp": float64(100)}
	incremental := map[string]any{"type": 3, "timestamp": float64(200)}

	merged := MergeEvents([]any{fullSnapshot}, []any{incremental})
	if len(merged) != 2 {
		t.Fatalf("expected 2 events, got %d", len(merged))
	}
	if !HasFullSnapshot(merged) {
		t.Fatal("expected merged replay to contain a full snapshot")
	}
	if eventTimestamp(merged[0]) != 100 || eventTimestamp(merged[1]) != 200 {
		t.Fatalf("expected sorted timestamps, got %v and %v", eventTimestamp(merged[0]), eventTimestamp(merged[1]))
	}
}

func TestMergeEventsSortsOutOfOrderBatches(t *testing.T) {
	laterBatch := []any{
		map[string]any{"type": 3, "timestamp": float64(300)},
	}
	earlierBatch := []any{
		map[string]any{"type": 2, "timestamp": float64(100)},
		map[string]any{"type": 3, "timestamp": float64(150)},
	}

	merged := MergeEvents(laterBatch, earlierBatch)
	if eventTimestamp(merged[0]) != 100 {
		t.Fatalf("expected first event at t=100, got %d", eventTimestamp(merged[0]))
	}
	if eventTimestamp(merged[len(merged)-1]) != 300 {
		t.Fatalf("expected last event at t=300, got %d", eventTimestamp(merged[len(merged)-1]))
	}
}

func TestHasFullSnapshot(t *testing.T) {
	if HasFullSnapshot([]any{map[string]any{"type": 3, "timestamp": float64(1)}}) {
		t.Fatal("incremental-only replay should not have full snapshot")
	}
	if !HasFullSnapshot([]any{map[string]any{"type": 2, "timestamp": float64(1)}}) {
		t.Fatal("expected full snapshot detection")
	}
}

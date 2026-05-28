package writer

import "sort"

const rrwebFullSnapshotType = 2

func eventTimestamp(event any) int64 {
	m, ok := event.(map[string]any)
	if !ok {
		return 0
	}

	switch ts := m["timestamp"].(type) {
	case float64:
		return int64(ts)
	case int64:
		return ts
	case int:
		return int64(ts)
	default:
		return 0
	}
}

func eventType(event any) int {
	m, ok := event.(map[string]any)
	if !ok {
		return 0
	}

	switch t := m["type"].(type) {
	case float64:
		return int(t)
	case int:
		return t
	case int64:
		return int(t)
	default:
		return 0
	}
}

func SortEventsByTimestamp(events []any) {
	sort.Slice(events, func(i, j int) bool {
		return eventTimestamp(events[i]) < eventTimestamp(events[j])
	})
}

func MergeEvents(existing, incoming []any) []any {
	if len(existing) == 0 {
		merged := append([]any(nil), incoming...)
		SortEventsByTimestamp(merged)
		return merged
	}
	if len(incoming) == 0 {
		merged := append([]any(nil), existing...)
		SortEventsByTimestamp(merged)
		return merged
	}

	merged := append(append([]any{}, existing...), incoming...)
	SortEventsByTimestamp(merged)
	return merged
}

func HasFullSnapshot(events []any) bool {
	for _, event := range events {
		if eventType(event) == rrwebFullSnapshotType {
			return true
		}
	}
	return false
}

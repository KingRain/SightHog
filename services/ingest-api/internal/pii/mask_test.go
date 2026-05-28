package pii

import "testing"

func TestMaskValue(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "credit card",
			input: "card 4111 1111 1111 1111 end",
			want:  "card [REDACTED_CARD] end",
		},
		{
			name:  "ssn",
			input: "ssn 123-45-6789 here",
			want:  "ssn [REDACTED_SSN] here",
		},
		{
			name:  "email",
			input: "contact jane@example.com please",
			want:  "contact [REDACTED_EMAIL] please",
		},
		{
			name:  "ttfb metric",
			input: "TTFB: 847",
			want:  "TTFB: 847",
		},
		{
			name:  "long numeric metric without luhn",
			input: "TTFB: 1234567890123",
			want:  "TTFB: 1234567890123",
		},
		{
			name:  "timestamp-like sequence",
			input: "LCP: 2500.5 at 1710000000000",
			want:  "LCP: 2500.5 at 1710000000000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := MaskValue(tt.input)
			if got != tt.want {
				t.Fatalf("MaskValue() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestPassesLuhn(t *testing.T) {
	if !passesLuhn("4111111111111111") {
		t.Fatal("expected valid visa test number to pass luhn")
	}
	if passesLuhn("1234567890123") {
		t.Fatal("expected invalid sequence to fail luhn")
	}
}

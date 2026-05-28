package pii

import (
	"regexp"
	"strings"
	"unicode"
)

var (
	creditCardCandidatePattern = regexp.MustCompile(`\b(?:\d[ -]*?){13,19}\b`)
	ssnPattern                 = regexp.MustCompile(`\b\d{3}-\d{2}-\d{4}\b`)
	emailPattern               = regexp.MustCompile(`\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b`)
)

func MaskValue(value string) string {
	masked := maskCreditCards(value)
	masked = ssnPattern.ReplaceAllString(masked, "[REDACTED_SSN]")
	masked = emailPattern.ReplaceAllString(masked, "[REDACTED_EMAIL]")
	return masked
}

func maskCreditCards(value string) string {
	return creditCardCandidatePattern.ReplaceAllStringFunc(value, func(match string) string {
		digits := extractDigits(match)
		if len(digits) < 13 || len(digits) > 19 {
			return match
		}
		if !passesLuhn(digits) {
			return match
		}
		return "[REDACTED_CARD]"
	})
}

func extractDigits(value string) string {
	var digits strings.Builder
	for _, r := range value {
		if unicode.IsDigit(r) {
			digits.WriteRune(r)
		}
	}
	return digits.String()
}

func passesLuhn(number string) bool {
	if len(number) < 13 {
		return false
	}

	sum := 0
	double := false
	for i := len(number) - 1; i >= 0; i-- {
		digit := int(number[i] - '0')
		if double {
			digit *= 2
			if digit > 9 {
				digit -= 9
			}
		}
		sum += digit
		double = !double
	}
	return sum%10 == 0
}

func MaskAny(value any) any {
	switch v := value.(type) {
	case string:
		return MaskValue(v)
	case map[string]any:
		return MaskMap(v)
	case []any:
		return MaskSlice(v)
	default:
		return value
	}
}

func MaskMap(input map[string]any) map[string]any {
	out := make(map[string]any, len(input))
	for key, value := range input {
		out[key] = MaskAny(value)
	}
	return out
}

func MaskSlice(input []any) []any {
	out := make([]any, len(input))
	for i, value := range input {
		out[i] = MaskAny(value)
	}
	return out
}

func MaskEvents(events []any) []any {
	return MaskSlice(events)
}

func MaskInteractions(interactions []map[string]any) []map[string]any {
	out := make([]map[string]any, len(interactions))
	for i, interaction := range interactions {
		masked := MaskMap(interaction)
		out[i] = masked
	}
	return out
}

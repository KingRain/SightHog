package useragent

import (
	"strings"

	"github.com/mileusna/useragent"
)

const unknown = "Unknown"

func ParseBrowserOS(ua string) (browser string, os string) {
	ua = strings.TrimSpace(ua)
	if ua == "" {
		return unknown, unknown
	}

	parsed := useragent.Parse(ua)
	browser = strings.TrimSpace(parsed.Name)
	osName := strings.TrimSpace(parsed.OS)

	if browser == "" {
		browser = unknown
	}
	if osName == "" {
		osName = unknown
	}

	return browser, osName
}

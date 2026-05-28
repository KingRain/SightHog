package geoip

import (
	"log/slog"
	"net"
	"strings"

	"github.com/oschwald/geoip2-golang"
)

const UnknownCountry = "Unknown"

type Resolver struct {
	db     *geoip2.Reader
	logger *slog.Logger
}

func NewResolver(dbPath string, logger *slog.Logger) *Resolver {
	if dbPath == "" {
		logger.Info("geoip disabled: GEOLITE2_DB_PATH not set")
		return &Resolver{logger: logger}
	}

	db, err := geoip2.Open(dbPath)
	if err != nil {
		logger.Warn("geoip database unavailable; country will be Unknown", "path", dbPath, "error", err)
		return &Resolver{logger: logger}
	}

	logger.Info("geoip resolver ready", "path", dbPath)
	return &Resolver{db: db, logger: logger}
}

func (r *Resolver) Close() {
	if r == nil || r.db == nil {
		return
	}
	_ = r.db.Close()
}

func (r *Resolver) CountryCode(ip string) string {
	if r == nil || r.db == nil {
		return UnknownCountry
	}

	ip = strings.TrimSpace(ip)
	if ip == "" {
		return UnknownCountry
	}

	host := ip
	if strings.Contains(ip, ",") {
		host = strings.TrimSpace(strings.Split(ip, ",")[0])
	}

	parsed := net.ParseIP(host)
	if parsed == nil {
		return UnknownCountry
	}

	if parsed.IsLoopback() || parsed.IsPrivate() {
		return "LOCAL"
	}

	record, err := r.db.Country(parsed)
	if err != nil || record == nil {
		return UnknownCountry
	}

	code := strings.ToUpper(strings.TrimSpace(record.Country.IsoCode))
	if code == "" {
		return UnknownCountry
	}
	return code
}

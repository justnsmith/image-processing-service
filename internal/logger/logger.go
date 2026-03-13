package logger

import (
	"log/slog"
	"os"
	"strings"
)

// Init configures the global slog logger.
//
// Format is controlled by LOG_FORMAT (json|text).
// Defaults to JSON when GIN_MODE=release, text otherwise.
//
// Level is controlled by LOG_LEVEL (debug|info|warn|error).
// Defaults to info.
func Init() {
	opts := &slog.HandlerOptions{Level: parseLevel(os.Getenv("LOG_LEVEL"))}

	var handler slog.Handler
	if useJSON() {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	slog.SetDefault(slog.New(handler))
}

func useJSON() bool {
	switch strings.ToLower(os.Getenv("LOG_FORMAT")) {
	case "json":
		return true
	case "text":
		return false
	}
	return os.Getenv("GIN_MODE") == "release"
}

func parseLevel(s string) slog.Level {
	switch strings.ToLower(s) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

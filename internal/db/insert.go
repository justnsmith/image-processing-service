package db

import (
	"context"
	"time"
	"github.com/jackc/pgx/v4"
)

type ImageMeta struct {
	FileName    string
	URL         string
	Size        int64
	Uploaded    time.Time
	ContentType string
	Width       int
	Height      int
	UserID      string
}

func InsertImageMeta(ctx context.Context, conn *pgx.Conn, meta ImageMeta) error {
	_, err := conn.Exec(ctx,
		`INSERT INTO images (file_name, url, size, uploaded, content_type, width, height, user_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		meta.FileName, meta.URL, meta.Size, meta.Uploaded, meta.ContentType, meta.Width, meta.Height, meta.UserID,
	)
	return err
}

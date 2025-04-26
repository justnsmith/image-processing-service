package db

import (
	"context"
	"github.com/jackc/pgx/v4"
)

// GetImageMetaByFileName retrieves image metadata from the database by filename
func GetImageMetaByFileName(ctx context.Context, conn *pgx.Conn, fileName string) (ImageMeta, error) {
	var meta ImageMeta
	err := conn.QueryRow(ctx,
		`SELECT file_name, url, size, uploaded, content_type, width, height, user_id
		 FROM images WHERE file_name = $1 ORDER BY uploaded DESC LIMIT 1`,
		fileName).Scan(
		&meta.FileName, &meta.URL, &meta.Size, &meta.Uploaded,
		&meta.ContentType, &meta.Width, &meta.Height, &meta.UserID,
	)
	return meta, err
}

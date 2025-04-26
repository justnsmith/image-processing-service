package db

import (
	"context"
	"errors"
)

func DeleteImage(imageID string, userID string) error {
	conn, err := connectToDB()
	if err != nil {
		return err
	}
	defer conn.Close(context.Background())

	// First, verify the image belongs to the user
	var exists bool
	err = conn.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM images WHERE id = $1 AND user_id = $2)",
		imageID, userID).Scan(&exists)

	if err != nil {
		return err
	}

	if !exists {
		return errors.New("image not found or does not belong to the user")
	}

	// Delete the image
	_, err = conn.Exec(context.Background(),
		"DELETE FROM images WHERE id = $1 AND user_id = $2",
		imageID, userID)

	return err
}

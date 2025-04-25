package processor

import (
	"bytes"
	"image"
	"fmt"

	"image/jpeg"
	_ "image/png"
	_ "image/gif"

	"github.com/disintegration/imaging"
)

// ResizeImage resizes the given image to the specified width, maintaining aspect ratio.
func ResizeImage(img image.Image, width int) image.Image {
	return imaging.Resize(img, width, 0, imaging.Lanczos)
}

// CompressJPEG compresses the image using JPEG format
func CompressJPEG(img image.Image, quality int) ([]byte, error) {
	buf := new(bytes.Buffer)
	opts := jpeg.Options{Quality: quality}
	err := jpeg.Encode(buf, img, &opts)
	return buf.Bytes(), err
}

// DecodeImage decodes an image from a byte slice.
func DecodeImage(data []byte) (image.Image, error) {
	reader := bytes.NewReader(data)

	img, _, err := image.Decode(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	return img, nil
}

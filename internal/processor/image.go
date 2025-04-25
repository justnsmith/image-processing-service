package processor

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"strconv"
	"strings"

	"github.com/nfnt/resize"
)

// ResizeImage resizes an image to the specified width using nearest-neighbor scaling
func ResizeImage(img image.Image, width uint) image.Image {
	// Resize the image using the nearest-neighbor algorithm
	newImg := resize.Resize(width, 0, img, resize.NearestNeighbor)
	return newImg
}

// DecodeImage decodes an image from byte data
func DecodeImage(data []byte) (image.Image, string, error) {
	img, format, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, "", err
	}
	return img, format, nil
}

// CompressJPEG compresses the image to JPEG format with a given quality
func CompressJPEG(img image.Image, quality int) ([]byte, error) {
	var buf bytes.Buffer
	err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// CropImage crops an image to the specified rectangle
func CropImage(img image.Image, x, y, width, height int) image.Image {
	// Return the original if there are invalid dimensions
	if width <= 0 || height <= 0 {
		return img
	}

	bounds := img.Bounds()
	if x < bounds.Min.X {
		x = bounds.Min.X
	}
	if y < bounds.Min.Y {
		y = bounds.Min.Y
	}
	if x+width > bounds.Max.X {
		width = bounds.Max.X - x
	}
	if y+height > bounds.Max.Y {
		height = bounds.Max.Y - y
	}

	// Create a new image with the cropped dimensions
	cropImg := image.NewRGBA(image.Rect(0, 0, width, height))

	// Copy pixels from the original image to the cropped one
	for cy := 0; cy < height; cy++ {
		for cx := 0; cx < width; cx++ {
			cropImg.Set(cx, cy, img.At(x+cx, y+cy))
		}
	}

	return cropImg
}

// AddTint applies a color tint to the image
func AddTint(img image.Image, tintColor color.Color) image.Image {
	bounds := img.Bounds()
	newImg := image.NewRGBA(bounds)
	// Apply tint color to each pixel
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			origColor := img.At(x, y)
			r, g, b, a := origColor.RGBA()
			tintR, tintG, tintB, tintA := tintColor.RGBA()
			newColor := color.RGBA{
				R: uint8((r + tintR) / 2),
				G: uint8((g + tintG) / 2),
				B: uint8((b + tintB) / 2),
				A: uint8((a + tintA) / 2),
			}
			newImg.Set(x, y, newColor)
		}
	}
	return newImg
}

// ParseHexColor converts a hex color string to color.RGBA
func ParseHexColor(hexColor string) (color.RGBA, error) {
	if !strings.HasPrefix(hexColor, "#") || len(hexColor) != 7 {
		return color.RGBA{}, fmt.Errorf("invalid hex color format")
	}

	r, err := strconv.ParseUint(hexColor[1:3], 16, 8)
	if err != nil {
		return color.RGBA{}, err
	}
	g, err := strconv.ParseUint(hexColor[3:5], 16, 8)
	if err != nil {
		return color.RGBA{}, err
	}
	b, err := strconv.ParseUint(hexColor[5:7], 16, 8)
	if err != nil {
		return color.RGBA{}, err
	}

	return color.RGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: 255}, nil
}

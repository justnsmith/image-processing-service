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

// Resizes an image to the specified width using nearest-neighbor scaling
func ResizeImage(img image.Image, width uint) image.Image {
	newImg := resize.Resize(width, 0, img, resize.NearestNeighbor)
	return newImg
}

// Decodes an image from a byte slice and returns the image and its format
func DecodeImage(data []byte) (image.Image, string, error) {
	img, format, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, "", err
	}
	return img, format, nil
}

// Compresses the image to JPEG format with a given quality
func CompressJPEG(img image.Image, quality int) ([]byte, error) {
	var buf bytes.Buffer
	err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// Crops an image to the specified rectangle
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

// Applies a color tint to the image with intensity control
func AddTint(img image.Image, tintColor color.Color) image.Image {
    bounds := img.Bounds()
    newImg := image.NewRGBA(bounds)

    // Get tint color components (16-bit values)
    tintR, tintG, tintB, _ := tintColor.RGBA()

    // Convert to 0-1 range for easier blending
    tR := float64(tintR) / 65535.0
    tG := float64(tintG) / 65535.0
    tB := float64(tintB) / 65535.0

    // Tint intensity (0.0 - 1.0)
    intensity := 0.3

    for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
        for x := bounds.Min.X; x < bounds.Max.X; x++ {
            origColor := img.At(x, y)
            r, g, b, a := origColor.RGBA()

            // Convert original to 0-1 range
            oR := float64(r) / 65535.0
            oG := float64(g) / 65535.0
            oB := float64(b) / 65535.0

            // Blend original with tint
            blendR := oR*(1-intensity) + tR*intensity
            blendG := oG*(1-intensity) + tG*intensity
            blendB := oB*(1-intensity) + tB*intensity

            // Convert back to 8-bit color
            newColor := color.RGBA{
                R: uint8(blendR * 255),
                G: uint8(blendG * 255),
                B: uint8(blendB * 255),
                A: uint8(a / 256),
            }
            newImg.Set(x, y, newColor)
        }
    }
    return newImg
}

// Converts a hex color string to color.RGBA
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

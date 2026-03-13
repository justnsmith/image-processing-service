package processor

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"
)

// newSolidImage creates a w×h image filled with a uniform color.
func newSolidImage(w, h int, c color.RGBA) *image.RGBA {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			img.Set(x, y, c)
		}
	}
	return img
}

func toJPEG(t *testing.T, img image.Image) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, nil); err != nil {
		t.Fatalf("encode JPEG: %v", err)
	}
	return buf.Bytes()
}

func toPNG(t *testing.T, img image.Image) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("encode PNG: %v", err)
	}
	return buf.Bytes()
}

// ---- DecodeImage ----------------------------------------------------------------

func TestDecodeImage_ValidJPEG(t *testing.T) {
	src := newSolidImage(80, 60, color.RGBA{R: 255, A: 255})
	img, format, err := DecodeImage(toJPEG(t, src))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if format != "jpeg" {
		t.Errorf("want format %q, got %q", "jpeg", format)
	}
	b := img.Bounds()
	if b.Dx() != 80 || b.Dy() != 60 {
		t.Errorf("want 80×60, got %d×%d", b.Dx(), b.Dy())
	}
}

func TestDecodeImage_ValidPNG(t *testing.T) {
	src := newSolidImage(40, 30, color.RGBA{G: 255, A: 255})
	img, format, err := DecodeImage(toPNG(t, src))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if format != "png" {
		t.Errorf("want format %q, got %q", "png", format)
	}
	b := img.Bounds()
	if b.Dx() != 40 || b.Dy() != 30 {
		t.Errorf("want 40×30, got %d×%d", b.Dx(), b.Dy())
	}
}

func TestDecodeImage_InvalidData(t *testing.T) {
	if _, _, err := DecodeImage([]byte("not an image")); err == nil {
		t.Error("expected error for invalid data, got nil")
	}
}

func TestDecodeImage_Empty(t *testing.T) {
	if _, _, err := DecodeImage([]byte{}); err == nil {
		t.Error("expected error for empty input, got nil")
	}
}

// ---- ResizeImage ----------------------------------------------------------------

func TestResizeImage_Width(t *testing.T) {
	src := newSolidImage(100, 100, color.RGBA{R: 128, G: 128, B: 128, A: 255})
	resized := ResizeImage(src, 50)
	if resized.Bounds().Dx() != 50 {
		t.Errorf("want width 50, got %d", resized.Bounds().Dx())
	}
}

func TestResizeImage_PreservesAspectRatio(t *testing.T) {
	// 200×100 → width 100 should give 100×50
	src := newSolidImage(200, 100, color.RGBA{A: 255})
	resized := ResizeImage(src, 100)
	b := resized.Bounds()
	if b.Dx() != 100 {
		t.Errorf("want width 100, got %d", b.Dx())
	}
	if b.Dy() != 50 {
		t.Errorf("want height 50, got %d", b.Dy())
	}
}

// ---- CompressJPEG ---------------------------------------------------------------

func TestCompressJPEG_ProducesOutput(t *testing.T) {
	src := newSolidImage(50, 50, color.RGBA{B: 200, A: 255})
	out, err := CompressJPEG(src, 80)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(out) == 0 {
		t.Error("expected non-empty JPEG output")
	}
}

func TestCompressJPEG_RoundTrip(t *testing.T) {
	src := newSolidImage(60, 40, color.RGBA{R: 100, G: 150, B: 200, A: 255})
	out, err := CompressJPEG(src, 90)
	if err != nil {
		t.Fatalf("compress: %v", err)
	}
	img, _, err := DecodeImage(out)
	if err != nil {
		t.Fatalf("decode: %v", err)
	}
	b := img.Bounds()
	if b.Dx() != 60 || b.Dy() != 40 {
		t.Errorf("want 60×40, got %d×%d", b.Dx(), b.Dy())
	}
}

// ---- CropImage ------------------------------------------------------------------

func TestCropImage_Normal(t *testing.T) {
	src := newSolidImage(100, 100, color.RGBA{R: 200, A: 255})
	cropped := CropImage(src, 10, 10, 50, 40)
	b := cropped.Bounds()
	if b.Dx() != 50 || b.Dy() != 40 {
		t.Errorf("want 50×40, got %d×%d", b.Dx(), b.Dy())
	}
}

func TestCropImage_ZeroWidth(t *testing.T) {
	src := newSolidImage(100, 100, color.RGBA{A: 255})
	if result := CropImage(src, 0, 0, 0, 50); result != src {
		t.Error("expected original image for zero width")
	}
}

func TestCropImage_ZeroHeight(t *testing.T) {
	src := newSolidImage(100, 100, color.RGBA{A: 255})
	if result := CropImage(src, 0, 0, 50, 0); result != src {
		t.Error("expected original image for zero height")
	}
}

func TestCropImage_NegativeWidth(t *testing.T) {
	src := newSolidImage(100, 100, color.RGBA{A: 255})
	if result := CropImage(src, 0, 0, -10, 50); result != src {
		t.Error("expected original image for negative width")
	}
}

func TestCropImage_ClampsToBounds(t *testing.T) {
	src := newSolidImage(100, 100, color.RGBA{A: 255})
	// Crop starting at (80,80) requesting 50×50 — should be clamped to 20×20
	cropped := CropImage(src, 80, 80, 50, 50)
	b := cropped.Bounds()
	if b.Dx() > 20 || b.Dy() > 20 {
		t.Errorf("expected clamped crop ≤20×20, got %d×%d", b.Dx(), b.Dy())
	}
}

func TestCropImage_FullImage(t *testing.T) {
	src := newSolidImage(100, 100, color.RGBA{G: 200, A: 255})
	cropped := CropImage(src, 0, 0, 100, 100)
	b := cropped.Bounds()
	if b.Dx() != 100 || b.Dy() != 100 {
		t.Errorf("want 100×100, got %d×%d", b.Dx(), b.Dy())
	}
}

func TestCropImage_PreservesPixelColors(t *testing.T) {
	// 4×4 image: top-left 2×2 is red, bottom-right 2×2 is blue
	img := image.NewRGBA(image.Rect(0, 0, 4, 4))
	for y := 0; y < 2; y++ {
		for x := 0; x < 2; x++ {
			img.Set(x, y, color.RGBA{R: 255, A: 255})
		}
	}
	for y := 2; y < 4; y++ {
		for x := 2; x < 4; x++ {
			img.Set(x, y, color.RGBA{B: 255, A: 255})
		}
	}

	// Crop the top-left red region
	cropped := CropImage(img, 0, 0, 2, 2)
	r, g, b, _ := cropped.At(0, 0).RGBA()
	if r == 0 || g != 0 || b != 0 {
		t.Errorf("expected red pixel at (0,0), got r=%d g=%d b=%d", r, g, b)
	}
}

// ---- AddTint --------------------------------------------------------------------

func TestAddTint_PreservesBounds(t *testing.T) {
	src := newSolidImage(30, 20, color.RGBA{R: 100, G: 100, B: 100, A: 255})
	tinted := AddTint(src, color.RGBA{G: 255, A: 255})
	b := tinted.Bounds()
	if b.Dx() != 30 || b.Dy() != 20 {
		t.Errorf("want 30×20, got %d×%d", b.Dx(), b.Dy())
	}
}

func TestAddTint_RedTintDominatesRedChannel(t *testing.T) {
	// Gray image — after a red tint the red channel should be highest
	src := newSolidImage(10, 10, color.RGBA{R: 128, G: 128, B: 128, A: 255})
	tinted := AddTint(src, color.RGBA{R: 255, G: 0, B: 0, A: 255})
	r, g, b, _ := tinted.At(0, 0).RGBA()
	if r <= g || r <= b {
		t.Errorf("expected R to dominate after red tint, got r=%d g=%d b=%d", r, g, b)
	}
}

func TestAddTint_BlueTintDominatesBlueChannel(t *testing.T) {
	src := newSolidImage(10, 10, color.RGBA{R: 128, G: 128, B: 128, A: 255})
	tinted := AddTint(src, color.RGBA{R: 0, G: 0, B: 255, A: 255})
	r, g, b, _ := tinted.At(0, 0).RGBA()
	if b <= r || b <= g {
		t.Errorf("expected B to dominate after blue tint, got r=%d g=%d b=%d", r, g, b)
	}
}

func TestAddTint_DoesNotChangeBlackToWhite(t *testing.T) {
	// A black image tinted with white should become lighter but not fully white
	// (intensity is 0.3, so result should be 0*0.7 + 255*0.3 ≈ 76)
	src := newSolidImage(5, 5, color.RGBA{R: 0, G: 0, B: 0, A: 255})
	tinted := AddTint(src, color.RGBA{R: 255, G: 255, B: 255, A: 255})
	r, _, _, _ := tinted.At(0, 0).RGBA()
	// r is 16-bit, convert to 8-bit equivalent
	r8 := uint8(r >> 8)
	if r8 == 0 {
		t.Error("expected tinted image to be lighter than pure black")
	}
	if r8 == 255 {
		t.Error("expected tinted image to not be pure white")
	}
}

// ---- ParseHexColor --------------------------------------------------------------

func TestParseHexColor_Valid(t *testing.T) {
	tests := []struct {
		input               string
		wantR, wantG, wantB uint8
	}{
		{"#ff0000", 255, 0, 0},
		{"#00ff00", 0, 255, 0},
		{"#0000ff", 0, 0, 255},
		{"#ffffff", 255, 255, 255},
		{"#000000", 0, 0, 0},
		{"#1a2b3c", 0x1a, 0x2b, 0x3c},
	}
	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			c, err := ParseHexColor(tc.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if c.R != tc.wantR || c.G != tc.wantG || c.B != tc.wantB {
				t.Errorf("want (%d,%d,%d), got (%d,%d,%d)",
					tc.wantR, tc.wantG, tc.wantB, c.R, c.G, c.B)
			}
			if c.A != 255 {
				t.Errorf("want alpha 255, got %d", c.A)
			}
		})
	}
}

func TestParseHexColor_MissingHash(t *testing.T) {
	if _, err := ParseHexColor("ff0000"); err == nil {
		t.Error("expected error for missing #")
	}
}

func TestParseHexColor_WrongLength(t *testing.T) {
	for _, s := range []string{"#fff", "#ff00ff0", "#ff000000"} {
		t.Run(s, func(t *testing.T) {
			if _, err := ParseHexColor(s); err == nil {
				t.Errorf("expected error for %q, got nil", s)
			}
		})
	}
}

func TestParseHexColor_InvalidHexChars(t *testing.T) {
	if _, err := ParseHexColor("#zzzzzz"); err == nil {
		t.Error("expected error for invalid hex characters")
	}
}

func TestParseHexColor_EmptyString(t *testing.T) {
	if _, err := ParseHexColor(""); err == nil {
		t.Error("expected error for empty string")
	}
}

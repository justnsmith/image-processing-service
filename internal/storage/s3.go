package storage

import (
	"bytes"
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var s3Client *s3.Client

func init() {
	// Load AWS default config
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("Unable to load AWS config: %v", err))
	}
	s3Client = s3.NewFromConfig(cfg)
}

// UploadToS3 uploads the file to S3 and returns the public URL
func UploadToS3(ctx context.Context, key string, file []byte) (string, error) {
	var bucketName = os.Getenv("AWS_BUCKET_NAME")

	_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
		Body:   bytes.NewReader(file),
	})
	if err != nil {
		return "", fmt.Errorf("put object failed: %w", err)
	}

	url := fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucketName, key)
	return url, nil
}

// DownloadFromS3 downloads the image from S3 using the provided key and returns the file content as a byte slice
func DownloadFromS3(ctx context.Context, key string) ([]byte, error) {
	var bucketName = os.Getenv("AWS_BUCKET_NAME")

	// Get the object from S3
	resp, err := s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to download object from S3: %w", err)
	}
	defer resp.Body.Close()

	// Read the content from the response body into a byte slice
	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Return the byte slice containing the image data
	return buf.Bytes(), nil
}

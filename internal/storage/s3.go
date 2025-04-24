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
	// Load AWS default config with region configured through aws configure
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

	// Return the public S3 URL
	url := fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucketName, key)
	return url, nil
}

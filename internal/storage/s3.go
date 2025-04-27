package storage

import (
	"bytes"
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var s3Client *s3.Client

func init() {
	// Retrieve AWS credentials from environment variables
	awsAccessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	awsSecretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	awsRegion := os.Getenv("AWS_REGION")

	// Set default region if not provided
	if awsRegion == "" {
		awsRegion = "us-west-2" // Default to us-west-2
	}

	var cfg aws.Config
	var err error

	if awsAccessKey != "" && awsSecretKey != "" {
		cfg, err = config.LoadDefaultConfig(context.Background(),
			config.WithRegion(awsRegion),
			config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				awsAccessKey,
				awsSecretKey,
				"",
			)),
		)
	} else {
		// Fall back to default credential chain
		cfg, err = config.LoadDefaultConfig(context.Background(),
			config.WithRegion(awsRegion),
		)
	}

	if err != nil {
		panic(fmt.Sprintf("Unable to load AWS config: %v", err))
	}

	s3Client = s3.NewFromConfig(cfg)
}

// UploadToS3 uploads the file to S3 and returns the public URL
func UploadToS3(ctx context.Context, key string, file []byte) (string, error) {
	var bucketName = os.Getenv("AWS_BUCKET_NAME")
	if bucketName == "" {
		return "", fmt.Errorf("AWS_BUCKET_NAME environment variable is not set")
	}

	_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(file),
		ContentType: aws.String(detectContentType(key)),
	})
	if err != nil {
		return "", fmt.Errorf("put object failed: %w", err)
	}

	// Generate URL based on region
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	var url string
	if region == "us-east-1" {
		url = fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucketName, key)
	} else {
		url = fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key)
	}

	return url, nil
}

// DownloadFromS3 downloads the file from S3 using the provided key and returns the file content as a byte slice
func DownloadFromS3(ctx context.Context, key string) ([]byte, error) {
	var bucketName = os.Getenv("AWS_BUCKET_NAME")
	if bucketName == "" {
		return nil, fmt.Errorf("AWS_BUCKET_NAME environment variable is not set")
	}

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

	// Return the byte slice containing the file data
	return buf.Bytes(), nil
}

// detectContentType attempts to determine the content type based on file extension
func detectContentType(key string) string {
	ext := ""
	for i := len(key) - 1; i >= 0 && key[i] != '.'; i-- {
		if key[i] == '.' {
			ext = key[i:]
			break
		}
	}

	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".pdf":
		return "application/pdf"
	case ".txt":
		return "text/plain"
	case ".html":
		return "text/html"
	case ".json":
		return "application/json"
	default:
		// If can't determine, use binary stream as default
		return "application/octet-stream"
	}
}

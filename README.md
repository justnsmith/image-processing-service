# Image Processing Service

A full-stack application that lets users upload and process images securely. Features include JWT authentication, background image processing, and cloud storage via S3. The platform handles everything from upload to delivery through an easy-to-use interface.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [Running Locally with Docker](#running-locally-with-docker)
- [Development](#development)
  - [Backend](#backend-development)
  - [Frontend](#frontend-development)
  - [Running CI Checks Locally](#running-ci-checks-locally)
- [Testing](#testing)
- [Observability](#observability)
- [Deployment](#deployment)
- [Design Choices](#design-choices)

## Features

### Secure Authentication
- Email verification flow on registration
- Secure password reset via email token
- JWT token-based session management

### Image Processing
- Resize to a target width (aspect ratio preserved)
- Crop with configurable x, y, width, height
- Color tinting
- Processing runs in a background worker queue (Redis-backed)
- 10 MB upload limit enforced on both client and server
- 20 image limit per user

### Storage & Data
- Original and processed images stored in Amazon S3
- Image metadata and user records in PostgreSQL
- Redis queue for background processing tasks

## Tech Stack

### Backend
- **Go 1.23** — main backend language
- **Gin** — HTTP framework
- **PostgreSQL** — primary database
- **Redis** — background job queue
- **Amazon S3** — image storage
- **JWT** — authentication tokens
- **Docker** — containerisation

### Frontend
- **React + TypeScript** — UI
- **Tailwind CSS** — styling
- **Vite** — build tool

## API Endpoints

### Public

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | /health                | Service health check               |
| POST   | /register              | Create a new user account          |
| POST   | /login                 | Authenticate and receive JWT       |
| POST   | /verify-email          | Verify email address with token    |
| POST   | /resend-verification   | Resend the verification email      |
| POST   | /forgot-password       | Request a password reset email     |
| POST   | /verify-reset-token    | Validate a password reset token    |
| POST   | /reset-password        | Set a new password with token      |

### Protected (requires `Authorization: Bearer <token>`)

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| GET    | /profile               | Get authenticated user's profile   |
| POST   | /upload                | Upload and queue an image          |
| GET    | /images                | List user's images                 |
| GET    | /images/count          | Get user's image count             |
| GET    | /images/:id/status     | Get processing status of an image  |
| DELETE | /images/:id            | Delete an image                    |

### Health Check

`GET /health` returns `200 OK` when all dependencies are reachable, or `503 Service Unavailable` when degraded:

```json
{
  "status": "ok",
  "checks": {
    "postgres": "ok",
    "redis": "ok"
  }
}
```

## Running Locally with Docker

### Prerequisites
- Docker and Docker Compose
- Git
- AWS credentials with S3 access

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/justnsmith/image-processing-service.git
   cd image-processing-service
   ```

2. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see `.env.example` for all required variables).

3. Start the application
   ```bash
   docker-compose up --build
   ```

4. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## Development

### Backend Development

```bash
go run ./cmd/main.go
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Running CI Checks Locally

A `scripts/ci.sh` script mirrors the GitHub Actions lint workflow so you can catch issues before pushing:

```bash
# Check formatting and linting
./scripts/ci.sh

# Auto-fix formatting issues
./scripts/ci.sh --fix
```

The script runs:
- **Go**: `gofmt` formatting check, `go vet`
- **C++**: `cppcheck` static analysis, `clang-format` formatting check (skipped if no C++ files are present)

Required tools: `go`, `gofmt` (included with Go). Optional: `cppcheck`, `clang-format` (for C++ checks).

## Testing

Tests are written using the Go standard `testing` package. No external test dependencies are required.

```bash
# Run all tests
go test ./...

# Run with verbose output
go test ./... -v

# Run a specific package
go test ./internal/processor/...
go test ./internal/handler/...
```

### Test Coverage

| Package | What's covered |
|---|---|
| `internal/processor` | `DecodeImage`, `ResizeImage`, `CompressJPEG`, `CropImage`, `AddTint`, `ParseHexColor` — full unit coverage including edge cases |
| `internal/handler` | Request validation paths, `AuthMiddleware` (missing/invalid/valid tokens), `HealthHandler` response contract, upload file size enforcement |

Handler tests cover all paths that return before any database call. Integration tests against a live database are out of scope for the unit test suite.

## Observability

### Structured Logging

The service uses Go's standard `log/slog` package. All log output is structured with typed key-value fields.

| Environment variable | Values | Default |
|---|---|---|
| `LOG_FORMAT` | `json`, `text` | `text` (or `json` when `GIN_MODE=release`) |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` |

Example JSON log line (production):
```json
{"time":"2026-03-13T10:00:00Z","level":"INFO","msg":"image processed successfully","image_id":"abc-123","user_id":"xyz-456"}
```

### Health Check

`GET /health` is suitable for use as a Docker/Kubernetes liveness or readiness probe. It checks connectivity to both PostgreSQL and Redis and returns a degraded status if either is unreachable.

## Deployment

1. Ensure all changes are on the `main` branch
2. Push to trigger CI
3. Deploy to your hosting provider (e.g. Render)

Required environment variables for production:

```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_SSLMODE
REDIS_URL
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION
JWT_SECRET
PORT (default: 8080)
GIN_MODE=release
LOG_FORMAT=json
```

## Design Choices

### Why Go for the Backend?
Go's performance and lightweight goroutines make it a good fit for image processing workloads — background workers can process images concurrently without significant memory overhead.

### Why React with TypeScript?
React's component model keeps the UI modular. TypeScript catches type errors at compile time, which is especially useful when working with the API response shapes.

### Why PostgreSQL?
Postgres reliably handles user data and image metadata. Its support for transactions is used directly in the email verification flow.

### Why Redis?
Redis acts as the job queue for background image processing. Tasks are enqueued on upload and consumed by the worker, so users don't wait for processing to complete before getting a response.

### Why S3?
S3 provides scalable, durable object storage without managing infrastructure. Both original and processed images are stored there and referenced by URL in the database.

### Why Docker?
Docker ensures the service runs consistently across development and production environments, with `docker-compose` wiring up the app, Postgres, and Redis together locally.

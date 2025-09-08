# Image Processing Service

A full-stack appliaction that lets users process images securly and quickly. Features include user authentication, efficient image processing, and reliable cloud storage. The platform handles everything from upload to delivery while maintaing data integrity and providing fast retrieval times, all through an easy-to-use user interface.

## Table of Contents

- [Features](#features)
  - [Secure Authentication](#secure-authentication)
  - [Secure Storage](#secure-storage)
  - [Image Processing](#image-processing)
- [Tech Stack](#tech-stack)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [API Endpoints](#api-endpoints)
- [Running Locally with Docker](#running-locally-with-docker)
  - [Prerequisites](#prerequisites)
  - [Setup Instructions](#setup-instructions)
- [Development](#development)
  - [Backend Development](#backend-development)
  - [Frontend Development](#frontend-development)
- [Deployment](#deployment)
- [Design Choices](#design-choices)

## Features

### Secure Authentication
- Complete user management with email verification system
- Secure password reset flow
- JWT token-based authentication
- User registration and account activation

### Secure Storage
- S3 bucket integration for scalable storage
- Redis caching for improved performance
- PostgreSQL metadata management
- 20 image count limit per user

### Image Processing
- Resize images with Go image packages
- Crop functionality with proper aspect ratios
- Filter application via backend processing
- Image tinting capabilities

## Tech Stack

### Backend
- **Go** - Main backend language
- **Gin Framework** - Web framework for Go
- **PostgreSQL** - Primary database
- **Redis** - Caching and rate limiting
- **Amazon S3** - Image storage
- **Docker** - Containerization
- **JWT** - Authentication

### Frontend
- **React** - Frontend library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## API Endpoints

| Method | Endpoint         | Description                 |
|--------|------------------|-----------------------------|
| POST   | /register        | Create new user account     |
| POST   | /login           | Authenticate user           |
| POST   | /verify-email    | Verify user email address   |
| POST   | /forgot-password | Request password reset      |
| POST   | /reset-password  | Set new password with token |
| POST   | /upload          | Upload a new image          |
| GET    | /images/:id      | Retrieve an image           |
| GET    | /images/count    | Get user's image count      |
| DELETE | /images/:id      | Delete an image             |

## Running Locally with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git

### Setup Instructions

1. Clone the repository
   ```bash
   git clone https://github.com/justnsmith/image-processing-service.git
   cd image-processing-service
   ```

2. Switch to dev-local branch
   ```bash
   git checkout dev-local
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your specific configuration values.

4. Start the application with Docker Compose
   ```bash
    docker-compose up --build
   ```

5. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## Development

### Backend Development

```bash
# Run backend only
cd backend
go run main.go
```

### Frontend Development

```bash
# Run frontend only
cd frontend
npm install
npm run dev
```

## Deployment

To deploy the application correctly, follow these steps:
1. Make sure you've committed all your changes to your `local-dev` branch
2. Push your changes to the main branch:
    ```bash
    # First switch to main branch
    git checkout main

    # Merge changes from local-dev branch
    git merge local-dev

    # Push changes to remote repository
    git push origin main
3. Once the changes are in the main branch, deploy to Render

## Design Choices

### Why Go for the Backend?
I went with Go because it's fast, simple, and handles multiple tasks at once really well. This is perfect for processing images iwthout eating up all the memory or CPU.

### Why React with TypeScript?
React lets me build with reusable pieces, which keeps things organized. TypeScript catches errors before they happen which saves a ton of debugging time and ensures type safety.

### Why PostgreSQL?
Postgres handles all of my user data and image info reliably. The JSON feature is also nice for storing flexible metadata.

### Why Redis?
Redis speeds everything up by remembering stuff that I use often, like images, login tokens, etc. It's also perfect for my worker queue system since it lets me process images in the background without making users have to wait.

### Why S3?
S3 just works for storing images. It scales automatically and doesn't go down, so I don't have to worry about storage servers.

### Why Docker?
Docker makes sure that everything runs the same way everywhere. It doesn't matter if its the development machine or the server. Makes development way easier.

FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install
COPY frontend/ ./
RUN yarn build

FROM golang:1.22-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
ENV GOTOOLCHAIN=auto
RUN go mod tidy
COPY . .
RUN go build -o main cmd/main.go

FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache bash ca-certificates tzdata
COPY --from=backend-builder /app/main .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
RUN touch .env
COPY schema.sql .
ENV AWS_REGION=us-west-2
EXPOSE 8080
CMD ["./main"]

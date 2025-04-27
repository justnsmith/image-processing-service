FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
ENV GOTOOLCHAIN=auto
RUN go mod tidy
COPY . .
RUN go build -o main cmd/main.go
FROM alpine:latest
WORKDIR /root/
RUN apk add --no-cache bash
COPY --from=builder /app/main .
COPY .env .
COPY schema.sql .
EXPOSE 8080
CMD ["./main"]

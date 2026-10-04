# Keep in sync with the `go` directive in go.mod.
FROM golang:1.22-alpine AS build

WORKDIR /src

ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod download

COPY . ./
RUN go build -trimpath -ldflags="-s -w" -o /out/server .

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -H -u 10001 app
ENV TZ=UTC

WORKDIR /app
COPY --from=build /out/server /app/server

# Configuration comes from environment variables, e.g.
#   docker run --env-file .env -p 8080:8080 boilerplate-backend:1.0.0
# Locale files are embedded in the binary.
USER app
EXPOSE 8080
ENTRYPOINT ["/app/server"]

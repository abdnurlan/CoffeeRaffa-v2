FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /app/server .

FROM alpine:3.20
WORKDIR /app
COPY --from=build /app/server /app/server
ENV DB_PATH=/data/db.sqlite3 MEDIA_ROOT=/var/www/images PORT=8000
VOLUME ["/data", "/var/www/images"]
EXPOSE 8000
CMD ["/app/server"]

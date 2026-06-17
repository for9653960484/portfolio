#!/usr/bin/env bash
set -euo pipefail

IMAGE="${IMAGE:-ghcr.io/for9653960484/portfolio:latest}"
CONTAINER="portfolio"
APP_DIR="/opt/portfolio"
HOST_PORT=8050

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "Missing $APP_DIR/.env — create it from .env.example before deploy."
  exit 1
fi

mkdir -p "$APP_DIR"

docker pull "$IMAGE"

sudo systemctl stop portfolio.service 2>/dev/null || true
sudo systemctl disable portfolio.service 2>/dev/null || true
docker stop "$CONTAINER" 2>/dev/null || true
docker rm "$CONTAINER" 2>/dev/null || true

docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  -p "${HOST_PORT}:8050" \
  --env-file "$APP_DIR/.env" \
  "$IMAGE"

docker image prune -f
docker ps --filter "name=$CONTAINER"

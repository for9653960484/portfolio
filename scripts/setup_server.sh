#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/portfolio"
IMAGE="${IMAGE:-ghcr.io/for9653960484/portfolio:latest}"
CONTAINER="portfolio"
HOST_PORT=8050

sudo apt update
sudo apt install -y ca-certificates curl

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  echo "Docker installed. Re-login may be required for group membership."
fi

sudo mkdir -p "$APP_DIR"

if [[ ! -f "$APP_DIR/.env" ]]; then
  sudo tee "$APP_DIR/.env" >/dev/null <<'EOF'
# Токен бота от @BotFather (для локального запуска бота на сервере)
TELEGRAM_BOT_TOKEN=your_bot_token_here
EOF
  echo "Created $APP_DIR/.env — fill real values before start."
fi

echo "Log in to GHCR before first deploy:"
echo "  echo <GHCR_TOKEN> | docker login ghcr.io -u <GHCR_USERNAME> --password-stdin"
echo ""
echo "Then pull and run:"
echo "  docker pull $IMAGE"
echo "  bash scripts/deploy.sh"

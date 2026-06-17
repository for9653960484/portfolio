#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/portfolio"
VENV_DIR="$APP_DIR/.venv"
SERVICE_NAME="portfolio.service"
BRANCH="main"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Directory $APP_DIR is not a git repo. Run setup_server.sh first."
  exit 1
fi

cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r requirements.txt

sudo systemctl daemon-reload
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager

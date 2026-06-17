#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/portfolio"
REPO_URL="${1:-https://github.com/for9653960484/portfolio.git}"

sudo apt update
sudo apt install -y python3 python3-venv python3-pip git

if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown -R "$USER":"$USER" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

if [[ ! -f "$APP_DIR/.env" ]]; then
  cp .env.example .env
  echo "Created $APP_DIR/.env from template. Fill real values before start."
fi

sudo tee /etc/systemd/system/portfolio.service >/dev/null <<'EOF'
[Unit]
Description=Portfolio Flask App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/portfolio
EnvironmentFile=/opt/portfolio/.env
ExecStart=/opt/portfolio/.venv/bin/gunicorn --workers 2 --bind 0.0.0.0:8050 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo chown -R www-data:www-data "$APP_DIR"
sudo systemctl daemon-reload
sudo systemctl enable portfolio.service
sudo systemctl start portfolio.service
sudo systemctl status portfolio.service --no-pager

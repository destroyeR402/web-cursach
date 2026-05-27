#!/usr/bin/env bash
# Простой деплой-скрипт: pull → install → migrate → restart
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/tv-schedule}"
SERVICE_NAME="${SERVICE_NAME:-tv-schedule}"

echo "[deploy] APP_DIR=$APP_DIR"
cd "$APP_DIR"

echo "[deploy] git pull"
git pull --ff-only

echo "[deploy] npm ci"
cd backend
npm ci --omit=dev

echo "[deploy] migrate (если есть новые миграции)"
npm run migrate || echo "[deploy] миграции не применились — проверьте вручную"

echo "[deploy] restart service"
sudo systemctl restart "$SERVICE_NAME"
sleep 2
sudo systemctl status "$SERVICE_NAME" --no-pager

echo "[deploy] OK"

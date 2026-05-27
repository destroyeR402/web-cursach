# Развёртывание

## Локально (dev)

```bash
cd backend
cp .env.example .env
# отредактировать PG_* и секреты в .env

createdb tv_schedule
npm install
npm run migrate
npm run seed
npm run dev      # http://localhost:3000
```

## Production (без Docker)

```bash
# 1. Сервер: установить Node.js 18+ и PostgreSQL 14+
# 2. Клонировать репозиторий
git clone <repo> /opt/tv-schedule
cd /opt/tv-schedule/backend

# 3. Окружение
cp .env.example .env
nano .env   # NODE_ENV=production, реальные секреты

# 4. Зависимости и БД
npm ci --omit=dev
createdb tv_schedule
npm run migrate
npm run seed   # опционально для первого запуска

# 5. Запуск через systemd (рекомендуется)
sudo systemctl enable --now tv-schedule
```

## systemd unit (`/etc/systemd/system/tv-schedule.service`)

```ini
[Unit]
Description=TV Schedule app
After=network.target postgresql.service

[Service]
Type=simple
User=tv-schedule
WorkingDirectory=/opt/tv-schedule/backend
EnvironmentFile=/opt/tv-schedule/backend/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Резервное копирование

```bash
# Полный дамп БД
pg_dump tv_schedule -F c -f /var/backups/tv_schedule_$(date +%F).dump

# Восстановление
pg_restore -d tv_schedule_new /var/backups/tv_schedule_2025-05-18.dump

# Загруженные файлы
tar czf /var/backups/uploads_$(date +%F).tar.gz /opt/tv-schedule/backend/public/images
```

## Reverse proxy (nginx)

```nginx
server {
  listen 80;
  server_name tv.example.com;
  client_max_body_size 6M;   # multer max 5MB + запас

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Проверка работоспособности

- `GET /health` → `{ ok: true, ts: ... }`
- Логи: `journalctl -u tv-schedule -f`
- Метрики БД: pgAdmin / `psql -c "SELECT * FROM pg_stat_activity"`

# Схема БД

PostgreSQL 14+. Полная схема — в `backend/database/schema.sql`.

## ER-обзор

```
roles ─────────────┐
                   │
                   ▼
                  users ──── channel_editors ──── channels
                   │                                  │
                   │  ┌───────────────┐               │
                   ├──│  favorites    │               │
                   │  │  subscriptions│               │
                   │  │  audit_logs   │               │
                   │  └───────────────┘               │
                   │                                  │
                   ▼                                  ▼
              broadcast_slots ◄─────── programs ─── genres
                                                 └── age_ratings
```

## Таблицы

### `roles` — RBAC
| Колонка | Тип | Описание |
| --- | --- | --- |
| id | SERIAL PK | |
| code | VARCHAR(32) UNIQUE | guest / client / editor / admin |
| name | VARCHAR(64) | человекочитаемое название |

### `users`
| Колонка | Тип | Примечание |
| --- | --- | --- |
| id | SERIAL PK | |
| email | UNIQUE | |
| username | UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt, saltRounds=10 |
| role_id | FK roles | |
| is_active | BOOL | блокировка администратором |
| last_login_at | TIMESTAMP | |
| failed_attempts | INT | счётчик неудачных входов |

### `channels` (категория, slug, лого через multer)
### `channel_editors` (M:N users × channels — закрепление редакторов)
### `programs` (title, description, poster_path, duration_min, genre_id, age_rating_id)
### `broadcast_slots` (channel_id, program_id, starts_at, ends_at, is_published, announcement)
### `favorites` (user × {channel|program})
### `subscriptions` (user × {channel|program|genre} + notify_email/push)
### `audit_logs` (user_id, action, entity, entity_id, meta JSONB, ip, user_agent)
### `session` — таблица сессий `connect-pg-simple`

## Индексы

- `idx_users_role`, `idx_users_active`
- `idx_channels_active`
- `idx_programs_title` — GIN полнотекст по `to_tsvector('russian', title)`
- `idx_slots_channel_time` — `(channel_id, starts_at)` для выбора суток
- `idx_slots_published` — `(is_published, starts_at)` для гостевой выдачи
- `idx_audit_created` — `created_at DESC`

## Ограничения целостности

- `broadcast_slots`: `CHECK (ends_at > starts_at)`
- `favorites`: `UNIQUE (user_id, target_type, target_id)`
- `subscriptions`: `UNIQUE (user_id, target_type, target_id)`
- Каскадное удаление: при удалении канала — слоты и закрепления; при удалении пользователя — избранное/подписки.

## Миграции и сиды

- `npm run migrate` — применяет `schema.sql` (DROP + CREATE).
- `npm run seed` — справочники (жанры, каналы) + тестовые учётки:
  - `admin@tv.local` / `Password123` — администратор
  - `editor@tv.local` / `Password123` — редактор
  - `client@tv.local` / `Password123` — клиент

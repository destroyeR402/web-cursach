-- =====================================================================
--  Расписание телепередач — схема БД (PostgreSQL)
-- =====================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS broadcast_slots CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS channel_editors CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS age_ratings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS session CASCADE;

-- ===== Сессии (connect-pg-simple) =====
CREATE TABLE session (
  sid     VARCHAR    NOT NULL COLLATE "default" PRIMARY KEY,
  sess    JSON       NOT NULL,
  expire  TIMESTAMP(6) NOT NULL
);
CREATE INDEX idx_session_expire ON session (expire);

-- ===== Роли (RBAC) =====
CREATE TABLE roles (
  id    SERIAL PRIMARY KEY,
  code  VARCHAR(32) NOT NULL UNIQUE,
  name  VARCHAR(64) NOT NULL
);

INSERT INTO roles (code, name) VALUES
  ('guest',  'Гость'),
  ('client', 'Клиент'),
  ('editor', 'Редактор сетки'),
  ('admin',  'Системный администратор');

-- ===== Пользователи =====
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  username        VARCHAR(64)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role_id         INTEGER      NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  display_name    VARCHAR(128),
  avatar_path     VARCHAR(255),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMP,
  failed_attempts INTEGER      NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_active ON users(is_active);

-- ===== Возрастные категории =====
CREATE TABLE age_ratings (
  id    SERIAL PRIMARY KEY,
  code  VARCHAR(8) NOT NULL UNIQUE,
  min_age INTEGER NOT NULL,
  description TEXT
);
INSERT INTO age_ratings (code, min_age, description) VALUES
  ('0+',  0,  'Для всех'),
  ('6+',  6,  'Для детей старше 6 лет'),
  ('12+', 12, 'Для детей старше 12 лет'),
  ('16+', 16, 'Для лиц старше 16 лет'),
  ('18+', 18, 'Только для взрослых');

-- ===== Жанры =====
CREATE TABLE genres (
  id    SERIAL PRIMARY KEY,
  code  VARCHAR(32) NOT NULL UNIQUE,
  name  VARCHAR(64) NOT NULL,
  description TEXT
);

-- ===== Каналы =====
CREATE TABLE channels (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(80)  NOT NULL UNIQUE,
  name         VARCHAR(128) NOT NULL,
  description  TEXT,
  logo_path    VARCHAR(255),
  category     VARCHAR(64),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_channels_active ON channels(is_active);

-- ===== Закрепление редакторов за каналами =====
CREATE TABLE channel_editors (
  channel_id  INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- ===== Передачи =====
CREATE TABLE programs (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  poster_path     VARCHAR(255),
  duration_min    INTEGER NOT NULL CHECK (duration_min > 0),
  genre_id        INTEGER REFERENCES genres(id) ON DELETE SET NULL,
  age_rating_id   INTEGER REFERENCES age_ratings(id) ON DELETE SET NULL,
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_programs_genre ON programs(genre_id);
CREATE INDEX idx_programs_title ON programs USING GIN (to_tsvector('russian', title));

-- ===== Слоты вещания (сетка) =====
CREATE TABLE broadcast_slots (
  id            SERIAL PRIMARY KEY,
  channel_id    INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  program_id    INTEGER NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  starts_at     TIMESTAMP NOT NULL,
  ends_at       TIMESTAMP NOT NULL,
  is_published  BOOLEAN   NOT NULL DEFAULT FALSE,
  announcement  TEXT,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_slots_channel_time ON broadcast_slots(channel_id, starts_at);
CREATE INDEX idx_slots_program ON broadcast_slots(program_id);
CREATE INDEX idx_slots_published ON broadcast_slots(is_published, starts_at);

-- ===== Избранное =====
CREATE TABLE favorites (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('channel','program')),
  target_id   INTEGER NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

-- ===== Подписки на уведомления =====
CREATE TABLE subscriptions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('channel','program','genre')),
  target_id   INTEGER NOT NULL,
  notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  notify_push  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

-- ===== Web Push subscriptions =====
CREATE TABLE push_subscriptions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  keys       JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (endpoint)
);

-- ===== Журнал аудита =====
CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(64) NOT NULL,
  entity      VARCHAR(64),
  entity_id   INTEGER,
  meta        JSONB,
  ip          VARCHAR(45),
  user_agent  VARCHAR(255),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

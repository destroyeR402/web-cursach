# Расписание телепередач — курсовая работа

Клиент-серверное веб-приложение для просмотра и управления расписанием телевизионных программ.

**Дисциплина:** Технологии веб-программирования
**Архитектура:** MVC (Model–View–Controller)
**Масштаб:** Глобальная сеть Интернет

## Стек технологий

| Слой | Технология |
| --- | --- |
| Backend | Node.js, Express, REST API (JSON) |
| Frontend | EJS, HTML5, CSS3, JavaScript (ES6+), jQuery |
| База данных | PostgreSQL (реляционная, централизованная) |
| Аутентификация | express-session + JWT, bcrypt, RBAC |
| Загрузка файлов | multer (image/png\|jpeg\|webp, до 5 МБ) |
| Тестирование | Mocha + Chai + Supertest |
| VCS | Git + GitHub |

## Роли пользователей

1. **Гость** — просмотр расписания, поиск, регистрация.
2. **Клиент/Зритель** — избранное, подписки, персональные фильтры.
3. **Редактор сетки** — формирование и публикация сетки закреплённых каналов.
4. **Системный администратор** — управление пользователями, справочниками, аудит.

## Структура проекта

```
kursach_web/
├── backend/
│   ├── config/          # database, multer, jwt
│   ├── controllers/     # auth, guest, client, editor, admin, channel, program, schedule
│   ├── services/        # бизнес-логика
│   ├── models/          # работа с БД (параметризованные SQL-запросы)
│   ├── middlewares/     # auth, rbac, validation, file, error, logger
│   ├── routes/          # REST API
│   ├── utils/           # password, date, response, slug
│   ├── public/          # статика: css, js, images
│   ├── views/           # EJS-шаблоны
│   ├── database/        # schema.sql, migrations, seeds
│   ├── tests/           # unit, integration
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── docs/                # api.md, database.md, deployment.md
└── README.md
```

## Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd kursach_web/backend

# 2. Установить зависимости
npm install

# 3. Настроить окружение
cp .env.example .env
# отредактировать .env под локальную БД

# 4. Создать БД и применить схему
createdb tv_schedule
npm run migrate
npm run seed

# 5. Запустить
npm run dev
# http://localhost:3000
```

## Скрипты npm

| Команда | Назначение |
| --- | --- |
| `npm run dev` | dev-сервер с nodemon |
| `npm start` | production-запуск |
| `npm test` | все тесты |
| `npm run test:unit` | юнит-тесты |
| `npm run test:integration` | интеграционные тесты |
| `npm run migrate` | применить миграции |
| `npm run seed` | заполнить справочники тестовыми данными |

## Документация

- [docs/api.md](docs/api.md) — REST API
- [docs/database.md](docs/database.md) — схема БД, связи, индексы
- [docs/deployment.md](docs/deployment.md) — развёртывание

## Учебные документы

- `docs/Практика_1_ТЗ_*.docx` — техническое задание
- `docs/Практика_2_ЭП_*.docx` — эскизный проект
- `docs/Практика_3_ТП_*.docx` — технический проект
- `metodichki/Указания_для_выполнения_курсовой_2025.pdf`

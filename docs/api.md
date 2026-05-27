# REST API — Расписание телепередач

Базовый URL: `http://localhost:3000`
Формат ответа: JSON `{ ok: boolean, data?, error?, message?, meta? }`
Аутентификация: cookie-сессия (`tv_sched.sid`) **или** Bearer-токен (`Authorization: Bearer <JWT>`).

## Auth — `/auth/*`

| Метод | Путь | Доступ | Описание |
| --- | --- | --- | --- |
| POST | `/auth/register` | guest | Регистрация (email, username, password, displayName) |
| POST | `/auth/login` | guest | Логин (identifier = email \| username, password) |
| POST | `/auth/logout` | any | Выход |
| GET | `/auth/me` | any | Текущий пользователь (или 401) |
| PATCH | `/auth/profile` | auth | Обновить профиль (multipart, поле `avatar`) |

## Guest

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/api/search?q=&genreId=&date=YYYY-MM-DD` | Поиск передач |
| GET | `/api/channels` | Список активных каналов |

## Channels — `/api/channels/*`

| Метод | Путь | Доступ | Описание |
| --- | --- | --- | --- |
| GET | `/api/channels` | any | Все каналы |
| GET | `/api/channels/:id` | any | Канал по ID |
| POST | `/api/channels` | admin | Создать (multipart, `logo`) |
| PATCH | `/api/channels/:id` | editor+ | Обновить (multipart, `logo`) |
| DELETE | `/api/channels/:id` | admin | Удалить |

## Programs — `/api/programs/*`

| Метод | Путь | Доступ | Описание |
| --- | --- | --- | --- |
| GET | `/api/programs?q=&genreId=&limit=&offset=` | any | Список |
| GET | `/api/programs/:id` | any | Передача по ID |
| POST | `/api/programs` | editor+ | Создать (multipart, `poster`) |
| PATCH | `/api/programs/:id` | editor+ | Обновить |
| DELETE | `/api/programs/:id` | editor+ | Архивировать |

## Schedule — `/api/schedule/*`

| Метод | Путь | Доступ | Описание |
| --- | --- | --- | --- |
| GET | `/api/schedule?channelId=&date=&draft=0` | any | Сетка на сутки |
| POST | `/api/schedule/slots` | editor+ | Создать слот (channelId, programId, startsAt, endsAt) |
| PATCH | `/api/schedule/slots/:id` | editor+ | Изменить (со сменой времени → проверка конфликтов) |
| DELETE | `/api/schedule/slots/:id` | editor+ | Удалить (только неопубликованный) |
| POST | `/api/schedule/publish` | editor+ | Опубликовать сутки (channelId, date) |

При конфликте слотов сервер вернёт `409 SLOT_CONFLICT` с массивом `conflicts`.

## Client — `/client/api/*` (требует auth ≥ client)

| Метод | Путь |
| --- | --- |
| GET / POST | `/client/api/favorites` |
| DELETE | `/client/api/favorites/:type/:targetId` |
| GET / POST | `/client/api/subscriptions` |
| DELETE | `/client/api/subscriptions/:type/:targetId` |

## Admin — `/admin/api/*` (требует auth ≥ admin)

| Метод | Путь |
| --- | --- |
| GET | `/admin/api/users` |
| PATCH | `/admin/api/users/:id/role` |
| PATCH | `/admin/api/users/:id/active` |
| POST | `/admin/api/channels/editors` |
| DELETE | `/admin/api/channels/:channelId/editors/:userId` |
| GET | `/admin/api/audit` |

## Коды ошибок

| HTTP | code | Описание |
| --- | --- | --- |
| 400 | VALIDATION_ERROR / INVALID_* | Ошибка валидации |
| 401 | UNAUTHORIZED | Не авторизован |
| 401 | INVALID_CREDENTIALS | Неверный логин/пароль |
| 403 | FORBIDDEN | Недостаточно прав |
| 404 | NOT_FOUND | Ресурс не найден |
| 409 | SLOT_CONFLICT | Пересечение слотов |
| 409 | EMAIL_TAKEN / USERNAME_TAKEN | Дубликат при регистрации |
| 500 | INTERNAL_ERROR | Внутренняя ошибка |

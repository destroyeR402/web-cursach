'use strict';

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // === Жанры ===
    const genres = [
      ['news',    'Новости'],
      ['movie',   'Фильмы'],
      ['series',  'Сериалы'],
      ['sports',  'Спорт'],
      ['kids',    'Детское'],
      ['music',   'Музыка'],
      ['doc',     'Документальные'],
      ['cartoon', 'Мультфильмы'],
      ['talk',    'Ток-шоу'],
    ];
    for (const [code, name] of genres) {
      await client.query(
        'INSERT INTO genres (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
        [code, name]
      );
    }
    const genreMap = {};
    (await client.query('SELECT id, code FROM genres')).rows.forEach((g) => { genreMap[g.code] = g.id; });
    const ageMap = {};
    (await client.query('SELECT id, code FROM age_ratings')).rows.forEach((a) => { ageMap[a.code] = a.id; });

    // === Каналы ===
    const channels = [
      ['channel-one', 'Первый канал',  'Главный информационно-развлекательный канал страны', 'эфирный'],
      ['rossiya-1',   'Россия-1',      'Государственный общедоступный канал',                'эфирный'],
      ['ntv',         'НТВ',           'Информационно-развлекательный',                      'эфирный'],
      ['match-tv',    'Матч ТВ',       'Спортивный канал — футбол, хоккей, биатлон',         'спорт'],
      ['carousel',    'Карусель',      'Детский канал — мультфильмы и передачи для детей',   'детский'],
    ];
    for (const [slug, name, desc, cat] of channels) {
      const logoPath = `/images/channels/${slug}.svg`;
      await client.query(
        `INSERT INTO channels (slug, name, description, category, logo_path)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE SET logo_path = EXCLUDED.logo_path`,
        [slug, name, desc, cat, logoPath]
      );
    }
    const channelMap = {};
    (await client.query('SELECT id, slug FROM channels')).rows.forEach((c) => { channelMap[c.slug] = c.id; });

    // === Пользователи ===
    const passwordHash = await bcrypt.hash('Password123', 10);
    const users = [
      ['admin@tv.local',  'admin',   'admin',  'Администратор'],
      ['editor@tv.local', 'editor',  'editor', 'Редактор сетки'],
      ['client@tv.local', 'client',  'client', 'Тестовый клиент'],
      ['ivan@tv.local',   'ivan',    'client', 'Иван Петров'],
      ['maria@tv.local',  'maria',   'client', 'Мария Сидорова'],
    ];
    for (const [email, username, roleCode, displayName] of users) {
      await client.query(
        `INSERT INTO users (email, username, password_hash, role_id, display_name)
         SELECT $1, $2, $3, r.id, $4 FROM roles r WHERE r.code = $5
         ON CONFLICT (email) DO NOTHING`,
        [email, username, passwordHash, displayName, roleCode]
      );
    }

    // === Закрепить редактора за каналом «Первый канал» и «Россия-1» ===
    const editorUser = (await client.query("SELECT id FROM users WHERE username='editor'")).rows[0];
    if (editorUser) {
      for (const slug of ['channel-one', 'rossiya-1']) {
        await client.query(
          `INSERT INTO channel_editors (channel_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [channelMap[slug], editorUser.id]
        );
      }
    }

    // === Очищаем передачи и слоты (для повторного запуска seed) ===
    await client.query('TRUNCATE broadcast_slots, programs RESTART IDENTITY CASCADE');

    // === Передачи ===
    // структура: title, description, durationMin, genreCode, ageCode
    const programs = [
      // Новости
      ['Утренние новости',       'Главные события к началу дня',                30, 'news',    '12+'],
      ['Время',                  'Главная информационная программа дня',         30, 'news',    '12+'],
      ['Вечерние новости',       'Итоги дня в стране и мире',                    30, 'news',    '12+'],
      ['Сегодня',                'Новости каждый час',                           30, 'news',    '12+'],
      ['Вести',                  'Новости России',                               30, 'news',    '12+'],
      ['Местное время',          'Региональные новости',                         15, 'news',    '6+'],
      ['Чрезвычайное происшествие','Криминальные новости',                       30, 'news',    '18+'],

      // Ток-шоу
      ['Доброе утро',            'Утреннее информационно-развлекательное шоу',   90, 'talk',    '6+'],
      ['Утро России',            'Утренний эфир канала Россия-1',               120, 'talk',    '6+'],
      ['Пусть говорят',          'Социальное ток-шоу с Дмитрием Борисовым',      60, 'talk',    '16+'],
      ['Жди меня',               'Программа поиска людей',                       60, 'talk',    '12+'],
      ['Мужское / Женское',      'Программа о взаимоотношениях',                 60, 'talk',    '16+'],
      ['Поле чудес',             'Капитал-шоу с Леонидом Якубовичем',            60, 'talk',    '0+'],
      ['Малахов',                'Социальное ток-шоу',                           60, 'talk',    '16+'],
      ['Звёзды сошлись',         'Истории из жизни знаменитостей',               90, 'talk',    '16+'],
      ['Кто против?',            'Политическое ток-шоу',                         90, 'talk',    '16+'],

      // Сериалы
      ['След',                   'Криминальный сериал',                          60, 'series',  '16+'],
      ['Морские дьяволы',        'Военно-приключенческий сериал',                60, 'series',  '16+'],

      // Фильмы
      ['Кино года',              'Лучшие фильмы года',                          120, 'movie',   '12+'],
      ['Время кино',             'Премьерные показы',                           120, 'movie',   '16+'],

      // Документальные
      ['Новые русские сенсации', 'Документальное расследование',                 60, 'doc',     '16+'],
      ['Балтийский берег',       'Документальный фильм о Балтике',               90, 'doc',     '12+'],

      // Спорт
      ['Футбол. Чемпионат России','Прямая трансляция матча РПЛ',                120, 'sports',  '6+'],
      ['Хоккей. КХЛ',            'Прямая трансляция матча КХЛ',                 150, 'sports',  '6+'],
      ['Биатлон. Кубок мира',    'Этап Кубка мира по биатлону',                  60, 'sports',  '6+'],
      ['Все на Матч!',           'Спортивная аналитика',                         30, 'sports',  '6+'],
      ['Спортивный обзор',       'Главные события мира спорта',                  30, 'sports',  '6+'],

      // Детское / Мультфильмы
      ['Спокойной ночи, малыши!','Старейшая детская передача',                   15, 'kids',    '0+'],
      ['Лунтик и его друзья',    'Российский мультсериал',                       30, 'cartoon', '0+'],
      ['Маша и Медведь',         'Популярный мультсериал',                       30, 'cartoon', '0+'],
      ['Тачки',                  'Полнометражный мультфильм Pixar',              90, 'cartoon', '0+'],
      ['Шоу Тома и Джерри',      'Классический мультсериал',                     30, 'cartoon', '0+'],
      ['Фиксики',                'Познавательный мультсериал',                   30, 'cartoon', '0+'],

      // Музыка
      ['Большой концерт',        'Концерт российских исполнителей',              90, 'music',   '12+'],
      ['Романтика романса',      'Музыкальная программа',                        60, 'music',   '12+'],
    ];
    const programIds = {};
    for (const [title, desc, duration, genreCode, ageCode] of programs) {
      const posterPath = `/images/programs/genre-${genreCode}.svg`;
      const { rows } = await client.query(
        `INSERT INTO programs (title, description, duration_min, genre_id, age_rating_id, poster_path)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [title, desc, duration, genreMap[genreCode], ageMap[ageCode], posterPath]
      );
      programIds[title] = rows[0].id;
    }
    console.log(`[seed] добавлено передач: ${Object.keys(programIds).length}`);

    // === Сетка вещания на 3 дня вперёд (со вчера, сегодня, завтра) ===
    // Шаблоны: для каждого канала список [час, минута, название_передачи]
    // Длительность берётся из самой передачи
    const dailyGrids = {
      'channel-one': [
        [ 6,  0, 'Утренние новости'],
        [ 6, 30, 'Доброе утро'],
        [ 8,  0, 'Лунтик и его друзья'],
        [ 8, 30, 'Жди меня'],
        [ 9, 30, 'Пусть говорят'],
        [10, 30, 'След'],
        [11, 30, 'Поле чудес'],
        [12, 30, 'Время'],
        [13,  0, 'Мужское / Женское'],
        [14,  0, 'Большой концерт'],
        [15, 30, 'Кино года'],
        [17, 30, 'Звёзды сошлись'],
        [19,  0, 'Время'],
        [19, 30, 'Малахов'],
        [20, 30, 'Время кино'],
        [22, 30, 'Поле чудес'],
        [23, 30, 'Вечерние новости'],
      ],
      'rossiya-1': [
        [ 5, 45, 'Местное время'],
        [ 6,  0, 'Утро России'],
        [ 8,  0, 'Фиксики'],
        [ 8, 30, 'Утренние новости'],
        [ 9,  0, 'Романтика романса'],
        [10,  0, 'Морские дьяволы'],
        [11,  0, 'Кто против?'],
        [12, 30, 'Вести'],
        [13,  0, 'Балтийский берег'],
        [14, 30, 'Малахов'],
        [15, 30, 'Время кино'],
        [17, 30, 'Жди меня'],
        [18, 30, 'Местное время'],
        [18, 45, 'Вести'],
        [19, 15, 'Кто против?'],
        [20, 45, 'Кино года'],
        [22, 45, 'Большой концерт'],
      ],
      'ntv': [
        [ 6,  0, 'Сегодня'],
        [ 6, 30, 'Доброе утро'],
        [ 8,  0, 'Чрезвычайное происшествие'],
        [ 8, 30, 'Морские дьяволы'],
        [ 9, 30, 'След'],
        [10, 30, 'Новые русские сенсации'],
        [11, 30, 'Сегодня'],
        [12,  0, 'Пусть говорят'],
        [13,  0, 'Чрезвычайное происшествие'],
        [13, 30, 'Морские дьяволы'],
        [14, 30, 'След'],
        [15, 30, 'Звёзды сошлись'],
        [17,  0, 'Новые русские сенсации'],
        [18,  0, 'Сегодня'],
        [18, 30, 'След'],
        [19, 30, 'Время кино'],
        [21, 30, 'Чрезвычайное происшествие'],
        [22,  0, 'Сегодня'],
      ],
      'match-tv': [
        [ 7,  0, 'Все на Матч!'],
        [ 7, 30, 'Спортивный обзор'],
        [ 8,  0, 'Биатлон. Кубок мира'],
        [ 9,  0, 'Все на Матч!'],
        [ 9, 30, 'Футбол. Чемпионат России'],
        [11, 30, 'Спортивный обзор'],
        [12,  0, 'Хоккей. КХЛ'],
        [14, 30, 'Все на Матч!'],
        [15,  0, 'Биатлон. Кубок мира'],
        [16,  0, 'Спортивный обзор'],
        [16, 30, 'Футбол. Чемпионат России'],
        [18, 30, 'Все на Матч!'],
        [19,  0, 'Хоккей. КХЛ'],
        [21, 30, 'Все на Матч!'],
        [22,  0, 'Спортивный обзор'],
      ],
      'carousel': [
        [ 6,  0, 'Маша и Медведь'],
        [ 6, 30, 'Лунтик и его друзья'],
        [ 7,  0, 'Фиксики'],
        [ 7, 30, 'Шоу Тома и Джерри'],
        [ 8,  0, 'Тачки'],
        [ 9, 30, 'Маша и Медведь'],
        [10,  0, 'Лунтик и его друзья'],
        [10, 30, 'Фиксики'],
        [11,  0, 'Шоу Тома и Джерри'],
        [11, 30, 'Тачки'],
        [13,  0, 'Маша и Медведь'],
        [13, 30, 'Лунтик и его друзья'],
        [14,  0, 'Фиксики'],
        [14, 30, 'Тачки'],
        [16,  0, 'Маша и Медведь'],
        [16, 30, 'Шоу Тома и Джерри'],
        [17,  0, 'Лунтик и его друзья'],
        [17, 30, 'Фиксики'],
        [18,  0, 'Тачки'],
        [19, 30, 'Спокойной ночи, малыши!'],
        [19, 45, 'Маша и Медведь'],
        [20, 15, 'Лунтик и его друзья'],
      ],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 2 недели назад → 3 дня вперёд
    const dayOffsets = [];
    for (let i = -14; i <= 3; i++) dayOffsets.push(i);
    let totalSlots = 0;
    let publishedSlots = 0;

    for (const offset of dayOffsets) {
      const dayDate = new Date(today);
      dayDate.setDate(dayDate.getDate() + offset);

      for (const [slug, grid] of Object.entries(dailyGrids)) {
        const channelId = channelMap[slug];
        if (!channelId) continue;

        for (const [hour, minute, programTitle] of grid) {
          const programId = programIds[programTitle];
          if (!programId) {
            console.warn(`[seed] WARN: передача "${programTitle}" не найдена`);
            continue;
          }
          const { rows: progRow } = await client.query(
            'SELECT duration_min FROM programs WHERE id = $1', [programId]
          );
          const durationMin = progRow[0].duration_min;

          const startsAt = new Date(dayDate);
          startsAt.setHours(hour, minute, 0, 0);
          const endsAt = new Date(startsAt.getTime() + durationMin * 60000);

          // публикуем всё, кроме слотов «послезавтра» — те остаются в черновике
          const isPublished = offset < 2;

          await client.query(
            `INSERT INTO broadcast_slots (channel_id, program_id, starts_at, ends_at, is_published, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [channelId, programId, startsAt, endsAt, isPublished, editorUser?.id || null]
          );
          totalSlots++;
          if (isPublished) publishedSlots++;
        }
      }
    }
    console.log(`[seed] слотов вещания: ${totalSlots} (опубликовано: ${publishedSlots}, в черновиках: ${totalSlots - publishedSlots})`);

    // === Тестовое избранное и подписки ===
    const ivan = (await client.query("SELECT id FROM users WHERE username='ivan'")).rows[0];
    if (ivan) {
      for (const slug of ['channel-one', 'match-tv']) {
        await client.query(
          `INSERT INTO favorites (user_id, target_type, target_id) VALUES ($1, 'channel', $2)
           ON CONFLICT DO NOTHING`,
          [ivan.id, channelMap[slug]]
        );
      }
      await client.query(
        `INSERT INTO subscriptions (user_id, target_type, target_id, notify_email)
         VALUES ($1, 'channel', $2, TRUE) ON CONFLICT DO NOTHING`,
        [ivan.id, channelMap['channel-one']]
      );
    }

    await client.query('COMMIT');
    console.log('');
    console.log('[seed] ✅ ГОТОВО');
    console.log('[seed] Учётки (пароль у всех: Password123):');
    console.log('  · admin@tv.local   — администратор');
    console.log('  · editor@tv.local  — редактор сетки (закреплён за «Первым каналом» и «Россия-1»)');
    console.log('  · client@tv.local  — клиент');
    console.log('  · ivan@tv.local    — клиент с избранным и подпиской');
    console.log('  · maria@tv.local   — клиент (пустой)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] ОШИБКА:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

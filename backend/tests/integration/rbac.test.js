'use strict';

const request = require('supertest');
const { expect } = require('chai');

describe('RBAC — разграничение доступа по ролям', () => {
  let app;
  before(() => { process.env.NODE_ENV = 'test'; app = require('../../server'); });

  describe('Гость (без авторизации)', () => {
    it('может зайти на главную', async () => {
      const res = await request(app).get('/');
      expect(res.status).to.equal(200);
    });

    it('может искать передачи', async () => {
      const res = await request(app).get('/search');
      expect(res.status).to.equal(200);
    });

    it('может получить список каналов через API', async () => {
      const res = await request(app).get('/api/channels');
      expect(res.status).to.equal(200);
      expect(res.body.ok).to.equal(true);
    });

    it('НЕ может зайти в личный кабинет → редирект на /auth/login', async () => {
      const res = await request(app).get('/client/dashboard');
      expect(res.status).to.equal(302);
      expect(res.headers.location).to.match(/^\/auth\/login/);
    });

    it('НЕ может зайти в админку → редирект на /auth/login', async () => {
      const res = await request(app).get('/admin/users');
      expect(res.status).to.equal(302);
    });

    it('НЕ может создать передачу через API → 401', async () => {
      const res = await request(app)
        .post('/api/programs')
        .send({ title: 'хакерская передача', durationMin: 30 });
      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal('UNAUTHORIZED');
    });

    it('НЕ может удалить канал через API → 401', async () => {
      const res = await request(app).delete('/api/channels/1');
      expect(res.status).to.equal(401);
    });
  });

  describe('Авторизованный клиент', () => {
    let agent;
    before(async () => {
      agent = request.agent(app);
      const res = await agent.post('/auth/login')
        .send({ identifier: 'client@tv.local', password: 'Password123' })
        .set('Accept', 'application/json');
      // 302 (редирект) или 200 — оба ОК для логина
      expect([200, 302]).to.include(res.status);
    });

    it('может зайти в личный кабинет', async () => {
      const res = await agent.get('/client/dashboard');
      expect(res.status).to.equal(200);
    });

    it('может посмотреть список своего избранного', async () => {
      const res = await agent.get('/client/api/favorites');
      expect(res.status).to.equal(200);
      expect(res.body.ok).to.equal(true);
      expect(res.body.data).to.be.an('array');
    });

    it('НЕ может зайти в админку → 403', async () => {
      const res = await agent.get('/admin/api/users');
      expect(res.status).to.equal(403);
      expect(res.body.error).to.equal('FORBIDDEN');
    });

    it('НЕ может создать передачу → 403', async () => {
      const res = await agent.post('/api/programs')
        .send({ title: 'тест', durationMin: 30 });
      expect(res.status).to.equal(403);
    });
  });

  describe('Редактор', () => {
    let agent;
    before(async () => {
      agent = request.agent(app);
      await agent.post('/auth/login')
        .send({ identifier: 'editor@tv.local', password: 'Password123' });
    });

    it('может зайти в редактор сетки', async () => {
      const res = await agent.get('/admin/grid');
      expect(res.status).to.equal(200);
    });

    it('может зайти в управление передачами', async () => {
      const res = await agent.get('/admin/programs');
      expect(res.status).to.equal(200);
    });

    it('НЕ может зайти в управление пользователями (только admin)', async () => {
      const res = await agent.get('/admin/api/users');
      expect(res.status).to.equal(403);
    });
  });

  describe('Администратор', () => {
    let agent;
    before(async () => {
      agent = request.agent(app);
      await agent.post('/auth/login')
        .send({ identifier: 'admin@tv.local', password: 'Password123' });
    });

    it('может зайти во все разделы админки', async () => {
      for (const url of ['/admin/users', '/admin/channels', '/admin/programs', '/admin/logs', '/admin/grid']) {
        const res = await agent.get(url);
        expect(res.status, `URL: ${url}`).to.equal(200);
      }
    });

    it('может получить список пользователей через API', async () => {
      const res = await agent.get('/admin/api/users');
      expect(res.status).to.equal(200);
      expect(res.body.ok).to.equal(true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.meta).to.have.property('total');
    });

    it('может получить журнал аудита', async () => {
      const res = await agent.get('/admin/api/audit');
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });
});

describe('Аутентификация — полный flow', () => {
  let app;
  before(() => { app = require('../../server'); });

  it('логин с неверным паролем → 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app).post('/auth/login')
      .send({ identifier: 'admin@tv.local', password: 'wrong-password' })
      .set('Accept', 'application/json');
    expect(res.status).to.equal(401);
    expect(res.body.error).to.equal('INVALID_CREDENTIALS');
  });

  it('логин несуществующего пользователя → 401', async () => {
    const res = await request(app).post('/auth/login')
      .send({ identifier: 'nobody@nowhere.zz', password: 'whatever' })
      .set('Accept', 'application/json');
    expect(res.status).to.equal(401);
  });

  it('логин без пароля → 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/auth/login')
      .send({ identifier: 'admin@tv.local' })
      .set('Accept', 'application/json');
    expect(res.status).to.equal(400);
  });

  it('GET /auth/me без сессии → 401', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).to.equal(401);
  });

  it('после логина GET /auth/me возвращает пользователя', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login')
      .send({ identifier: 'admin@tv.local', password: 'Password123' });
    const res = await agent.get('/auth/me');
    expect(res.status).to.equal(200);
    expect(res.body.data.user.username).to.equal('admin');
    expect(res.body.data.user.role).to.equal('admin');
    expect(res.body.data.user).to.not.have.property('password_hash');
  });
});

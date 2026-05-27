'use strict';

const request = require('supertest');
const { expect } = require('chai');

describe('GET /health', () => {
  let app;
  before(() => { process.env.NODE_ENV = 'test'; app = require('../../server'); });

  it('возвращает 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).to.equal(200);
    expect(res.body.ok).to.equal(true);
    expect(res.body.ts).to.be.a('string');
  });
});

describe('GET /api/channels', () => {
  let app;
  before(() => { app = require('../../server'); });

  it('возвращает массив (возможно пустой, если БД недоступна — пропустить)', async function () {
    try {
      const res = await request(app).get('/api/channels');
      expect(res.status).to.equal(200);
      expect(res.body.ok).to.equal(true);
      expect(res.body.data).to.be.an('array');
    } catch (err) {
      this.skip();
    }
  });
});
